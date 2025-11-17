import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { readFileSync } from "fs";
import { join } from "path";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { createClient } from "@/lib/supabase/server";
import { getUserApiKey } from "@/lib/api-keys";

// Read the system prompt from the file
const getSystemPrompt = () => {
  try {
    const filePath = join(process.cwd(), "prompts", "subject.txt");
    return readFileSync(filePath, "utf-8");
  } catch (error) {
    console.error("Error reading subject.txt:", error);
    // Fallback prompt if file can't be read
    return `You are an elite email marketing specialist with deep expertise in email deliverability, spam filter algorithms, and subject line optimization. Your mission is to analyze ONE email subject line and rewrite it to maximize inbox placement, open rates, and engagement while completely eliminating spam triggers.

When I provide you with ONE subject line, you will evaluate it against established best practices and rewrite it into deliverable alternatives. You will maintain the core message and intent while transforming the vocabulary, structure, and formatting to bypass spam filters and appeal to human recipients.

CRITICAL: You will receive ONE subject line at a time. For that ONE subject line, you MUST generate EXACTLY 20 (twenty) rewritten alternatives. Format your response as a JSON object (NOT an array) with:
- "original": the original subject line exactly as provided
- "rewritten": an array of EXACTLY 20 rewritten alternatives (no more, no less)
- "changes": a brief explanation of what was corrected

Example format:
{
  "original": "FREE SHIPPING TODAY!!!",
  "rewritten": [
    "Complimentary delivery available",
    "Free shipping this week",
    ...exactly 20 total alternatives...
  ],
  "changes": "Removed all-caps, replaced FREE with complimentary, eliminated excessive punctuation"
}

Remember: You are processing ONE subject line and must return EXACTLY 20 alternatives for that single subject line.`;
  }
};

const SYSTEM_PROMPT = getSystemPrompt();

// Get environment variables
const PROMPT_VERSION = process.env.PROMPT_VERSION || "v1.0";
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
// Note: We do NOT use GOOGLE_API_KEY from environment - we require users to provide their own API key

// Rate limit configuration
const RATE_LIMIT_MAX = 5; // 5 tries per hour
const RATE_LIMIT_WINDOW = 3600; // 1 hour in seconds

// Initialize Redis client
const redis = REDIS_URL && REDIS_TOKEN
  ? new Redis({
      url: REDIS_URL,
      token: REDIS_TOKEN,
    })
  : null;

// Helper function to get client identifier (IP address or user ID)
const getClientId = (request: NextRequest): string => {
  // Try to get IP from headers (works with Vercel and most proxies)
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwardedFor?.split(",")[0] || realIp || "unknown";
  
  return `subject-rewrite:${ip}`;
};

// Rate limiting function
const checkRateLimit = async (clientId: string): Promise<{ allowed: boolean; remaining: number; resetAt: number }> => {
  if (!redis) {
    // If Redis is not available, allow the request (for development)
    return { allowed: true, remaining: RATE_LIMIT_MAX, resetAt: Date.now() + RATE_LIMIT_WINDOW * 1000 };
  }

  try {
    const key = `rate-limit:${clientId}`;
    const current = await redis.get<number>(key);

    if (current === null) {
      // First request - set the counter
      await redis.set(key, 1, { ex: RATE_LIMIT_WINDOW });
      return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetAt: Date.now() + RATE_LIMIT_WINDOW * 1000 };
    }

    if (current >= RATE_LIMIT_MAX) {
      // Rate limit exceeded
      const ttl = await redis.ttl(key);
      return { allowed: false, remaining: 0, resetAt: Date.now() + ttl * 1000 };
    }

    // Increment counter
    await redis.incr(key);
    const remaining = RATE_LIMIT_MAX - (current + 1);
    const ttl = await redis.ttl(key);
    return { allowed: true, remaining, resetAt: Date.now() + ttl * 1000 };
  } catch (error) {
    console.error("Redis rate limit error:", error);
    // On error, allow the request
    return { allowed: true, remaining: RATE_LIMIT_MAX, resetAt: Date.now() + RATE_LIMIT_WINDOW * 1000 };
  }
};

