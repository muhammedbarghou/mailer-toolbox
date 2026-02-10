import { NextRequest, NextResponse } from "next/server";
import {
  validateEmailWithIpCheck,
  extractIpAddress,
  isIpBlocked,
} from "@/lib/zero-bounce";

/**
 * POST /api/auth/validate-signup
 * Validate email address before signup to prevent spam traps
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
export async function POST(request: NextRequest) {
  try {
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

    // Extract IP address from request headers
    const ipAddress = extractIpAddress(request.headers);

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
      {
        error: "An unexpected error occurred during validation",
        details: error?.message,
      },
      { status: 500 }
    );
  }
}
