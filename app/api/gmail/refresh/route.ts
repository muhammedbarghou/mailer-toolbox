import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { refreshGmailToken } from "@/lib/gmail/tokens";

/**
 * POST /api/gmail/refresh
 * Refresh Gmail tokens (can be called by cron or on-demand)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate user (optional - can be called server-side with service role)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Get account ID from request body (optional)
    const body = await request.json().catch(() => ({}));
    const { accountId } = body;

    if (accountId) {
      // Refresh specific account
      const refreshed = await refreshGmailToken(accountId);
      if (!refreshed) {
        return NextResponse.json(
          { error: "Failed to refresh token" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, accountId });
    }

    // Refresh all tokens expiring soon (within 1 hour)
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);

    const { data: accounts, error } = await supabase
      .from("gmail_accounts")
      .select("id, token_expires_at")
      .lte("token_expires_at", oneHourFromNow.toISOString());

    if (error) {
      throw error;
    }

    const results = [];
    for (const account of accounts || []) {
      try {
        const refreshed = await refreshGmailToken(account.id);
        if (refreshed) {
          results.push({ accountId: account.id, success: true });
        } else {
          results.push({ accountId: account.id, success: false });
        }
      } catch (error) {
        console.error(`Error refreshing token for account ${account.id}:`, error);
        results.push({ accountId: account.id, success: false, error: String(error) });
      }
    }

    return NextResponse.json({
      success: true,
      refreshed: results.filter((r) => r.success).length,
      total: results.length,
      results,
    });
  } catch (error: any) {
    console.error("Error refreshing tokens:", error);
    return NextResponse.json(
      { error: error.message || "Failed to refresh tokens" },
      { status: 500 }
    );
  }
}

