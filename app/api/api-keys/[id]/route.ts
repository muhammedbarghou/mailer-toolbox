import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateUserApiKey, deleteUserApiKey } from "@/lib/api-keys";

/**
 * PUT /api/api-keys/[id]
 * Update an API key
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Get authenticated user
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

    const { key_name, api_key, is_default, is_active } = body;

    // Build update object
    const updates: any = {};
    
    if (key_name !== undefined) {
      if (typeof key_name !== "string" || key_name.trim().length === 0) {
        return NextResponse.json(
          { error: "Key name must be a non-empty string" },
          { status: 400 }
        );
      }
      updates.key_name = key_name.trim();
    }

    if (api_key !== undefined) {
      if (typeof api_key !== "string" || api_key.trim().length === 0) {
        return NextResponse.json(
          { error: "API key must be a non-empty string" },
          { status: 400 }
        );
      }
      updates.plainApiKey = api_key.trim();
    }

    if (is_default !== undefined) {
      if (typeof is_default !== "boolean") {
        return NextResponse.json(
          { error: "is_default must be a boolean" },
          { status: 400 }
        );
      }
      updates.is_default = is_default;
    }

    if (is_active !== undefined) {
      if (typeof is_active !== "boolean") {
        return NextResponse.json(
          { error: "is_active must be a boolean" },
          { status: 400 }
        );
      }
      updates.is_active = is_active;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Update the API key
    const { data: updatedKey, error: updateError } = await updateUserApiKey(
      user.id,
      id,
      updates
    );

    if (updateError || !updatedKey) {
      return NextResponse.json(
        { error: updateError || "Failed to update API key" },
        { status: 500 }
      );
    }

    // Remove encrypted key from response
    const { encrypted_api_key, ...sanitizedKey } = updatedKey;

    return NextResponse.json({
      key: sanitizedKey,
      message: "API key updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating API key:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update API key" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/api-keys/[id]
 * Delete (soft delete) an API key
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Get authenticated user
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

    // Delete the API key (soft delete)
    const { error: deleteError } = await deleteUserApiKey(user.id, id);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "API key deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting API key:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete API key" },
      { status: 500 }
    );
  }
}

