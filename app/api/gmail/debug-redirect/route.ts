import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/gmail/debug-redirect
 * Debug endpoint to show the redirect URI being used
 */
export async function GET(request: NextRequest) {
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    `${request.nextUrl.origin}/api/gmail/callback`;

  return NextResponse.json({
    redirectUri,
    fromEnv: !!process.env.GOOGLE_REDIRECT_URI,
    origin: request.nextUrl.origin,
    message: "Add this exact URI to Google Cloud Console",
  });
}

