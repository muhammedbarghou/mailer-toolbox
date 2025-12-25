import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import type { ApiKeyProvider } from "./api-keys";

/**
 * Validates a Gemini API key by making a test API call
 */
export const validateGeminiApiKey = async (apiKey: string): Promise<{
  valid: boolean;
  error?: string;
}> => {
  if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length === 0) {
    return {
      valid: false,
      error: "API key is required",
    };
  }

  try {
    // Create Google provider with the API key
    const googleProvider = createGoogleGenerativeAI({
      apiKey: apiKey.trim(),
    });

    // Make a minimal test call to validate the API key
    // Using a very simple prompt to minimize token usage
    await generateText({
      model: googleProvider("gemini-2.5-flash"),
      prompt: "test",
    });

    return {
      valid: true,
    };
  } catch (error: any) {
    // Handle different error types
    if (error?.statusCode === 401 || error?.status === 401) {
      return {
        valid: false,
        error: "Invalid API key. Please check your key and try again.",
      };
    }

    if (error?.statusCode === 429 || error?.status === 429) {
      return {
        valid: false,
        error: "API quota exceeded. Please check your billing.",
      };
    }

    if (error?.statusCode === 403 || error?.status === 403) {
      return {
        valid: false,
        error: "API key does not have required permissions.",
      };
    }

    // For other errors, we'll consider it potentially valid
    // (might be a temporary issue)
    console.error("API key validation error:", error);
    return {
      valid: false,
      error: error?.message || "Failed to validate API key. Please try again.",
    };
  }
};

/**
 * Validates an OpenAI API key by making a test API call
 */
export const validateOpenAIApiKey = async (apiKey: string): Promise<{
  valid: boolean;
  error?: string;
}> => {
  if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length === 0) {
    return {
      valid: false,
      error: "API key is required",
    };
  }

  try {
    // Create OpenAI provider with the API key
    const openaiProvider = createOpenAI({
      apiKey: apiKey.trim(),
    });

    // Make a minimal test call to validate the API key
    await generateText({
      model: openaiProvider("gpt-4o"),
      prompt: "test",
    });

    return {
      valid: true,
    };
  } catch (error: any) {
    // Handle different error types
    if (error?.statusCode === 401 || error?.status === 401) {
      return {
        valid: false,
        error: "Invalid API key. Please check your key and try again.",
      };
    }

    if (error?.statusCode === 429 || error?.status === 429) {
      return {
        valid: false,
        error: "API quota exceeded. Please check your billing.",
      };
    }

    if (error?.statusCode === 403 || error?.status === 403) {
      return {
        valid: false,
        error: "API key does not have required permissions.",
      };
    }

    console.error("OpenAI API key validation error:", error);
    return {
      valid: false,
      error: error?.message || "Failed to validate API key. Please try again.",
    };
  }
};

/**
 * Validates an Anthropic API key by making a test API call
 */
export const validateAnthropicApiKey = async (apiKey: string): Promise<{
  valid: boolean;
  error?: string;
}> => {
  if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length === 0) {
    return {
      valid: false,
      error: "API key is required",
    };
  }

  try {
    // Create Anthropic provider with the API key
    const anthropicProvider = createAnthropic({
      apiKey: apiKey.trim(),
    });

    // Make a minimal test call to validate the API key
    await generateText({
      model: anthropicProvider("claude-sonnet-4.5"),
      prompt: "test",
    });

    return {
      valid: true,
    };
  } catch (error: any) {
    // Handle different error types
    if (error?.statusCode === 401 || error?.status === 401) {
      return {
        valid: false,
        error: "Invalid API key. Please check your key and try again.",
      };
    }

    if (error?.statusCode === 429 || error?.status === 429) {
      return {
        valid: false,
        error: "API quota exceeded. Please check your billing.",
      };
    }

    if (error?.statusCode === 403 || error?.status === 403) {
      return {
        valid: false,
        error: "API key does not have required permissions.",
      };
    }

    console.error("Anthropic API key validation error:", error);
    return {
      valid: false,
      error: error?.message || "Failed to validate API key. Please try again.",
    };
  }
};

/**
 * Validate API key for any provider
 */
export const validateApiKey = async (
  provider: ApiKeyProvider,
  apiKey: string
): Promise<{
  valid: boolean;
  error?: string;
}> => {
  switch (provider) {
    case "gemini":
      return validateGeminiApiKey(apiKey);
    case "openai":
      return validateOpenAIApiKey(apiKey);
    case "anthropic":
      return validateAnthropicApiKey(apiKey);
    default:
      return {
        valid: false,
        error: `Unsupported provider: ${provider}`,
      };
  }
};

