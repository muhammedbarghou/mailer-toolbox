import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateGeminiApiKey } from "@/lib/api-key-validation";
import { updateApiKeyValidation } from "@/lib/api-keys";
import { getUserApiKeys, decryptApiKey } from "@/lib/api-keys";
import { decryptApiKey as decrypt } from "@/lib/encryption";

/**
 * POST /api/api-keys/[id]/validate
 * Validate an API key by making a test API call
 */
export async function POST(
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

    // Get the API key from database
    const { data: keyData, error: keyError } = await supabase
      .from("user_api_keys")
      .select("encrypted_api_key, provider")
      .eq("id", id)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (keyError || !keyData) {
      return NextResponse.json(
        { error: "API key not found" },
        { status: 404 }
      );
    }

    // Decrypt the API key
    let decryptedKey: string;
    try {
      decryptedKey = decrypt(keyData.encrypted_api_key);
    } catch (error) {
      return NextResponse.json(
        { error: "Failed to decrypt API key" },
        { status: 500 }
      );
    }

    // Validate based on provider
    if (keyData.provider === "gemini") {
      const validation = await validateGeminiApiKey(decryptedKey);
      
      // Update validation status in database
      await updateApiKeyValidation(
        user.id,
        id,
        validation.valid ? "valid" : "invalid",
        validation.error
      );

      if (validation.valid) {
        return NextResponse.json({
          valid: true,
          message: "API key is valid",
        });
      } else {
        return NextResponse.json(
          {
            valid: false,
            error: validation.error || "API key validation failed",
          },
          { status: 400 }
        );
      }
    } else {
      // For other providers, we'll add validation later
      return NextResponse.json(
        { error: `Validation for provider "${keyData.provider}" is not yet implemented` },
        { status: 501 }
      );
    }
  } catch (error: any) {
    console.error("Error validating API key:", error);
    return NextResponse.json(
      { error: error.message || "Failed to validate API key" },
      { status: 500 }
    );
  }
}

