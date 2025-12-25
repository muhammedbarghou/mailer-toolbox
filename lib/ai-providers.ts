import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText, type LanguageModel } from "ai";
import type { ApiKeyProvider } from "./api-keys";

export type AIModel = 
  // Gemini models
  | "gemini-2.5-pro"
  | "gemini-2.5-flash"
  | "gemini-2.5-flash-lite"
  // OpenAI models
  | "gpt-5"
  | "gpt-5.1"
  | "gpt-5.2"
  | "gpt-4o"
  // Anthropic models
  | "claude-sonnet-4.5"
  | "claude-sonnet-4"
  | "claude-opus-4.1"
  | "claude-haiku-3.5";

export interface GenerateTextOptions {
  system?: string;
  prompt: string;
  temperature?: number;
}

export interface GenerateTextResult {
  text: string;
}

/**
 * Get the appropriate model instance based on provider and model name
 */
export const getModel = (
  provider: ApiKeyProvider,
  model: AIModel,
  apiKey: string
): LanguageModel => {
  switch (provider) {
    case "gemini": {
      const googleProvider = createGoogleGenerativeAI({
        apiKey,
      });
      return googleProvider(model as any);
    }
    case "openai": {
      const openaiProvider = createOpenAI({
        apiKey,
      });
      return openaiProvider(model as any);
    }
    case "anthropic": {
      const anthropicProvider = createAnthropic({
        apiKey,
      });
      return anthropicProvider(model as any);
    }
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
};

/**
 * Generate text using the specified provider and model
 */
export const generateTextWithProvider = async (
  provider: ApiKeyProvider,
  model: AIModel,
  apiKey: string,
  options: GenerateTextOptions
): Promise<GenerateTextResult> => {
  const modelInstance = getModel(provider, model, apiKey);
  
  const result = await generateText({
    model: modelInstance,
    system: options.system,
    prompt: options.prompt,
    temperature: options.temperature ?? 0.7,
  });

  return {
    text: result.text,
  };
};

/**
 * Get available models for a provider
 */
export const getAvailableModels = (provider: ApiKeyProvider): AIModel[] => {
  switch (provider) {
    case "gemini":
      return ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.5-flash-lite"];
    case "openai":
      return ["gpt-5", "gpt-5.1", "gpt-5.2", "gpt-4o"];
    case "anthropic":
      return [
        "claude-sonnet-4.5",
        "claude-sonnet-4",
        "claude-opus-4.1",
        "claude-haiku-3.5",
      ];
    default:
      return [];
  }
};

/**
 * Get default model for a provider
 */
export const getDefaultModel = (provider: ApiKeyProvider): AIModel => {
  switch (provider) {
    case "gemini":
      return "gemini-2.5-flash";
    case "openai":
      return "gpt-4o";
    case "anthropic":
      return "claude-sonnet-4.5";
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
};

/**
 * Get display name for a model
 */
export const getModelDisplayName = (model: AIModel): string => {
  const modelNames: Record<AIModel, string> = {
    "gemini-2.5-pro": "Gemini 2.5 Pro",
    "gemini-2.5-flash": "Gemini 2.5 Flash",
    "gemini-2.5-flash-lite": "Gemini 2.5 Flash Lite",
    "gpt-5": "GPT-5",
    "gpt-5.1": "GPT-5.1",
    "gpt-5.2": "GPT-5.2",
    "gpt-4o": "GPT-4o",
    "claude-sonnet-4.5": "Claude Sonnet 4.5",
    "claude-sonnet-4": "Claude Sonnet 4",
    "claude-opus-4.1": "Claude Opus 4.1",
    "claude-haiku-3.5": "Claude Haiku 3.5",
  };
  return modelNames[model] || model;
};

