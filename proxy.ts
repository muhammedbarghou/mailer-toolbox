import { NextRequest, NextResponse } from "next/server";
import { isIpBlocked, extractIpAddress } from "@/lib/zero-bounce";

/**
 * Middleware to block IP addresses that have been flagged for spam trap abuse
 * Runs before API routes and pages are processed
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only check IP blocking for signup-related routes
  const signupRoutes = [
    "/api/auth/validate-signup",
    "/auth/signup",
  ];

  const isSignupRoute = signupRoutes.some((route) => pathname.startsWith(route));

  if (!isSignupRoute) {
    // Allow non-signup routes to pass through
    return NextResponse.next();
  }

  // Extract IP address
  const ipAddress = extractIpAddress(request.headers);

  // Skip check for unknown IPs (development/localhost)
  if (ipAddress === "unknown") {
    return NextResponse.next();
  }

  // Check if IP is blocked
  const blocked = await isIpBlocked(ipAddress);

  if (blocked) {
    // Return 403 Forbidden for blocked IPs
    return NextResponse.json(
      {
        error: "Access denied",
        reason: "Your IP address has been blocked due to repeated spam trap signup attempts.",
      },
      { status: 403 }
    );
  }

  // IP is not blocked, allow request to proceed
  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/api/auth/validate-signup",
    "/auth/signup",
  ],
};
