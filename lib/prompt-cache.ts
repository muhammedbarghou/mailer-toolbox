import { sha256 } from "js-sha256";
import { Redis } from "@upstash/redis";
import type { ApiKeyProvider } from "./api-keys";
import type { AIModel } from "./ai-providers";

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const PROMPT_VERSION = process.env.PROMPT_VERSION || "v1.0";

// Initialize Redis client
const redis = REDIS_URL && REDIS_TOKEN
  ? new Redis({
      url: REDIS_URL,
      token: REDIS_TOKEN,
    })
  : null;

/**
 * Get or cache a system prompt
 * Returns the hash of the system prompt for use in content cache keys
 */
export const getSystemPromptHash = async (systemPrompt: string): Promise<string> => {
  const promptHash = sha256(systemPrompt);
  const systemPromptKey = `system-prompt:${promptHash}`;

  if (redis) {
    try {
      // Check if system prompt is already cached
      const cached = await redis.get<string>(systemPromptKey);
      if (cached) {
        // System prompt is already cached, return hash
        return promptHash;
      }

      // Cache the system prompt for 7 days (604800 seconds)
      await redis.set(systemPromptKey, systemPrompt, { ex: 604800 });
    } catch (error) {
      console.error("Redis system prompt cache error:", error);
      // Continue without caching if Redis fails
    }
  }

  return promptHash;
};

/**
 * Generate a content cache key that references the system prompt hash
 * This allows us to reuse cached system prompts across requests
 */
export const generateContentCacheKey = (
  provider: ApiKeyProvider,
  model: AIModel,
  systemPromptHash: string,
  content: string,
  additionalParams?: string
): string => {
  const contentHash = sha256(content);
  const additionalHash = additionalParams ? sha256(additionalParams) : "";
  const cacheKeyInput = `${provider}:${model}:${PROMPT_VERSION}:${systemPromptHash}:${contentHash}${additionalHash ? `:${additionalHash}` : ""}`;
  return `content:${cacheKeyInput}`;
};

/**
 * Get cached content response
 */
export const getCachedContent = async (
  cacheKey: string
): Promise<string | null> => {
  if (!redis) {
    return null;
  }

  try {
    const cached = await redis.get<string>(cacheKey);
    return cached || null;
  } catch (error) {
    console.error("Redis content cache read error:", error);
    return null;
  }
};

/**
 * Cache content response
 * TTL: 24 hours (86400 seconds)
 */
export const setCachedContent = async (
  cacheKey: string,
  content: string
): Promise<void> => {
  if (!redis) {
    return;
  }

  try {
    await redis.set(cacheKey, content, { ex: 86400 });
  } catch (error) {
    console.error("Redis content cache write error:", error);
    // Continue even if caching fails
  }
};

/**
 * Combined function to get system prompt hash and generate content cache key
 */
export const getCacheKey = async (
  provider: ApiKeyProvider,
  model: AIModel,
  systemPrompt: string,
  content: string,
  additionalParams?: string
): Promise<{ systemPromptHash: string; cacheKey: string }> => {
  const systemPromptHash = await getSystemPromptHash(systemPrompt);
  const cacheKey = generateContentCacheKey(
    provider,
    model,
    systemPromptHash,
    content,
    additionalParams
  );

  return { systemPromptHash, cacheKey };
};

