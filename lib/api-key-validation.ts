import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

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

