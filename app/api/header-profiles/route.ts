import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getUserHeaderProfiles,
  createHeaderProfile,
  type HeaderProfileInput,
} from "@/lib/header-profiles";

/**
 * GET /api/header-profiles
 * Get all header profiles for the authenticated user
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: "Authentication required. Please sign in to view your header profiles.",
        },
        { status: 401 }
      );
    }

    const profiles = await getUserHeaderProfiles(user.id);

    return NextResponse.json({
      profiles,
    });
  } catch (error: unknown) {
    console.error("Error fetching header profiles:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch header profiles";

    // Check if it's a database/table error (table might not exist)
    if (
      errorMessage.includes("relation") ||
      errorMessage.includes("does not exist")
    ) {
      return NextResponse.json(
        {
          error:
            "Database table not found. Please run the SQL migration to create the header_processing_profiles table.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * POST /api/header-profiles
 * Create a new header profile for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: "Authentication required. Please sign in to create header profiles.",
        },
        { status: 401 }
      );
    }

    // Parse request body
    let body: HeaderProfileInput;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { name, description, custom_headers, processing_config, parameter_ids, is_default } =
      body;

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Profile name is required" },
        { status: 400 }
      );
    }

    // Create the profile
    const { data: newProfile, error: createError } = await createHeaderProfile(user.id, {
      name: name.trim(),
      description: description?.trim(),
      custom_headers: custom_headers || [],
      processing_config: processing_config || {},
      parameter_ids: parameter_ids || [],
      is_default: is_default || false,
    });

    if (createError || !newProfile) {
      return NextResponse.json(
        { error: createError || "Failed to create header profile" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        profile: newProfile,
        message: "Header profile created successfully",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error creating header profile:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create header profile";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
