import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getHeaderProfile,
  updateHeaderProfile,
  deleteHeaderProfile,
  applyHeaderProfile,
  type HeaderProfileInput,
} from "@/lib/header-profiles";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/header-profiles/[id]
 * Get a specific header profile with its parameters
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: "Authentication required. Please sign in to view header profiles.",
        },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await getHeaderProfile(id, user.id);

    if (profileError || !profile) {
      return NextResponse.json(
        { error: profileError || "Profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      profile,
    });
  } catch (error: unknown) {
    console.error("Error fetching header profile:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch header profile";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/header-profiles/[id]
 * Update a header profile
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: "Authentication required. Please sign in to update header profiles.",
        },
        { status: 401 }
      );
    }

    // Parse request body
    let body: Partial<HeaderProfileInput>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Update the profile
    const { data: updatedProfile, error: updateError } = await updateHeaderProfile(
      id,
      user.id,
      body
    );

    if (updateError) {
      return NextResponse.json(
        { error: updateError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      profile: updatedProfile,
      message: "Header profile updated successfully",
    });
  } catch (error: unknown) {
    console.error("Error updating header profile:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update header profile";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/header-profiles/[id]
 * Delete a header profile
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: "Authentication required. Please sign in to delete header profiles.",
        },
        { status: 401 }
      );
    }

    // Delete the profile
    const { error: deleteError } = await deleteHeaderProfile(id, user.id);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Header profile deleted successfully",
    });
  } catch (error: unknown) {
    console.error("Error deleting header profile:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete header profile";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
