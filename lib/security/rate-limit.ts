/**
 * Shared Redis-backed fixed-window rate limiter.
 *
 * Prefer keying on an authenticated user id. Fall back to an IP only for
 * endpoints that run before sign-in, since an IP is far easier to rotate.
 *
 * When Redis is not configured the limiter fails open, matching the rest of the
 * app's behaviour in local development. Production deployments must set
 * UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for these limits to apply.
 */

import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis =
  REDIS_URL && REDIS_TOKEN ? new Redis({ url: REDIS_URL, token: REDIS_TOKEN }) : null;

export interface RateLimitOptions {
  /** Maximum requests allowed inside the window */
  max: number;
  /** Window length in seconds */
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Epoch milliseconds at which the window resets */
  resetAt: number;
}

/**
 * Count one request against `key` and report whether it is allowed
 */
export const checkRateLimit = async (
  key: string,
  { max, windowSeconds }: RateLimitOptions
): Promise<RateLimitResult> => {
  const openResult: RateLimitResult = {
    allowed: true,
    remaining: max,
    resetAt: Date.now() + windowSeconds * 1000,
  };

  if (!redis) {
    return openResult;
  }

  try {
    const redisKey = `rate-limit:${key}`;
    const current = await redis.incr(redisKey);

    // A fresh counter owns the window, so it is the one that sets the expiry
    if (current === 1) {
      await redis.expire(redisKey, windowSeconds);
      return {
        allowed: true,
        remaining: max - 1,
        resetAt: Date.now() + windowSeconds * 1000,
      };
    }

    const ttl = await redis.ttl(redisKey);
    const resetAt = Date.now() + (ttl > 0 ? ttl : windowSeconds) * 1000;

    return {
      allowed: current <= max,
      remaining: Math.max(max - current, 0),
      resetAt,
    };
  } catch (error) {
    console.error("Rate limit check failed, allowing request:", error);
    return openResult;
  }
};

/**
 * Standard 429 response, including the headers clients use to back off
 */
export const rateLimitResponse = (result: RateLimitResult): NextResponse => {
  const retryAfterSeconds = Math.max(Math.ceil((result.resetAt - Date.now()) / 1000), 1);

  return NextResponse.json(
    {
      error: "Rate limit exceeded",
      message: `Too many requests. Please try again in ${retryAfterSeconds} second(s).`,
      resetAt: result.resetAt,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
      },
    }
  );
};
