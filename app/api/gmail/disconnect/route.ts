import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revokeGmailToken } from "@/lib/gmail/tokens";

/**
 * POST /api/gmail/disconnect
 * Disconnect Gmail account
 */
export async function POST(request: NextRequest) {
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

    // Get account ID from request body
    const body = await request.json();
    const { accountId } = body;

    if (!accountId) {
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 }
      );
    }

    // Revoke and delete tokens
    const success = await revokeGmailToken(accountId, user.id);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to disconnect account or account not found" },
        { status: 404 }
      );
    }

    // Create audit log entry
    const { error: logError } = await supabase.from("gmail_audit_log").insert({
      user_id: user.id,
      action: "disconnect",
      metadata: { accountId },
    });

    if (logError) {
      console.error("Error creating audit log:", logError);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error disconnecting Gmail account:", error);
    return NextResponse.json(
      { error: error.message || "Failed to disconnect account" },
      { status: 500 }
    );
  }
}

