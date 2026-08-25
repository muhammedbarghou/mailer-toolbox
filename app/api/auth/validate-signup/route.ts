import { NextRequest, NextResponse } from "next/server";
import { validateEmailWithIpCheck, isIpBlocked } from "@/lib/zero-bounce";
import { extractIpAddress } from "@/lib/security/client-ip";
import { checkRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";

/**
 * POST /api/auth/validate-signup
 * Validate email address before signup to prevent spam traps
 *
 * This is a pre-flight convenience for the signup form. It is not the
 * enforcement point: /api/auth/signup re-runs the same checks on the request
 * that actually creates the account.
 *
 * Request body:
 * {
 *   email: string
 * }
 *
 * Response:
 * {
 *   allowed: boolean
 *   reason?: string
 *   attemptsRemaining?: number
 * }
 */

/** Every call spends a ZeroBounce credit, so anonymous use is capped per IP */
const RATE_LIMIT = { max: 20, windowSeconds: 3600 };

const MAX_EMAIL_LENGTH = 200;

export async function POST(request: NextRequest) {
  try {
    // Extract IP address from request headers
    const ipAddress = extractIpAddress(request.headers);

    const rateLimit = await checkRateLimit(`validate-signup:${ipAddress}`, RATE_LIMIT);
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit);
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { email } = body;

    // Validate email is provided
    if (!email || typeof email !== "string" || email.trim().length === 0) {
      return NextResponse.json(
        { error: "Email address is required" },
        { status: 400 }
      );
    }

    if (email.length > MAX_EMAIL_LENGTH) {
      return NextResponse.json(
        { error: "Email address is too long" },
        { status: 400 }
      );
    }

    // Check if IP is already blocked
    const blocked = await isIpBlocked(ipAddress);
    if (blocked) {
      return NextResponse.json(
        {
          allowed: false,
          reason: "Your IP address has been blocked due to repeated spam trap signup attempts.",
        },
        { status: 403 }
      );
    }

    // Validate email with IP check
    const result = await validateEmailWithIpCheck(email.trim(), ipAddress);

    if (!result.allowed) {
      // Return 403 for blocked IPs, 400 for invalid emails
      const statusCode = result.reason?.includes("blocked") ? 403 : 400;
      
      return NextResponse.json(
        {
          allowed: false,
          reason: result.reason,
          attemptsRemaining: result.attemptsRemaining,
        },
        { status: statusCode }
      );
    }

    // Email is valid and allowed
    return NextResponse.json({
      allowed: true,
      message: "Email address is valid",
    });
  } catch (error: any) {
    console.error("Error validating signup:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred during validation" },
      { status: 500 }
    );
  }
}
