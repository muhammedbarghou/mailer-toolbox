/**
 * Server-side tool usage telemetry.
 *
 * Writes to public.tool_usage_events using the service role client, since RLS
 * on that table has no policies for anon or authenticated.
 *
 * Every function here is fire-and-forget and swallows its own errors:
 * telemetry must never be able to fail a user's request.
 */

import { createAdminClient } from "@/lib/supabase/admin";

export type ToolUsageAction = "view" | "run" | "error";

export type ToolUsageStatus = "success" | "error";

export interface ToolUsageEvent {
  userId?: string | null;
  toolSlug: string;
  action: ToolUsageAction;
  status?: ToolUsageStatus;
  provider?: string | null;
  model?: string | null;
  cached?: boolean;
  durationMs?: number | null;
  errorCode?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Record a tool usage event. Awaiting is optional; failures are logged only.
 */
export const logToolUsage = async (event: ToolUsageEvent): Promise<void> => {
  try {
    const admin = createAdminClient();

    const { error } = await admin.from("tool_usage_events").insert({
      user_id: event.userId ?? null,
      tool_slug: event.toolSlug,
      action: event.action,
      status: event.status ?? (event.action === "error" ? "error" : "success"),
      provider: event.provider ?? null,
      model: event.model ?? null,
      cached: event.cached ?? false,
      duration_ms:
        typeof event.durationMs === "number" ? Math.round(event.durationMs) : null,
      error_code: event.errorCode ?? null,
      metadata: event.metadata ?? {},
    });

    if (error) {
      console.error("Failed to record tool usage event:", error.message);
    }
  } catch (error) {
    console.error("Failed to record tool usage event:", error);
  }
};

/**
 * Convenience wrapper for a successful tool run
 */
export const logToolRun = async (
  event: Omit<ToolUsageEvent, "action" | "status">
): Promise<void> => {
  await logToolUsage({ ...event, action: "run", status: "success" });
};

/**
 * Convenience wrapper for a failed tool run.
 *
 * errorCode should be a short stable identifier such as "invalid_api_key"
 * rather than a raw provider message, so the admin breakdown stays groupable.
 */
export const logToolError = async (
  event: Omit<ToolUsageEvent, "action" | "status"> & { errorCode: string }
): Promise<void> => {
  await logToolUsage({ ...event, action: "error", status: "error" });
};
