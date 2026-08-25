import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { createClient } from "@/lib/supabase/server";
import { logToolUsage, type ToolUsageAction } from "@/lib/analytics/usage-events";
import { isTrackedRoute } from "@/lib/page-visit-tracker";

/**
 * Telemetry sink for the client-only tools, which never reach a server route
 * of their own. Only accepts events for known tool routes, and is rate limited
 * so a browser loop cannot flood the events table.
 */

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis =
  REDIS_URL && REDIS_TOKEN ? new Redis({ url: REDIS_URL, token: REDIS_TOKEN }) : null;

const RATE_LIMIT_MAX = 120;
const RATE_LIMIT_WINDOW = 300; // 5 minutes in seconds

const ALLOWED_ACTIONS: ToolUsageAction[] = ["view", "run", "error"];

/**
 * Allow up to RATE_LIMIT_MAX events per user per window
 */
const isWithinRateLimit = async (userId: string): Promise<boolean> => {
  if (!redis) {
    return true;
  }

  try {
    const key = `events-rate-limit:${userId}`;
    const current = await redis.incr(key);

    if (current === 1) {
      await redis.expire(key, RATE_LIMIT_WINDOW);
    }

    return current <= RATE_LIMIT_MAX;
  } catch (error) {
    console.error("Redis error during event rate limit check:", error);
    return true;
  }
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    let body: { toolSlug?: unknown; action?: unknown; durationMs?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    const toolSlug = typeof body.toolSlug === "string" ? body.toolSlug : "";
    if (!isTrackedRoute(toolSlug)) {
      return NextResponse.json({ error: "Unknown tool" }, { status: 400 });
    }

    const action = body.action as ToolUsageAction;
    if (!ALLOWED_ACTIONS.includes(action)) {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    const allowed = await isWithinRateLimit(user.id);
    if (!allowed) {
      // Silently accept so the client never retries or surfaces an error
      return NextResponse.json({ recorded: false });
    }

    await logToolUsage({
      userId: user.id,
      toolSlug,
      action,
      status: action === "error" ? "error" : "success",
      durationMs: typeof body.durationMs === "number" ? body.durationMs : null,
      metadata: { source: "client" },
    });

    return NextResponse.json({ recorded: true });
  } catch (error) {
    console.error("Error in events API:", error);
    return NextResponse.json({ error: "Failed to record event" }, { status: 500 });
  }
}
