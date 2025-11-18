import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateAuthUrl, generateStateToken } from "@/lib/gmail/oauth";
import { cookies } from "next/headers";

/**
 * GET /api/gmail/auth-url
 * Generate Google OAuth2 authorization URL
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

    // Generate state token for CSRF protection
    const state = generateStateToken();

    // Store state in cookie (httpOnly, secure in production)
    const cookieStore = await cookies();
    cookieStore.set("gmail_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    // Generate redirect URI
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ||
      `${request.nextUrl.origin}/api/gmail/callback`;

    // Generate authorization URL
    const authUrl = generateAuthUrl(state, redirectUri);

    return NextResponse.json({ authUrl });
  } catch (error: any) {
    console.error("Error generating auth URL:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate authorization URL" },
      { status: 500 }
    );
  }
}

