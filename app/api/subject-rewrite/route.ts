import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import { createClient } from "@/lib/supabase/server";
import { getUserApiKey, type ApiKeyProvider } from "@/lib/api-keys";
import {
  generateTextWithProvider,
  getDefaultModel,
  type AIModel,
} from "@/lib/ai-providers";
import { logToolRun, logToolError } from "@/lib/analytics/usage-events";

const TOOL_SLUG = "/subject-rewrite";

// Read the system prompt from the file
const getSystemPrompt = () => {
  try {
    const filePath = join(process.cwd(), "prompts", "subject.txt");
    return readFileSync(filePath, "utf-8");
  } catch (error) {
    console.error("Error reading subject.txt:", error);
    // Fallback prompt if file can't be read
    return `You are an elite email marketing specialist with deep expertise in email deliverability, spam filter algorithms, and subject line optimization. Your mission is to analyze a collection of email subject lines together and synthesize them into optimized alternatives that maximize inbox placement, open rates, and engagement while completely eliminating spam triggers.

When I provide you with multiple subject lines, you will analyze them collectively to identify common themes, patterns, and value propositions. You will then generate exactly 10 (ten) optimized subject line alternatives that capture the best elements from all the input subjects while applying all spam-filter avoidance techniques.

CRITICAL: You will receive multiple subject lines to analyze together. You MUST generate EXACTLY 10 (ten) optimized alternatives total - no more, no less. Format your response as a JSON object with:
- "rewritten": an array of EXACTLY 10 optimized subject lines (no more, no less)

Example format:
{
  "rewritten": [
    "First optimized subject line",
    "Second optimized subject line",
    "Third optimized subject line",
    "Fourth optimized subject line",
    "Fifth optimized subject line",
    "Sixth optimized subject line",
    "Seventh optimized subject line",
    "Eighth optimized subject line",
    "Ninth optimized subject line",
    "Tenth optimized subject line"
  ]
}

Remember: You are analyzing ALL input subjects together and must return EXACTLY 10 alternatives total that synthesize the best elements from all of them.`;
  }
};

const SYSTEM_PROMPT = getSystemPrompt();

import { Redis } from "@upstash/redis";

// Get environment variables
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
// Note: We do NOT use API keys from environment - we require users to provide their own API keys

// Rate limit configuration
const RATE_LIMIT_MAX = 5; // 5 tries per hour
const RATE_LIMIT_WINDOW = 3600; // 1 hour in seconds

