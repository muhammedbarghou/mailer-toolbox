import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { applyHeaderProfile } from "@/lib/header-profiles";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/header-profiles/[id]/apply
 * Apply a profile configuration and return it
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    
    if (!id) {
      return NextResponse.json(
        { error: "Profile ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: "Authentication required. Please sign in to apply header profiles.",
        },
        { status: 401 }
      );
    }

    // Apply the profile
    const { data: config, error: applyError } = await applyHeaderProfile(id, user.id);

    if (applyError) {
      console.error("Error applying profile:", applyError);
      return NextResponse.json(
        { error: applyError },
        { status: 500 }
      );
    }

    if (!config) {
      return NextResponse.json(
        { error: "Failed to apply header profile: No configuration returned" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      config,
      message: "Profile applied successfully",
    });
  } catch (error: unknown) {
    console.error("Error applying header profile:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to apply header profile";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
