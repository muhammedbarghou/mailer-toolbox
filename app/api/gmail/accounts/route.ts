import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getOwnedGmailAccounts,
  getSharedGmailAccounts,
} from "@/lib/gmail/permissions";
import { hasGmailDeliverabilityAccess } from "@/lib/gmail/access-control";

/**
 * GET /api/gmail/accounts
 * Get all Gmail accounts for the current user (owned + shared)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user has access to Gmail deliverability feature
    if (!hasGmailDeliverabilityAccess(user.email)) {
      return NextResponse.json(
        { error: "Access denied. This feature is restricted to authorized users." },
        { status: 403 }
      );
    }

    // Get owned and shared accounts
    const [owned, shared] = await Promise.all([
      getOwnedGmailAccounts(user.id),
      getSharedGmailAccounts(user.id),
    ]);

    return NextResponse.json({
      owned,
      shared,
    });
  } catch (error: any) {
    console.error("Error fetching Gmail accounts:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}

