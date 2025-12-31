import { createClient } from "@/lib/supabase/server";

export interface HeaderParameter {
  id: string;
  user_id: string;
  name: string;
  placeholder: string;
  description: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface HeaderParameterInput {
  name: string;
  placeholder: string;
  description?: string;
  display_order?: number;
}

/**
 * Get all header parameters for a user
 */
export const getUserHeaderParameters = async (
  userId: string
): Promise<HeaderParameter[]> => {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("user_header_parameters")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching header parameters:", error);
      return [];
    }

    return (data as HeaderParameter[]) || [];
  } catch (error) {
    console.error("Error getting header parameters:", error);
    return [];
  }
};

/**
 * Create a new header parameter
 */
export const createHeaderParameter = async (
  userId: string,
  input: HeaderParameterInput
): Promise<{ data: HeaderParameter | null; error: string | null }> => {
  try {
    const supabase = await createClient();

    // Get the next display order
    const { data: existingParams } = await supabase
      .from("user_header_parameters")
      .select("display_order")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("display_order", { ascending: false })
      .limit(1);

    const nextOrder =
      existingParams && existingParams.length > 0
        ? existingParams[0].display_order + 1
        : 0;

    const { data, error } = await supabase
      .from("user_header_parameters")
      .insert({
        user_id: userId,
        name: input.name.trim(),
        placeholder: input.placeholder.trim(),
        description: input.description?.trim() || null,
        display_order: input.display_order ?? nextOrder,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating header parameter:", error);
      return { data: null, error: error.message };
    }

    return { data: data as HeaderParameter, error: null };
  } catch (error: unknown) {
    console.error("Error creating header parameter:", error);
    const message = error instanceof Error ? error.message : "Failed to create header parameter";
    return { data: null, error: message };
  }
};

/**
 * Update a header parameter
 */
export const updateHeaderParameter = async (
  userId: string,
  parameterId: string,
  updates: Partial<HeaderParameterInput>
): Promise<{ data: HeaderParameter | null; error: string | null }> => {
  try {
    const supabase = await createClient();

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) {
      updateData.name = updates.name.trim();
    }
    if (updates.placeholder !== undefined) {
      updateData.placeholder = updates.placeholder.trim();
    }
    if (updates.description !== undefined) {
      updateData.description = updates.description?.trim() || null;
    }
    if (updates.display_order !== undefined) {
      updateData.display_order = updates.display_order;
    }

    const { data, error } = await supabase
      .from("user_header_parameters")
      .update(updateData)
      .eq("id", parameterId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating header parameter:", error);
      return { data: null, error: error.message };
    }

    return { data: data as HeaderParameter, error: null };
  } catch (error: unknown) {
    console.error("Error updating header parameter:", error);
    const message = error instanceof Error ? error.message : "Failed to update header parameter";
    return { data: null, error: message };
  }
};

/**
 * Delete (soft delete) a header parameter
 */
export const deleteHeaderParameter = async (
  userId: string,
  parameterId: string
): Promise<{ error: string | null }> => {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("user_header_parameters")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", parameterId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting header parameter:", error);
      return { error: error.message };
    }

    return { error: null };
  } catch (error: unknown) {
    console.error("Error deleting header parameter:", error);
    const message = error instanceof Error ? error.message : "Failed to delete header parameter";
    return { error: message };
  }
};

/**
 * Reorder header parameters
 */
export const reorderHeaderParameters = async (
  userId: string,
  parameterIds: string[]
): Promise<{ error: string | null }> => {
  try {
    const supabase = await createClient();

    // Update each parameter's display_order
    for (let i = 0; i < parameterIds.length; i++) {
      const { error } = await supabase
        .from("user_header_parameters")
        .update({ display_order: i, updated_at: new Date().toISOString() })
        .eq("id", parameterIds[i])
        .eq("user_id", userId);

      if (error) {
        console.error("Error reordering header parameter:", error);
        return { error: error.message };
      }
    }

    return { error: null };
  } catch (error: unknown) {
    console.error("Error reordering header parameters:", error);
    const message = error instanceof Error ? error.message : "Failed to reorder header parameters";
    return { error: message };
  }
};

/**
 * Default header parameters (used when user has no custom params)
 */
export const DEFAULT_HEADER_PARAMETERS: Omit<HeaderParameter, "id" | "user_id" | "created_at" | "updated_at">[] = [
  {
    name: "To Address",
    placeholder: "[*to]",
    description: "Recipient email address placeholder",
    is_active: true,
    display_order: 0,
  },
  {
    name: "Return Path Domain",
    placeholder: "[P_RPATH]",
    description: "Return path domain placeholder",
    is_active: true,
    display_order: 1,
  },
  {
    name: "Email ID",
    placeholder: "[EID]",
    description: "Unique email identifier placeholder",
    is_active: true,
    display_order: 2,
  },
  {
    name: "Random String",
    placeholder: "[RNDS]",
    description: "Random string placeholder for Message-ID domain",
    is_active: true,
    display_order: 3,
  },
];