// Initialize Redis client for rate limiting
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
  const startedAt = Date.now();
  let userId: string | null = null;
  let provider: ApiKeyProvider = "gemini";
  let selectedModel: AIModel | null = null;

  /**
   * Record the failure, then return it, so every error path is measured
   */
  const respondWithError = async (
    errorCode: string,
    body: Record<string, unknown>,
    status: number
  ) => {
    await logToolError({
      userId,
      toolSlug: TOOL_SLUG,
      provider,
      model: selectedModel,
      durationMs: Date.now() - startedAt,
      errorCode,
    });

    return NextResponse.json(body, { status });
  };

  try {
    // Check rate limit
    const clientId = getClientId(request);
    const rateLimit = await checkRateLimit(clientId);

    if (!rateLimit.allowed) {
      const resetDate = new Date(rateLimit.resetAt);
      return respondWithError(
        "rate_limited",
        {
          error: "Rate limit exceeded",
          message: `You have reached the limit of ${RATE_LIMIT_MAX} requests per hour. Please try again after ${resetDate.toLocaleTimeString()}.`,
          resetAt: rateLimit.resetAt,
          remaining: 0,
        },
        429
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return respondWithError("invalid_json", { error: "Invalid JSON in request body" }, 400);
    }

    const { subjects, model } = body;
    provider = (body.provider ?? "gemini") as ApiKeyProvider;

    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return respondWithError(
        "missing_subjects",
        { error: "Subjects array is required and must not be empty" },
        400
      );
    }

    // Validate that all subjects are strings
    if (!subjects.every((s: any) => typeof s === "string" && s.trim().length > 0)) {
      return respondWithError(
        "invalid_subjects",
        { error: "All subjects must be non-empty strings" },
        400
      );
    }

    // Validate provider
    const validProviders: ApiKeyProvider[] = ["gemini", "openai", "anthropic"];
    if (!validProviders.includes(provider)) {
      return respondWithError(
        "invalid_provider",
        { error: `Invalid provider. Must be one of: ${validProviders.join(", ")}` },
        400
      );
    }

    // Get model or use default for provider
    selectedModel = (model || getDefaultModel(provider)) as AIModel;

    // Get API key: MUST use user's key if authenticated, never fall back to environment variable
    let apiKeyToUse: string | null = null;
    const providerLabel =
      provider === "gemini" ? "Gemini" : provider === "openai" ? "OpenAI" : "Anthropic";

    try {
      const supabase = await createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      userId = user?.id ?? null;

      if (authError) {
        console.error("Auth error:", authError);
        return respondWithError(
          "unauthenticated",
          { error: "Authentication required. Please log in to use this feature." },
          401
        );
      }

      if (!user) {
        return respondWithError(
          "unauthenticated",
          { error: "Authentication required. Please log in to use this feature." },
          401
        );
      }

      // MUST get user's API key for the selected provider - no fallback to environment variable
      const userApiKey = await getUserApiKey(user.id, provider);
      if (!userApiKey) {
        return respondWithError(
          "no_api_key",
          {
            error: `No API key configured. Please add your ${providerLabel} API key in Settings to use this feature.`,
          },
          400
        );
      }

      apiKeyToUse = userApiKey;
      console.log(`Using user ${provider} API key for user ${user.id}`);
    } catch (error) {
      console.error("Error getting user API key:", error);
      return respondWithError(
        "api_key_lookup_failed",
        { error: "Failed to retrieve your API key. Please check your Settings." },
        500
      );
    }

    // Validate API key is available
    if (!apiKeyToUse) {
      return respondWithError(
        "no_api_key",
        { error: `No API key configured. Please add your ${providerLabel} API key in Settings.` },
        400
      );
    }

    // Prepare the prompt for the AI
    // Analyze all subjects together and generate 10 optimized alternatives total
    const subjectsList = subjects.map((s: string, idx: number) => `${idx + 1}. "${s.replace(/"/g, '\\"')}"`).join('\n');
    
    const userPrompt = `You are analyzing ${subjects.length} subject line(s) together to identify common themes, patterns, and value propositions.

CRITICAL REQUIREMENTS - READ CAREFULLY:
1. Analyze ALL the following subject lines together as a collection
2. Identify common themes, patterns, and value propositions across all of them
3. Generate EXACTLY 10 (ten) optimized subject line alternatives that synthesize the best elements from all input subjects
4. Each alternative must be unique, optimized, and different from the others
5. Return ONLY a JSON object (NOT an array) with this EXACT structure:

{
  "rewritten": [
    "First optimized subject line",
    "Second optimized subject line",
    "Third optimized subject line",
    "Fourth optimized subject line",
    "Fifth optimized subject line",
    "Sixth optimized subject line",
    "Seventh optimized subject line",
    "Eighth optimized subject line",
    "Ninth optimized subject line",
    "Tenth optimized subject line"
  ]
}

Subject lines to analyze:
${subjectsList}

MANDATORY REQUIREMENTS:
- The "rewritten" array MUST contain EXACTLY 10 strings - no more, no less
- Do NOT return an array of objects - return a SINGLE object with a "rewritten" array
- Each of the 10 alternatives must be a unique, optimized subject line
- All 10 alternatives should synthesize themes from the input subjects
- All 10 alternatives should be optimized for deliverability, engagement, and spam filter avoidance
- Count your alternatives: you must provide exactly 10, not 9, not 11, but exactly 10`;

    // Call AI provider with retry logic
    let result;
    const maxRetries = 3;
    let lastError: any = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        result = await generateTextWithProvider(
          provider,
          selectedModel,
          apiKeyToUse!,
          {
            system: SYSTEM_PROMPT,
            prompt: userPrompt,
            temperature: 0.7,
          }
        );
        break;
      } catch (error: any) {
        lastError = error;
        console.error(`${providerLabel} API error (attempt ${attempt + 1}/${maxRetries + 1}):`, error);
        
        if (error?.statusCode === 401 || error?.status === 401) {
          return respondWithError(
            "invalid_api_key",
            { error: `Invalid ${providerLabel} API key. Please check your API key in Settings.` },
            500
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
            return respondWithError(
              "model_overloaded",
              { error: `The ${providerLabel} model is currently overloaded. Please try again in a few moments.` },
              503
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
            return respondWithError(
              "quota_exceeded",
              { error: `${providerLabel} API quota exceeded or rate limit reached. Please check your billing and try again later.` },
              500
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
            return respondWithError(
              "provider_unavailable",
              { error: `${providerLabel} API is temporarily unavailable. Please try again later.` },
              500
            );
          }
        }

        const errorMessage = error?.message || `${providerLabel} API request failed`;
        return respondWithError(
          "provider_error",
          { error: `${providerLabel} API error: ${errorMessage}` },
          500
        );
      }
    }

    if (!result) {
      if (lastError?.message?.includes("overloaded") || lastError?.message?.toLowerCase().includes("model is overloaded")) {
        return respondWithError(
          "model_overloaded",
          { error: `The ${providerLabel} model is currently overloaded. Please try again in a few moments.` },
          503
        );
      }
      if (lastError?.statusCode === 429 || lastError?.status === 429 || lastError?.message?.includes("quota")) {
        return respondWithError(
          "quota_exceeded",
          { error: `${providerLabel} API quota exceeded or rate limit reached. Please try again in a few moments.` },
          500
        );
      }
      return respondWithError(
        "provider_unreachable",
        { error: `Failed to connect to ${providerLabel} API after multiple attempts. Please try again later.` },
        500
      );
    }

    // Parse the AI response
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
      console.error(`Failed to parse AI response:`, result.text);
      return respondWithError(
        "unparseable_response",
        { error: `Failed to parse AI response. The model may not have returned valid JSON.` },
        500
      );
    }

    // Validate the parsed result
    if (!parsedResult || typeof parsedResult !== "object") {
      return respondWithError(
        "invalid_response_format",
        { error: `Invalid response format. Expected an object.` },
        500
      );
    }

    // Ensure we have the required field
    if (!Array.isArray(parsedResult.rewritten)) {
      return respondWithError(
        "invalid_response_structure",
        { error: `Invalid response structure. Missing 'rewritten' array field.` },
        500
      );
    }

    // CRITICAL: Ensure we have exactly 10 alternatives
    if (parsedResult.rewritten.length !== 10) {
      console.error(`Returned ${parsedResult.rewritten.length} alternatives, expected exactly 10`);
      return respondWithError(
        "wrong_alternative_count",
        {
          error: `Failed to generate exactly 10 alternatives. Received ${parsedResult.rewritten.length} alternatives instead. Please try again.`,
        },
        500
      );
    }

    // Validate that all alternatives are non-empty strings
    const invalidAlternatives = parsedResult.rewritten.filter((alt: any) => typeof alt !== "string" || alt.trim().length === 0);
    if (invalidAlternatives.length > 0) {
      return respondWithError(
        "invalid_alternatives",
        { error: `Invalid alternatives found. All 10 alternatives must be non-empty strings.` },
        500
      );
    }

    await logToolRun({
      userId,
      toolSlug: TOOL_SLUG,
      provider,
      model: selectedModel,
      cached: false,
      durationMs: Date.now() - startedAt,
      metadata: { subjectCount: subjects.length },
    });

    return NextResponse.json({
      rewritten: parsedResult.rewritten,
      rateLimit: {
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt,
      },
    });
  } catch (error: any) {
    console.error("Error in subject-rewrite API:", error);
    const errorMessage = error?.message || "An unexpected error occurred";
    return respondWithError(
      "unhandled_exception",
      { error: `Internal server error: ${errorMessage}` },
      500
    );
  }
}

