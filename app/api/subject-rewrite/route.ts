import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { readFileSync } from "fs";
import { join } from "path";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

// Read the system prompt from the file
const getSystemPrompt = () => {
  try {
    const filePath = join(process.cwd(), "prompts", "subject.txt");
    return readFileSync(filePath, "utf-8");
  } catch (error) {
    console.error("Error reading subject.txt:", error);
    // Fallback prompt if file can't be read
    return `You are an elite email marketing specialist with deep expertise in email deliverability, spam filter algorithms, and subject line optimization. Your mission is to analyze a list of email subject lines and rewrite each one to maximize inbox placement, open rates, and engagement while completely eliminating spam triggers.

When I provide you with a list of subject lines, you will evaluate each one against established best practices and rewrite any problematic subjects into deliverable alternatives. You will maintain the core message and intent while transforming the vocabulary, structure, and formatting to bypass spam filters and appeal to human recipients.

IMPORTANT: Generate exactly 20 rewritten subject lines for each input subject line. Format your response as a JSON array of objects, where each object has:
- "original": the original subject line
- "rewritten": an array of exactly 20 rewritten alternatives
- "changes": a brief explanation of what was corrected

Example format:
[
  {
    "original": "FREE SHIPPING TODAY!!!",
    "rewritten": ["Complimentary delivery available", "Free shipping this week", ...20 total...],
    "changes": "Removed all-caps, replaced FREE with complimentary, eliminated excessive punctuation"
  }
]`;
  }
};

const SYSTEM_PROMPT = getSystemPrompt();

// Get environment variables
const PROMPT_VERSION = process.env.PROMPT_VERSION || "v1.0";
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const GOOGLE_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

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

    // Validate Google API key is configured
    if (!GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: "Google API key is not configured. Please set GOOGLE_GENERATIVE_AI_API_KEY in your environment variables." },
        { status: 500 }
      );
    }

    // Prepare the prompt for the AI
    const subjectsList = subjects.map((s: string, i: number) => `${i + 1}. ${s}`).join("\n");
    const userPrompt = `Please rewrite the following ${subjects.length} subject line(s) according to the guidelines. Generate exactly 20 rewritten alternatives for each subject line.

Subject lines to rewrite:
${subjectsList}

IMPORTANT: Return your response as a valid JSON array. Each object in the array must have:
- "original": the original subject line exactly as provided
- "rewritten": an array of exactly 20 rewritten alternatives
- "changes": a brief explanation of what was corrected

Format:
[
  {
    "original": "subject line 1",
    "rewritten": ["alternative 1", "alternative 2", ...20 total...],
    "changes": "explanation"
  },
  {
    "original": "subject line 2",
    "rewritten": ["alternative 1", "alternative 2", ...20 total...],
    "changes": "explanation"
  }
]`;

    // Call Google Gemini API with retry logic
    let result;
    const maxRetries = 3;
    let lastError: any = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        result = await generateText({
          model: google("gemini-2.5-flash"),
          system: SYSTEM_PROMPT,
          prompt: userPrompt,
          temperature: 0.7,
        });
        break;
      } catch (error: any) {
        lastError = error;
        console.error(`Google Gemini API error (attempt ${attempt + 1}/${maxRetries + 1}):`, error);
        
        if (error?.statusCode === 401 || error?.status === 401) {
          return NextResponse.json(
            { error: "Invalid Google API key. Please check your GOOGLE_GENERATIVE_AI_API_KEY environment variable." },
            { status: 500 }
          );
        }
        
        if (error?.statusCode === 429 || error?.status === 429 || error?.message?.includes("quota") || error?.message?.includes("billing")) {
          if (attempt < maxRetries) {
            const delayMs = Math.pow(2, attempt) * 1000;
            console.log(`Rate limit/quota error. Retrying in ${delayMs}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            continue;
          } else {
            return NextResponse.json(
              { error: "Google API quota exceeded or rate limit reached. Please check your billing and try again later." },
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
      if (lastError?.statusCode === 429 || lastError?.status === 429 || lastError?.message?.includes("quota")) {
        return NextResponse.json(
          { error: "Google API quota exceeded or rate limit reached. Please try again in a few moments." },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: "Failed to connect to Google Gemini API after multiple attempts. Please try again later." },
        { status: 500 }
      );
    }

    // Parse the AI response
    let parsedResult;
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const text = result.text.trim();
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        parsedResult = JSON.parse(text);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", result.text);
      return NextResponse.json(
        { error: "Failed to parse AI response. The model may not have returned valid JSON." },
        { status: 500 }
      );
    }

    // Validate the parsed result
    if (!Array.isArray(parsedResult)) {
      return NextResponse.json(
        { error: "Invalid response format. Expected an array of results." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      results: parsedResult,
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

