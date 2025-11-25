import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getUserApiKeys,
  createUserApiKey,
  type ApiKeyProvider,
} from "@/lib/api-keys";
import { validateGeminiApiKey } from "@/lib/api-key-validation";
import { updateApiKeyValidation } from "@/lib/api-keys";

/**
 * GET /api/api-keys
 * Get all API keys for the authenticated user
 */
export async function GET(request: NextRequest) {
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
          error:
            "Authentication required. Please sign in to view and manage your API keys.",
        },
        { status: 401 },
      );
    }

    // Get provider from query params (optional)
    const searchParams = request.nextUrl.searchParams;
    const provider = searchParams.get("provider") as ApiKeyProvider | null;

    const apiKeys = await getUserApiKeys(user.id, provider || undefined);

    // Remove encrypted keys from response
    const sanitizedKeys = apiKeys.map((key) => {
      const { encrypted_api_key, ...rest } = key;
      return rest;
    });

    return NextResponse.json({
      keys: sanitizedKeys,
    });
  } catch (error: any) {
    console.error("Error fetching API keys:", error);
    
    // Check if it's a database/table error (table might not exist)
    if (error?.message?.includes("relation") || error?.message?.includes("does not exist") || error?.code === "42P01") {
      return NextResponse.json(
        { error: "Database table not found. Please run the SQL migration to create the user_api_keys table." },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: error?.message || "Failed to fetch API keys" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/api-keys
 * Create a new API key for the authenticated user
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
          error:
            "Authentication required. Please sign in to add or update your API keys.",
        },
        { status: 401 },
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

    const { provider = "gemini", api_key, key_name, set_as_default = false } = body;

    // Validate required fields
    if (!api_key || typeof api_key !== "string" || api_key.trim().length === 0) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      );
    }

    if (!provider || !["gemini", "openai", "anthropic"].includes(provider)) {
      return NextResponse.json(
        { error: "Invalid provider. Must be one of: gemini, openai, anthropic" },
        { status: 400 }
      );
    }

    // Validate API key in real-time (for Gemini)
    if (provider === "gemini") {
      const validation = await validateGeminiApiKey(api_key.trim());
      
      if (!validation.valid) {
        return NextResponse.json(
          {
            error: "API key validation failed",
            validation_error: validation.error,
          },
          { status: 400 }
        );
      }
    }

    // Create the API key
    const { data: newKey, error: createError } = await createUserApiKey(
      user.id,
      provider as ApiKeyProvider,
      api_key.trim(),
      key_name,
      set_as_default
    );

    if (createError || !newKey) {
      return NextResponse.json(
        { error: createError || "Failed to create API key" },
        { status: 500 }
      );
    }

    // Update validation status if validation passed
    if (provider === "gemini") {
      await updateApiKeyValidation(user.id, newKey.id, "valid");
    }

    // Remove encrypted key from response
    const { encrypted_api_key, ...sanitizedKey } = newKey;

    return NextResponse.json(
      {
        key: sanitizedKey,
        message: "API key created and validated successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating API key:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create API key" },
      { status: 500 }
    );
  }
}

