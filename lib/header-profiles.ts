import { createClient } from "@/lib/supabase/server";

export interface HeaderProcessingProfile {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  custom_headers: string[];
  processing_config: Record<string, unknown>;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface HeaderProfileParameter {
  id: string;
  profile_id: string;
  parameter_id: string;
  display_order: number;
  created_at: string;
}

export interface HeaderProfileInput {
  name: string;
  description?: string;
  custom_headers?: string[];
  processing_config?: Record<string, unknown>;
  parameter_ids?: string[];
  is_default?: boolean;
}

export interface HeaderProfileWithParameters extends HeaderProcessingProfile {
  parameters: Array<{
    id: string;
    parameter_id: string;
    display_order: number;
  }>;
}

/**
 * Get all header profiles for a user
 */
export const getUserHeaderProfiles = async (
  userId: string
): Promise<HeaderProcessingProfile[]> => {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("header_processing_profiles")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching header profiles:", error);
      return [];
    }

    return (data as HeaderProcessingProfile[]) || [];
  } catch (error) {
    console.error("Error getting header profiles:", error);
    return [];
  }
};

/**
 * Get a single header profile with its parameters
 */
export const getHeaderProfile = async (
  profileId: string,
  userId: string
): Promise<{ data: HeaderProfileWithParameters | null; error: string | null }> => {
  try {
    const supabase = await createClient();

    // Get the profile
    const { data: profile, error: profileError } = await supabase
      .from("header_processing_profiles")
      .select("*")
      .eq("id", profileId)
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      return { data: null, error: profileError?.message || "Profile not found" };
    }

    // Get associated parameters
    const { data: profileParams, error: paramsError } = await supabase
      .from("header_profile_parameters")
      .select("*")
      .eq("profile_id", profileId)
      .order("display_order", { ascending: true });

    if (paramsError) {
      console.error("Error fetching profile parameters:", paramsError);
      // Don't fail if parameters can't be loaded - profile might have no parameters
    }

    return {
      data: {
        ...(profile as HeaderProcessingProfile),
        parameters: (profileParams as HeaderProfileParameter[]) || [],
      },
      error: null,
    };
  } catch (error: unknown) {
    console.error("Error getting header profile:", error);
    const message = error instanceof Error ? error.message : "Failed to get header profile";
    return { data: null, error: message };
  }
};

/**
 * Create a new header profile
 */
export const createHeaderProfile = async (
  userId: string,
  input: HeaderProfileInput
): Promise<{ data: HeaderProcessingProfile | null; error: string | null }> => {
  try {
    const supabase = await createClient();

    // Use atomic database function to create profile with default handling
    // This ensures the "unset other defaults" + "insert new profile" happens atomically
    const { data: profile, error: profileError } = await supabase.rpc(
      "create_header_profile_atomic",
      {
        p_user_id: userId,
        p_name: input.name.trim(),
        p_description: input.description?.trim() || null,
        p_custom_headers: input.custom_headers || [],
        p_processing_config: input.processing_config || {},
        p_is_default: input.is_default || false,
      }
    );

    if (profileError || !profile) {
      return { data: null, error: profileError?.message || "Failed to create profile" };
    }

    // Add associated parameters if provided
    if (input.parameter_ids && input.parameter_ids.length > 0) {
      const profileParams = input.parameter_ids.map((paramId, index) => ({
        profile_id: profile.id,
        parameter_id: paramId,
        display_order: index,
      }));

      const { error: paramsError } = await supabase
        .from("header_profile_parameters")
        .insert(profileParams);

      if (paramsError) {
        console.error("Error creating profile parameters:", paramsError);
        // Don't fail the whole operation, just log the error
      }
    }

    return { data: profile as HeaderProcessingProfile, error: null };
  } catch (error: unknown) {
    console.error("Error creating header profile:", error);
    const message = error instanceof Error ? error.message : "Failed to create header profile";
    return { data: null, error: message };
  }
};

/**
 * Update a header profile
 */
