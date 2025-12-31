import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getUserHeaderParameters,
  createHeaderParameter,
  type HeaderParameterInput,
} from "@/lib/header-parameters";

/**
 * GET /api/header-parameters
 * Get all header parameters for the authenticated user
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
          error: "Authentication required. Please sign in to view your header parameters.",
        },
        { status: 401 }
      );
    }

    const parameters = await getUserHeaderParameters(user.id);

    return NextResponse.json({
      parameters,
    });
  } catch (error: unknown) {
    console.error("Error fetching header parameters:", error);

    const errorMessage = error instanceof Error ? error.message : "Failed to fetch header parameters";

    // Check if it's a database/table error (table might not exist)
    if (
      errorMessage.includes("relation") ||
      errorMessage.includes("does not exist")
    ) {
      return NextResponse.json(
        {
          error: "Database table not found. Please run the SQL migration to create the user_header_parameters table.",
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
 * POST /api/header-parameters
 * Create a new header parameter for the authenticated user
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
          error: "Authentication required. Please sign in to add header parameters.",
        },
        { status: 401 }
      );
    }

    // Parse request body
    let body: HeaderParameterInput;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { name, placeholder, description } = body;

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Parameter name is required" },
        { status: 400 }
      );
    }

    if (!placeholder || typeof placeholder !== "string" || placeholder.trim().length === 0) {
      return NextResponse.json(
        { error: "Placeholder is required" },
        { status: 400 }
      );
    }

    // Create the parameter
    const { data: newParam, error: createError } = await createHeaderParameter(
      user.id,
      {
        name: name.trim(),
        placeholder: placeholder.trim(),
        description: description?.trim(),
      }
    );

    if (createError || !newParam) {
      return NextResponse.json(
        { error: createError || "Failed to create header parameter" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        parameter: newParam,
        message: "Header parameter created successfully",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error creating header parameter:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create header parameter";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