export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const clientId = getClientId(request);
    const rateLimit = await checkRateLimit(clientId);

    if (!rateLimit.allowed) {
      const resetDate = new Date(rateLimit.resetAt);
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: `You have reached the limit of ${RATE_LIMIT_MAX} requests per hour. Please try again after ${resetDate.toLocaleTimeString()}.`,
          resetAt: rateLimit.resetAt,
          remaining: 0,
        },
        { status: 429 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { subjects } = body;

    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return NextResponse.json(
        { error: "Subjects array is required and must not be empty" },
        { status: 400 }
      );
    }

    // Validate that all subjects are strings
    if (!subjects.every((s: any) => typeof s === "string" && s.trim().length > 0)) {
      return NextResponse.json(
        { error: "All subjects must be non-empty strings" },
        { status: 400 }
      );
    }

    // Get API key: MUST use user's key if authenticated, never fall back to environment variable
    let apiKeyToUse: string | null = null;
    let apiKeySource = "user";
    
    try {
      const supabase = await createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error("Auth error:", authError);
        return NextResponse.json(
          { 
            error: "Authentication required. Please log in to use this feature." 
          },
          { status: 401 }
        );
      }

      if (!user) {
        return NextResponse.json(
          { 
            error: "Authentication required. Please log in to use this feature." 
          },
          { status: 401 }
        );
      }

      // MUST get user's API key - no fallback to environment variable
      const userApiKey = await getUserApiKey(user.id, "gemini");
      if (!userApiKey) {
        return NextResponse.json(
          { 
            error: "No API key configured. Please add your Gemini API key in Settings to use this feature." 
          },
          { status: 400 }
        );
      }

      apiKeyToUse = userApiKey;
      console.log(`Using user API key for user ${user.id}`);
    } catch (error) {
      console.error("Error getting user API key:", error);
      return NextResponse.json(
        { 
          error: "Failed to retrieve your API key. Please check your Settings." 
        },
        { status: 500 }
      );
    }

    // Validate API key is available
    if (!apiKeyToUse) {
      return NextResponse.json(
        { 
          error: "No API key configured. Please add your Gemini API key in Settings." 
        },
        { status: 400 }
      );
    }

    // Prepare the prompt for the AI
    // Process each subject individually to ensure we get 20 alternatives per subject
    const results: any[] = [];
    
    for (let i = 0; i < subjects.length; i++) {
      const subject = subjects[i];
      const subjectNumber = i + 1;
      const totalSubjects = subjects.length;
      
      const userPrompt = `You are rewriting ONE SINGLE subject line. This is subject ${subjectNumber} of ${totalSubjects} total subjects.

CRITICAL REQUIREMENTS - READ CAREFULLY:
1. You are processing ONLY ONE subject line: "${subject.replace(/"/g, '\\"')}"
2. You MUST generate EXACTLY 20 (twenty) rewritten alternatives for THIS ONE subject line
3. Each alternative must be unique, optimized, and different from the others
4. Return ONLY a JSON object (NOT an array) with this EXACT structure:

{
  "original": "${subject.replace(/"/g, '\\"')}",
  "rewritten": [
    "alternative 1",
    "alternative 2",
    "alternative 3",
    "alternative 4",
    "alternative 5",
    "alternative 6",
    "alternative 7",
    "alternative 8",
    "alternative 9",
    "alternative 10",
    "alternative 11",
    "alternative 12",
    "alternative 13",
    "alternative 14",
    "alternative 15",
    "alternative 16",
    "alternative 17",
    "alternative 18",
    "alternative 19",
    "alternative 20"
  ],
  "changes": "brief explanation of what was corrected"
}

Subject line to rewrite:
"${subject.replace(/"/g, '\\"')}"

MANDATORY REQUIREMENTS:
- The "rewritten" array MUST contain EXACTLY 20 strings - no more, no less
- Do NOT return an array of objects - return a SINGLE object
- Each of the 20 alternatives must be a unique, optimized subject line
- All 20 alternatives should be optimized for deliverability, engagement, and spam filter avoidance
- Count your alternatives: you must provide exactly 20, not 19, not 21, but exactly 20`;

      // Create Google provider with the API key
      const googleProvider = createGoogleGenerativeAI({
        apiKey: apiKeyToUse!,
      });

      // Call Google Gemini API with retry logic
      let result;
      const maxRetries = 3;
      let lastError: any = null;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          result = await generateText({
            model: googleProvider("gemini-2.5-flash"),
            system: SYSTEM_PROMPT,
            prompt: userPrompt,
            temperature: 0.7,
          });
          break;
        } catch (error: any) {
          lastError = error;
          console.error(`Google Gemini API error for subject ${subjectNumber} (attempt ${attempt + 1}/${maxRetries + 1}):`, error);
          
          if (error?.statusCode === 401 || error?.status === 401) {
            return NextResponse.json(
              { error: `Invalid Google API key (source: ${apiKeySource}). Please check your API key in Settings or your GOOGLE_GENERATIVE_AI_API_KEY environment variable.` },
              { status: 500 }
            );
          }
          
          // Handle overloaded model errors (should retry)
          if (error?.message?.includes("overloaded") || error?.message?.toLowerCase().includes("model is overloaded")) {
            if (attempt < maxRetries) {
              // Longer backoff for overloaded: 2s, 4s, 8s
              const delayMs = Math.pow(2, attempt + 1) * 1000;
              console.log(`Model overloaded. Retrying in ${delayMs}ms...`);
              await new Promise((resolve) => setTimeout(resolve, delayMs));
              continue;
            } else {
              return NextResponse.json(
                { error: "The Gemini model is currently overloaded. Please try again in a few moments." },
                { status: 503 }
              );
            }
          }

          if (error?.statusCode === 429 || error?.status === 429 || error?.message?.includes("quota") || error?.message?.includes("billing")) {
            if (attempt < maxRetries) {
              const delayMs = Math.pow(2, attempt) * 1000;
              console.log(`Rate limit/quota error. Retrying in ${delayMs}ms...`);
              await new Promise((resolve) => setTimeout(resolve, delayMs));
              continue;
            } else {
              return NextResponse.json(
                { error: `Google API quota exceeded or rate limit reached (using ${apiKeySource} API key). Please check your billing and try again later.` },
                { status: 500 }
              );
            }
          }
          
          if (error?.statusCode === 500 || error?.statusCode === 503 || error?.status === 500 || error?.status === 503) {
            if (attempt < maxRetries) {
              const delayMs = Math.pow(2, attempt) * 1000;
              console.log(`Server error. Retrying in ${delayMs}ms...`);
              await new Promise((resolve) => setTimeout(resolve, delayMs));
              continue;
            } else {
              return NextResponse.json(
                { error: "Google API is temporarily unavailable. Please try again later." },
                { status: 500 }
              );
            }
          }

          const errorMessage = error?.message || "Google Gemini API request failed";
          return NextResponse.json(
            { error: `Google Gemini API error: ${errorMessage}` },
            { status: 500 }
          );
        }
      }

      if (!result) {
        if (lastError?.message?.includes("overloaded") || lastError?.message?.toLowerCase().includes("model is overloaded")) {
          return NextResponse.json(
            { error: "The Gemini model is currently overloaded. Please try again in a few moments." },
            { status: 503 }
          );
        }
        if (lastError?.statusCode === 429 || lastError?.status === 429 || lastError?.message?.includes("quota")) {
          return NextResponse.json(
            { error: `Google API quota exceeded or rate limit reached (using ${apiKeySource} API key). Please try again in a few moments.` },
            { status: 500 }
          );
        }
        return NextResponse.json(
          { error: "Failed to connect to Google Gemini API after multiple attempts. Please try again later." },
          { status: 500 }
        );
      }

      // Parse the AI response for this subject
      let parsedResult;
      try {
        // Try to extract JSON from the response (in case there's extra text)
        const text = result.text.trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[0]);
        } else {
          parsedResult = JSON.parse(text);
        }
      } catch (parseError) {
        console.error(`Failed to parse AI response for subject ${subjectNumber}:`, result.text);
        return NextResponse.json(
          { error: `Failed to parse AI response for subject ${subjectNumber}. The model may not have returned valid JSON.` },
          { status: 500 }
        );
      }

      // Validate the parsed result
      if (!parsedResult || typeof parsedResult !== "object") {
        return NextResponse.json(
          { error: `Invalid response format for subject ${subjectNumber}. Expected an object.` },
          { status: 500 }
        );
      }

      // Ensure we have the required fields
      if (!parsedResult.original || !Array.isArray(parsedResult.rewritten)) {
        return NextResponse.json(
          { error: `Invalid response structure for subject ${subjectNumber}. Missing 'original' or 'rewritten' fields.` },
          { status: 500 }
        );
      }

      // CRITICAL: Ensure we have exactly 20 alternatives
      if (parsedResult.rewritten.length !== 20) {
        console.error(`Subject ${subjectNumber} returned ${parsedResult.rewritten.length} alternatives, expected exactly 20`);
        return NextResponse.json(
          { 
            error: `Failed to generate exactly 20 alternatives for subject ${subjectNumber}. Received ${parsedResult.rewritten.length} alternatives instead. Please try again.` 
          },
          { status: 500 }
        );
      }

      // Validate that all alternatives are non-empty strings
      const invalidAlternatives = parsedResult.rewritten.filter((alt: any) => typeof alt !== "string" || alt.trim().length === 0);
      if (invalidAlternatives.length > 0) {
        return NextResponse.json(
          { 
            error: `Invalid alternatives found for subject ${subjectNumber}. All 20 alternatives must be non-empty strings.` 
          },
          { status: 500 }
        );
      }

      results.push(parsedResult);
      
      // Add a small delay between requests to avoid rate limiting
      if (i < subjects.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    return NextResponse.json({
      results: results,
      rateLimit: {
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt,
      },
    });
  } catch (error: any) {
    console.error("Error in subject-rewrite API:", error);
    const errorMessage = error?.message || "An unexpected error occurred";
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}