export const updateHeaderProfile = async (
  profileId: string,
  userId: string,
  updates: Partial<HeaderProfileInput>
): Promise<{ data: HeaderProcessingProfile | null; error: string | null }> => {
  try {
    const supabase = await createClient();

    // Use atomic database function to update profile with default handling
    // This ensures the "unset other defaults" + "update profile" happens atomically
    const { data, error } = await supabase.rpc("update_header_profile_atomic", {
      p_profile_id: profileId,
      p_user_id: userId,
      p_name: updates.name !== undefined ? updates.name.trim() : null,
      p_description: updates.description !== undefined ? updates.description?.trim() || null : null,
      p_custom_headers: updates.custom_headers !== undefined ? updates.custom_headers : null,
      p_processing_config: updates.processing_config !== undefined ? updates.processing_config : null,
      p_is_default: updates.is_default !== undefined ? updates.is_default : null,
    });

    if (error) {
      console.error("Error updating header profile:", error);
      return { data: null, error: error.message };
    }

    // Update parameters if provided
    if (updates.parameter_ids !== undefined) {
      // Delete existing parameters
      await supabase.from("header_profile_parameters").delete().eq("profile_id", profileId);

      // Insert new parameters
      if (updates.parameter_ids.length > 0) {
        const profileParams = updates.parameter_ids.map((paramId, index) => ({
          profile_id: profileId,
          parameter_id: paramId,
          display_order: index,
        }));

        const { error: paramsError } = await supabase
          .from("header_profile_parameters")
          .insert(profileParams);

        if (paramsError) {
          console.error("Error updating profile parameters:", paramsError);
        }
      }
    }

    return { data: data as HeaderProcessingProfile, error: null };
  } catch (error: unknown) {
    console.error("Error updating header profile:", error);
    const message = error instanceof Error ? error.message : "Failed to update header profile";
    return { data: null, error: message };
  }
};

/**
 * Delete a header profile
 */
export const deleteHeaderProfile = async (
  profileId: string,
  userId: string
): Promise<{ error: string | null }> => {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("header_processing_profiles")
      .delete()
      .eq("id", profileId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting header profile:", error);
      return { error: error.message };
    }

    return { error: null };
  } catch (error: unknown) {
    console.error("Error deleting header profile:", error);
    const message = error instanceof Error ? error.message : "Failed to delete header profile";
    return { error: message };
  }
};

/**
 * Apply a profile configuration (returns the config to use)
 */
export const applyHeaderProfile = async (
  profileId: string,
  userId: string
): Promise<{
  data: {
    parameters: Array<{ id: string; name: string; placeholder: string; description: string | null }>;
    customHeaders: string[];
    processingConfig: Record<string, unknown>;
  } | null;
  error: string | null;
}> => {
  try {
    const { data: profile, error: profileError } = await getHeaderProfile(profileId, userId);

    if (profileError || !profile) {
      return { data: null, error: profileError || "Profile not found" };
    }

    // Get the actual parameter details
    const supabase = await createClient();
    const parameterIds = profile.parameters.map((p) => p.parameter_id);

    if (parameterIds.length === 0) {
      // Return empty parameters array - component will use defaults
      return {
        data: {
          parameters: [],
          customHeaders: profile.custom_headers || [],
          processingConfig: profile.processing_config || {},
        },
        error: null,
      };
    }

    const { data: parameters, error: paramsError } = await supabase
      .from("user_header_parameters")
      .select("id, name, placeholder, description")
      .in("id", parameterIds)
      .eq("user_id", userId)
      .eq("is_active", true);

    if (paramsError) {
      console.error("Error fetching parameters:", paramsError);
      return { data: null, error: `Failed to load profile parameters: ${paramsError.message}` };
    }

    if (!parameters || parameters.length === 0) {
      // Profile references parameters that don't exist or are inactive
      return {
        data: {
          parameters: [],
          customHeaders: profile.custom_headers || [],
          processingConfig: profile.processing_config || {},
        },
        error: null,
      };
    }

    // Sort parameters by display_order from profile
    const sortedParameters = profile.parameters
      .map((pp) => {
        const param = parameters.find((p) => p.id === pp.parameter_id);
        return param
          ? {
              id: param.id,
              name: param.name,
              placeholder: param.placeholder,
              description: param.description,
            }
          : null;
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    return {
      data: {
        parameters: sortedParameters,
        customHeaders: profile.custom_headers || [],
        processingConfig: profile.processing_config || {},
      },
      error: null,
    };
  } catch (error: unknown) {
    console.error("Error applying header profile:", error);
    const message = error instanceof Error ? error.message : "Failed to apply header profile";
    return { data: null, error: message };
  }
};
