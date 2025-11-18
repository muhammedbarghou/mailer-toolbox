import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserByEmail } from "@/lib/supabase/admin";
import {
  addViewerPermission,
  removeViewerPermission,
  getAccountViewers,
} from "@/lib/gmail/permissions";

/**
 * GET /api/gmail/permissions
 * Get viewers for an account
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

    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get("accountId");

    if (!accountId) {
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 }
      );
    }

    const viewers = await getAccountViewers(accountId, user.id);

    return NextResponse.json({ viewers });
  } catch (error: any) {
    console.error("Error getting viewers:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get viewers" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/gmail/permissions
 * Add viewer permission
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { accountId, viewerEmail } = body;

    if (!accountId || !viewerEmail) {
      return NextResponse.json(
        { error: "Account ID and viewer email are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(viewerEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Look up user by email using admin client
    let viewerUser;
    try {
      viewerUser = await getUserByEmail(viewerEmail.trim().toLowerCase());
    } catch (error: any) {
      console.error("Error looking up user by email:", error);
      return NextResponse.json(
        { error: "Failed to look up user. Please check the email address." },
        { status: 500 }
      );
    }

    if (!viewerUser) {
      return NextResponse.json(
        { error: "User not found. The email address must be registered in the system." },
        { status: 404 }
      );
    }

    // Prevent users from sharing with themselves
    if (viewerUser.id === user.id) {
      return NextResponse.json(
        { error: "You cannot share an account with yourself." },
        { status: 400 }
      );
    }

    // Add viewer permission
    const permission = await addViewerPermission(
      accountId,
      user.id,
      viewerUser.id
    );

    if (!permission) {
      return NextResponse.json(
        { error: "Failed to add viewer permission" },
        { status: 500 }
      );
    }

    // Create audit log
    const { error: logError } = await supabase.from("gmail_audit_log").insert({
      user_id: user.id,
      gmail_account_id: accountId,
      action: "share",
      metadata: { viewerId: viewerUser.id, viewerEmail: viewerEmail },
    });

    if (logError) {
      console.error("Error creating audit log:", logError);
    }

    return NextResponse.json({
      success: true,
      viewer: {
        id: viewerUser.id,
        email: viewerUser.email,
        name: viewerUser.name,
      },
    });
  } catch (error: any) {
    console.error("Error adding viewer:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add viewer" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/gmail/permissions
 * Remove viewer permission
 */
export async function DELETE(request: NextRequest) {
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

    const body = await request.json();
    const { accountId, viewerId } = body;

    if (!accountId || !viewerId) {
      return NextResponse.json(
        { error: "Account ID and viewer ID are required" },
        { status: 400 }
      );
    }

    const success = await removeViewerPermission(accountId, user.id, viewerId);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to remove viewer or access denied" },
        { status: 404 }
      );
    }

    // Create audit log
    const { error: logError } = await supabase.from("gmail_audit_log").insert({
      user_id: user.id,
      gmail_account_id: accountId,
      action: "unshare",
      metadata: { viewerId },
    });

    if (logError) {
      console.error("Error creating audit log:", logError);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error removing viewer:", error);
    return NextResponse.json(
      { error: error.message || "Failed to remove viewer" },
      { status: 500 }
    );
  }
}

