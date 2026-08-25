import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateEmailWithIpCheck, isIpBlocked } from "@/lib/zero-bounce";
import { extractIpAddress } from "@/lib/security/client-ip";
import { checkRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";

/**
 * POST /api/auth/signup
 *
 * The single enforcement point for account creation.
 *
 * Previously the browser called the validation endpoint and then, if it liked
 * the answer, called Supabase directly. Skipping the first call bypassed spam
 * trap validation and the IP block entirely. Registration now happens here, so
 * the checks run on the same request that creates the account and cannot be
 * stepped around.
 */

const RATE_LIMIT = { max: 10, windowSeconds: 3600 };

const MIN_PASSWORD_LENGTH = 8;
const MAX_FIELD_LENGTH = 200;

export async function POST(request: NextRequest) {
  try {
    const ipAddress = extractIpAddress(request.headers);

    const rateLimit = await checkRateLimit(`signup:${ipAddress}`, RATE_LIMIT);
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit);
    }

    let body: { email?: unknown; password?: unknown; displayName?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const displayName =
      typeof body.displayName === "string" ? body.displayName.trim() : "";

    if (!email || email.length > MAX_FIELD_LENGTH) {
      return NextResponse.json(
        { error: "A valid email address is required" },
        { status: 400 }
      );
    }

    if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_FIELD_LENGTH) {
      return NextResponse.json(
        {
          error: `Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_FIELD_LENGTH} characters.`,
        },
        { status: 400 }
      );
    }

    if (displayName.length > MAX_FIELD_LENGTH) {
      return NextResponse.json({ error: "Name is too long" }, { status: 400 });
    }

    if (await isIpBlocked(ipAddress)) {
      return NextResponse.json(
        {
          error:
            "Your IP address has been blocked due to repeated spam trap signup attempts.",
        },
        { status: 403 }
      );
    }

    // Spam trap detection also records the attempt and may block the IP
    const validation = await validateEmailWithIpCheck(email, ipAddress);

    if (!validation.allowed) {
      const status = validation.reason?.includes("blocked") ? 403 : 400;

      return NextResponse.json(
        {
          error: validation.reason || "Email validation failed",
          attemptsRemaining: validation.attemptsRemaining,
        },
        { status }
      );
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });

    if (error) {
      // Supabase already avoids confirming whether an address is registered
      return NextResponse.json(
        { error: error.message },
        { status: error.status && error.status < 500 ? error.status : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Account created. Check your email to verify your account.",
    });
  } catch (error) {
    console.error("Error during signup:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred during signup" },
      { status: 500 }
    );
  }
}
