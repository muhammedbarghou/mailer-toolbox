import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasGmailDeliverabilityAccess } from "@/lib/gmail/access-control";

/**
 * GET /api/gmail/debug-redirect
 * Debug endpoint to show the redirect URI being used
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

    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ||
      `${request.nextUrl.origin}/api/gmail/callback`;

    return NextResponse.json({
      redirectUri,
      fromEnv: !!process.env.GOOGLE_REDIRECT_URI,
      origin: request.nextUrl.origin,
      message: "Add this exact URI to Google Cloud Console",
    });
  } catch (error: any) {
    console.error("Error in debug redirect:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get redirect URI" },
      { status: 500 }
    );
  }
}

