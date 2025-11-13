import { createClient } from "@/lib/supabase/server";
import { encryptApiKey, decryptApiKey } from "@/lib/encryption";

export type ApiKeyProvider = "gemini" | "openai" | "anthropic";

export interface UserApiKey {
  id: string;
  user_id: string;
  provider: ApiKeyProvider;
  key_name: string | null;
  encrypted_api_key: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  last_validated_at: string | null;
  validation_status: "pending" | "valid" | "invalid" | "expired";
  validation_error: string | null;
}

export interface ApiKeyWithDecrypted extends Omit<UserApiKey, "encrypted_api_key"> {
  decrypted_key?: string; // Only included when explicitly requested
}

/**
 * Get user's API key for a specific provider
 * Priority: default key > first active key > null
 */
export const getUserApiKey = async (
  userId: string,
  provider: ApiKeyProvider = "gemini"
): Promise<string | null> => {
  try {
    const supabase = await createClient();
    
    // First, try to get the default key
    const { data: defaultKey, error: defaultError } = await supabase
      .from("user_api_keys")
      .select("encrypted_api_key")
      .eq("user_id", userId)
      .eq("provider", provider)
      .eq("is_active", true)
      .eq("is_default", true)
      .single();
    
    if (defaultKey && !defaultError) {
      try {
        return decryptApiKey(defaultKey.encrypted_api_key);
      } catch (error) {
        console.error("Failed to decrypt default API key:", error);
        // Fall through to try non-default key
      }
    }
    
    // If no default, get first active key
    const { data: activeKey, error: activeError } = await supabase
      .from("user_api_keys")
      .select("encrypted_api_key")
      .eq("user_id", userId)
      .eq("provider", provider)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    
    if (activeKey && !activeError) {
      try {
        return decryptApiKey(activeKey.encrypted_api_key);
      } catch (error) {
        console.error("Failed to decrypt active API key:", error);
        return null;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error getting user API key:", error);
    return null;
  }
};

/**
 * Get all API keys for a user (without decrypted keys)
 */
export const getUserApiKeys = async (
  userId: string,
  provider?: ApiKeyProvider
): Promise<UserApiKey[]> => {
  try {
    const supabase = await createClient();
    
    let query = supabase
      .from("user_api_keys")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    
    if (provider) {
      query = query.eq("provider", provider);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Error fetching user API keys:", error);
      return [];
    }
    
    return (data as UserApiKey[]) || [];
  } catch (error) {
    console.error("Error getting user API keys:", error);
    return [];
  }
};

/**
 * Create a new API key for a user
 */
export const createUserApiKey = async (
  userId: string,
  provider: ApiKeyProvider,
  plainApiKey: string,
  keyName?: string,
  setAsDefault: boolean = false
): Promise<{ data: UserApiKey | null; error: string | null }> => {
  try {
    const supabase = await createClient();
    
    // Encrypt the API key
    const encryptedKey = encryptApiKey(plainApiKey);
    
    // If setting as default, we need to handle the unique constraint
    // The trigger will automatically unset other defaults
    
    const { data, error } = await supabase
      .from("user_api_keys")
      .insert({
        user_id: userId,
        provider,
        key_name: keyName || `${provider.charAt(0).toUpperCase() + provider.slice(1)} Key`,
        encrypted_api_key: encryptedKey,
        is_active: true,
        is_default: setAsDefault,
        validation_status: "pending",
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating API key:", error);
      return { data: null, error: error.message };
    }
    
    return { data: data as UserApiKey, error: null };
  } catch (error: any) {
    console.error("Error creating user API key:", error);
    return { data: null, error: error.message || "Failed to create API key" };
  }
};

/**
 * Update an API key
 */
export const updateUserApiKey = async (
  userId: string,
  keyId: string,
  updates: {
    key_name?: string;
    plainApiKey?: string;
    is_default?: boolean;
    is_active?: boolean;
  }
): Promise<{ data: UserApiKey | null; error: string | null }> => {
  try {
    const supabase = await createClient();
    
    const updateData: any = {};
    
    if (updates.key_name !== undefined) {
      updateData.key_name = updates.key_name;
    }
    
    if (updates.plainApiKey !== undefined) {
      updateData.encrypted_api_key = encryptApiKey(updates.plainApiKey);
      updateData.validation_status = "pending"; // Reset validation when key changes
      updateData.last_validated_at = null;
      updateData.validation_error = null;
    }
    
    if (updates.is_default !== undefined) {
      updateData.is_default = updates.is_default;
    }
    
    if (updates.is_active !== undefined) {
      updateData.is_active = updates.is_active;
    }
    
    const { data, error } = await supabase
      .from("user_api_keys")
      .update(updateData)
      .eq("id", keyId)
      .eq("user_id", userId) // Ensure user owns this key
      .select()
      .single();
    
    if (error) {
      console.error("Error updating API key:", error);
      return { data: null, error: error.message };
    }
    
    return { data: data as UserApiKey, error: null };
  } catch (error: any) {
    console.error("Error updating user API key:", error);
    return { data: null, error: error.message || "Failed to update API key" };
  }
};

/**
 * Delete (soft delete) an API key
 */
export const deleteUserApiKey = async (
  userId: string,
  keyId: string
): Promise<{ error: string | null }> => {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from("user_api_keys")
      .update({ is_active: false })
      .eq("id", keyId)
      .eq("user_id", userId); // Ensure user owns this key
    
    if (error) {
      console.error("Error deleting API key:", error);
      return { error: error.message };
    }
    
    return { error: null };
  } catch (error: any) {
    console.error("Error deleting user API key:", error);
    return { error: error.message || "Failed to delete API key" };
  }
};

/**
 * Update validation status for an API key
 */
export const updateApiKeyValidation = async (
  userId: string,
  keyId: string,
  status: "valid" | "invalid" | "expired",
  error?: string
): Promise<{ error: string | null }> => {
  try {
    const supabase = await createClient();
    
    const updateData: any = {
      validation_status: status,
      last_validated_at: status === "valid" ? new Date().toISOString() : null,
    };
    
    if (error) {
      updateData.validation_error = error;
    } else if (status === "valid") {
      updateData.validation_error = null;
    }
    
    const { error: updateError } = await supabase
      .from("user_api_keys")
      .update(updateData)
      .eq("id", keyId)
      .eq("user_id", userId);
    
    if (updateError) {
      console.error("Error updating validation status:", updateError);
      return { error: updateError.message };
    }
    
    return { error: null };
  } catch (error: any) {
    console.error("Error updating validation status:", error);
    return { error: error.message || "Failed to update validation status" };
  }
};

