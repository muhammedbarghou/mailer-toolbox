import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens, getUserEmail } from "@/lib/gmail/oauth";
import { storeGmailTokens } from "@/lib/gmail/tokens";
import { cookies } from "next/headers";

/**
 * GET /api/gmail/callback
 * Handle Google OAuth callback
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
      return NextResponse.redirect(
        new URL("/auth/login?error=unauthorized", request.url)
      );
    }

    // Get code and state from query params
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Handle OAuth error
    if (error) {
      return NextResponse.redirect(
        new URL(
          `/gmail-deliverability?error=${encodeURIComponent(error)}`,
          request.url
        )
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL(
          "/gmail-deliverability?error=missing_code_or_state",
          request.url
        )
      );
    }

    // Verify state token (CSRF protection)
    const cookieStore = await cookies();
    const storedState = cookieStore.get("gmail_oauth_state")?.value;

    if (!storedState || storedState !== state) {
      return NextResponse.redirect(
        new URL("/gmail-deliverability?error=invalid_state", request.url)
      );
    }

    // Clear state cookie
    cookieStore.delete("gmail_oauth_state");

    // Exchange code for tokens
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ||
      `${request.nextUrl.origin}/api/gmail/callback`;

    const { accessToken, refreshToken, expiresAt } =
      await exchangeCodeForTokens(code, redirectUri);

    // Get user email from Gmail API
    const email = await getUserEmail(accessToken);

    // Store tokens in database
    await storeGmailTokens(
      user.id,
      email,
      accessToken,
      refreshToken,
      expiresAt
    );

    // Create audit log entry
    const { error: logError } = await supabase.from("gmail_audit_log").insert({
      user_id: user.id,
      action: "connect",
      metadata: { email },
    });

    if (logError) {
      console.error("Error creating audit log:", logError);
    }

    // Redirect to success page
    return NextResponse.redirect(
      new URL("/gmail-deliverability?success=connected", request.url)
    );
  } catch (error: any) {
    console.error("Error in OAuth callback:", error);
    return NextResponse.redirect(
      new URL(
        `/gmail-deliverability?error=${encodeURIComponent(error.message || "oauth_error")}`,
        request.url
      )
    );
  }
}

