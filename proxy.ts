import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isIpBlocked, extractIpAddress } from "@/lib/zero-bounce";
import { isAdminEmail } from "@/lib/admin/access-control";

/**
 * Proxy (Next.js 16 middleware) handling two concerns:
 * 1. Blocking IPs flagged for spam trap abuse on signup routes
 * 2. Gating /admin behind the admin allowlist
 *
 * The admin branch here only produces friendly redirects. The real security
 * boundary is requireAdmin in the admin layout and every /api/admin route.
 */

const SIGNUP_ROUTES = ["/api/auth/validate-signup", "/auth/signup"];

/**
 * Redirect non-admins away from /admin before the page renders
 */
const handleAdminRoute = async (request: NextRequest): Promise<NextResponse> => {
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  if (!isAdminEmail(user.email)) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return response;
};

/**
 * Block signup attempts from IPs with repeated spam trap violations
 */
const handleSignupRoute = async (request: NextRequest): Promise<NextResponse> => {
  const ipAddress = extractIpAddress(request.headers);

  // Skip check for unknown IPs (development/localhost)
  if (ipAddress === "unknown") {
    return NextResponse.next();
  }

  const blocked = await isIpBlocked(ipAddress);

  if (blocked) {
    return NextResponse.json(
      {
        error: "Access denied",
        reason: "Your IP address has been blocked due to repeated spam trap signup attempts.",
      },
      { status: 403 }
    );
  }

  return NextResponse.next();
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return handleAdminRoute(request);
  }

  const isSignupRoute = SIGNUP_ROUTES.some((route) => pathname.startsWith(route));

  if (!isSignupRoute) {
    // Allow all other routes to pass through
    return NextResponse.next();
  }

  return handleSignupRoute(request);
}

// Configure which routes the middleware should run on
export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/auth/validate-signup", "/auth/signup"],
};
