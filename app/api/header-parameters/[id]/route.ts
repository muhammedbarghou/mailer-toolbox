import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  updateHeaderParameter,
  deleteHeaderParameter,
  type HeaderParameterInput,
} from "@/lib/header-parameters";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/header-parameters/[id]
 * Update a header parameter
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
          error: "Authentication required. Please sign in to update header parameters.",
        },
        { status: 401 }
      );
    }

    // Parse request body
    let body: Partial<HeaderParameterInput>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Update the parameter
    const { data: updatedParam, error: updateError } = await updateHeaderParameter(
      user.id,
      id,
      body
    );

    if (updateError) {
      return NextResponse.json(
        { error: updateError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      parameter: updatedParam,
      message: "Header parameter updated successfully",
    });
  } catch (error: unknown) {
    console.error("Error updating header parameter:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update header parameter";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/header-parameters/[id]
 * Delete a header parameter (soft delete)
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
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
          error: "Authentication required. Please sign in to delete header parameters.",
        },
        { status: 401 }
      );
    }

    // Delete the parameter
    const { error: deleteError } = await deleteHeaderParameter(user.id, id);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Header parameter deleted successfully",
    });
  } catch (error: unknown) {
    console.error("Error deleting header parameter:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete header parameter";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
