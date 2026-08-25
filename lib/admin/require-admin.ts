/**
 * Server-only admin authorization helpers.
 *
 * Every admin page and every /api/admin route must resolve the caller through
 * requireAdmin before touching privileged data. The proxy gate in proxy.ts is a
 * convenience for redirects, not the security boundary.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail, type AdminUser } from "@/lib/admin/access-control";

/**
 * Next signals control flow (dynamic bailout, redirect, notFound) by throwing
 * errors that carry a digest. Those must never be swallowed by a catch block.
 */
const isFrameworkControlFlowError = (error: unknown): boolean =>
  typeof error === "object" && error !== null && "digest" in error;

/**
 * Resolve the current request's admin user, or null when the caller is not an admin
 */
export const requireAdmin = async (): Promise<AdminUser | null> => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user?.email || !isAdminEmail(user.email)) {
      return null;
    }

    return { id: user.id, email: user.email };
  } catch (error) {
    if (isFrameworkControlFlowError(error)) {
      throw error;
    }

    console.error("Admin authorization check failed:", error);
    return null;
  }
};

/**
 * Guard for admin API routes.
 *
 * Returns either the resolved admin or a 404 response. A 404 rather than a 403
 * avoids confirming that these endpoints exist to non-admins.
 */
export const requireAdminApi = async (): Promise<
  { admin: AdminUser; response: null } | { admin: null; response: NextResponse }
> => {
  const admin = await requireAdmin();

  if (!admin) {
    return {
      admin: null,
      response: NextResponse.json({ error: "Not found" }, { status: 404 }),
    };
  }

  return { admin, response: null };
};

/**
 * Record a mutating admin action. Never throws, so an audit failure cannot
 * abort the action the operator requested.
 */
export const logAdminAction = async (params: {
  actorUserId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> => {
  try {
    const admin = createAdminClient();

    await admin.from("admin_audit_log").insert({
      actor_user_id: params.actorUserId,
      action: params.action,
      target_type: params.targetType ?? null,
      target_id: params.targetId ?? null,
      metadata: params.metadata ?? {},
    });
  } catch (error) {
    console.error("Failed to write admin audit log entry:", error);
  }
};
