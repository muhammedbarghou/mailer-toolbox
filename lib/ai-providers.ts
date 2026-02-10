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
  | "gpt-5.2-pro"
  | "gpt-5.2-chat-latest"
  | "gpt-5.2"
  | "gpt-5"
  | "gpt-5-mini"
  | "gpt-5-nano"
  | "gpt-5.1-chat-latest"
  | "gpt-5.1-codex-mini"
  | "gpt-5.1-codex"
  | "gpt-5.1"
  | "gpt-5-codex"
  | "gpt-5-chat-latest"
  // Anthropic models
  | "claude-opus-4-6"
  | "claude-opus-4-5"
  | "claude-opus-4-1"
  | "claude-opus-4-0"
  | "claude-sonnet-4-0"
  | "claude-3-7-sonnet-latest"
  | "claude-3-5-haiku-latest";

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
      return [
        "gpt-5.2-pro",
        "gpt-5.2-chat-latest",
        "gpt-5.2",
        "gpt-5",
        "gpt-5-mini",
        "gpt-5-nano",
        "gpt-5.1-chat-latest",
        "gpt-5.1-codex-mini",
        "gpt-5.1-codex",
        "gpt-5.1",
        "gpt-5-codex",
        "gpt-5-chat-latest",
      ];
    case "anthropic":
      return [
        "claude-opus-4-6",
        "claude-opus-4-5",
        "claude-opus-4-1",
        "claude-opus-4-0",
        "claude-sonnet-4-0",
        "claude-3-7-sonnet-latest",
        "claude-3-5-haiku-latest",
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
      return "gpt-5.2-pro";
    case "anthropic":
      return "claude-opus-4-6";
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
    "gpt-5.2-pro": "GPT-5.2 Pro",
    "gpt-5.2-chat-latest": "GPT-5.2 Chat Latest",
    "gpt-5.2": "GPT-5.2",
    "gpt-5": "GPT-5",
    "gpt-5-mini": "GPT-5 Mini",
    "gpt-5-nano": "GPT-5 Nano",
    "gpt-5.1-chat-latest": "GPT-5.1 Chat Latest",
    "gpt-5.1-codex-mini": "GPT-5.1 Codex Mini",
    "gpt-5.1-codex": "GPT-5.1 Codex",
    "gpt-5.1": "GPT-5.1",
    "gpt-5-codex": "GPT-5 Codex",
    "gpt-5-chat-latest": "GPT-5 Chat Latest",
    "claude-opus-4-6": "Claude Opus 4.6",
    "claude-opus-4-5": "Claude Opus 4.5",
    "claude-opus-4-1": "Claude Opus 4.1",
    "claude-opus-4-0": "Claude Opus 4.0",
    "claude-sonnet-4-0": "Claude Sonnet 4.0",
    "claude-3-7-sonnet-latest": "Claude 3.7 Sonnet Latest",
    "claude-3-5-haiku-latest": "Claude 3.5 Haiku Latest",
  };
  return modelNames[model] || model;
};

