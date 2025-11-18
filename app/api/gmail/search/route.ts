import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGmailTokens, refreshGmailToken } from "@/lib/gmail/tokens";
import { checkViewerPermission } from "@/lib/gmail/permissions";
import { createGmailClient, searchAndGetMessages } from "@/lib/gmail/client";

/**
 * POST /api/gmail/search
 * Search Gmail messages (metadata only)
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

    // Get request body
    const body = await request.json();
    const { accountId, query, label, maxResults = 25, pageToken } = body;

    if (!accountId) {
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 }
      );
    }

    // Verify viewer has permission
    const hasPermission = await checkViewerPermission(accountId, user.id);
    if (!hasPermission) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Get tokens (server-side only)
    let tokens = await getGmailTokens(accountId);
    if (!tokens) {
      return NextResponse.json(
        { error: "Account not found or tokens unavailable" },
        { status: 404 }
      );
    }

    // Refresh token if expired or expiring soon
    const now = new Date();
    if (
      !tokens.expiresAt ||
      tokens.expiresAt <= new Date(now.getTime() + 5 * 60 * 1000)
    ) {
      const refreshed = await refreshGmailToken(accountId);
      if (refreshed) {
        tokens = await getGmailTokens(accountId);
      }
    }

    if (!tokens) {
      return NextResponse.json(
        { error: "Failed to refresh tokens" },
        { status: 500 }
      );
    }

    // Create Gmail client
    const client = createGmailClient(tokens.accessToken);

    // Search and get messages
    const result = await searchAndGetMessages(
      client,
      query || "",
      label,
      maxResults,
      pageToken
    );

    // Create audit log entry
    const { error: logError } = await supabase.from("gmail_audit_log").insert({
      user_id: user.id,
      gmail_account_id: accountId,
      action: "search",
      metadata: { query, label, resultCount: result.messages.length },
    });

    if (logError) {
      console.error("Error creating audit log:", logError);
    }

    return NextResponse.json({
      messages: result.messages,
      nextPageToken: result.nextPageToken,
    });
  } catch (error: any) {
    console.error("Error searching Gmail:", error);

    // Handle Gmail API errors
    if (error.code === 401 || error.message?.includes("Invalid Credentials")) {
      return NextResponse.json(
        { error: "Token expired. Please reconnect your Gmail account." },
        { status: 401 }
      );
    }

    if (error.code === 429 || error.message?.includes("rate limit")) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to search messages" },
      { status: 500 }
    );
  }
}

