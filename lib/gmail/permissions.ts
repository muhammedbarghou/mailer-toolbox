import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface GmailAccount {
  id: string;
  user_id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface GmailPermission {
  id: string;
  gmail_account_id: string;
  viewer_user_id: string;
  created_at: string;
}

/**
 * Get all Gmail accounts a user can access
 * Returns accounts they own + accounts shared with them
 */
export const getGmailAccountsForUser = async (
  userId: string
): Promise<GmailAccount[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("gmail_accounts")
    .select("id, user_id, email, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching Gmail accounts:", error);
    return [];
  }

  return (data || []) as GmailAccount[];
};

/**
 * Get accounts owned by a user
 */
export const getOwnedGmailAccounts = async (
  userId: string
): Promise<GmailAccount[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("gmail_accounts")
    .select("id, user_id, email, created_at, updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching owned Gmail accounts:", error);
    return [];
  }

  return (data || []) as GmailAccount[];
};

/**
 * Get accounts shared with a user
 */
export const getSharedGmailAccounts = async (
  userId: string
): Promise<GmailAccount[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("gmail_account_permissions")
    .select(`
      gmail_account_id,
      gmail_accounts (
        id,
        user_id,
        email,
        created_at,
        updated_at
      )
    `)
    .eq("viewer_user_id", userId);

  if (error) {
    console.error("Error fetching shared Gmail accounts:", error);
    return [];
  }

  return (
    (data || []).map((item: any) => item.gmail_accounts).filter(Boolean) as
      GmailAccount[]
  );
};

/**
 * Check if a user has permission to view an account
 */
export const checkViewerPermission = async (
  accountId: string,
  userId: string
): Promise<boolean> => {
  const supabase = await createClient();

  // Check if user owns the account
  const { data: account } = await supabase
    .from("gmail_accounts")
    .select("user_id")
    .eq("id", accountId)
    .single();

  if (account?.user_id === userId) return true;

  // Check if user has viewer permission
  const { data: permission } = await supabase
    .from("gmail_account_permissions")
    .select("id")
    .eq("gmail_account_id", accountId)
    .eq("viewer_user_id", userId)
    .single();

  return !!permission;
};

/**
 * Add viewer permission for an account
 * Only account owner can add viewers
 */
export const addViewerPermission = async (
  accountId: string,
  ownerUserId: string,
  viewerUserId: string
): Promise<GmailPermission | null> => {
  const supabase = await createClient();

  // Verify ownership
  const { data: account } = await supabase
    .from("gmail_accounts")
    .select("user_id")
    .eq("id", accountId)
    .eq("user_id", ownerUserId)
    .single();

  if (!account) {
    throw new Error("Account not found or access denied");
  }

  // Check if permission already exists
  const { data: existing } = await supabase
    .from("gmail_account_permissions")
    .select("id")
    .eq("gmail_account_id", accountId)
    .eq("viewer_user_id", viewerUserId)
    .single();

  if (existing) {
    // Permission already exists
    const { data } = await supabase
      .from("gmail_account_permissions")
      .select()
      .eq("id", existing.id)
      .single();
    return data as GmailPermission | null;
  }

  // Create new permission
  const { data, error } = await supabase
    .from("gmail_account_permissions")
    .insert({
      gmail_account_id: accountId,
      viewer_user_id: viewerUserId,
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding viewer permission:", error);
    return null;
  }

  return data as GmailPermission;
};

/**
 * Remove viewer permission for an account
 * Only account owner can remove viewers
 */
export const removeViewerPermission = async (
  accountId: string,
  ownerUserId: string,
  viewerUserId: string
): Promise<boolean> => {
  const supabase = await createClient();

  // Verify ownership
  const { data: account } = await supabase
    .from("gmail_accounts")
    .select("user_id")
    .eq("id", accountId)
    .eq("user_id", ownerUserId)
    .single();

  if (!account) {
    throw new Error("Account not found or access denied");
  }

  const { error } = await supabase
    .from("gmail_account_permissions")
    .delete()
    .eq("gmail_account_id", accountId)
    .eq("viewer_user_id", viewerUserId);

  return !error;
};

/**
 * Get all viewers for an account
 * Note: With the simplified RLS policy, owners can query permissions
 * by first getting accounts they own, then querying permissions for those accounts
 */
export const getAccountViewers = async (
  accountId: string,
  ownerUserId: string
): Promise<Array<{ id: string; email: string; name: string }>> => {
  const supabase = await createClient();

  // Verify ownership first (this works because we're checking user_id directly)
  const { data: account } = await supabase
    .from("gmail_accounts")
    .select("user_id")
    .eq("id", accountId)
    .eq("user_id", ownerUserId)
    .single();

  if (!account) {
    return [];
  }

  // Get permissions for this account
  // Since we verified ownership, we can query permissions directly
  // The RLS policy allows this because we're querying by account_id
  // and we've already verified the user owns the account
  const { data: permissions, error } = await supabase
    .from("gmail_account_permissions")
    .select("viewer_user_id")
    .eq("gmail_account_id", accountId);

  if (error) {
    console.error("Error fetching permissions:", error);
    return [];
  }

  // Fetch user info for each viewer using RPC function or admin client
  const viewers: Array<{ id: string; email: string; name: string }> = [];
  
  for (const perm of permissions || []) {
    try {
      // Try to get user info using the RPC function (if available)
      const { data: userData, error: rpcError } = await supabase.rpc(
        "get_user_by_id",
        { user_id: perm.viewer_user_id }
      );

      // RPC function returns a table, which Supabase returns as an array
      if (!rpcError && userData && Array.isArray(userData) && userData.length > 0) {
        const user = userData[0];
        viewers.push({
          id: user.id,
          email: user.email || `user-${perm.viewer_user_id.substring(0, 8)}@example.com`,
          name: user.raw_user_meta_data?.display_name || user.email || `User ${perm.viewer_user_id.substring(0, 8)}`,
        });
      } else {
        // Fallback: Use admin client to get user info
        try {
          const admin = createAdminClient();
          const { data: adminUser, error: adminError } = await admin.auth.admin.getUserById(perm.viewer_user_id);
          
          if (!adminError && adminUser?.user) {
            viewers.push({
              id: adminUser.user.id,
              email: adminUser.user.email || `user-${perm.viewer_user_id.substring(0, 8)}@example.com`,
              name: adminUser.user.user_metadata?.display_name || adminUser.user.email || `User ${perm.viewer_user_id.substring(0, 8)}`,
            });
          } else {
            // Last resort: return placeholder
            viewers.push({
              id: perm.viewer_user_id,
              email: `user-${perm.viewer_user_id.substring(0, 8)}@example.com`,
              name: `User ${perm.viewer_user_id.substring(0, 8)}`,
            });
          }
        } catch (adminError) {
          // If admin lookup fails, return placeholder
          viewers.push({
            id: perm.viewer_user_id,
            email: `user-${perm.viewer_user_id.substring(0, 8)}@example.com`,
            name: `User ${perm.viewer_user_id.substring(0, 8)}`,
          });
        }
      }
    } catch (error) {
      // If all lookups fail, still return the user ID
      viewers.push({
        id: perm.viewer_user_id,
        email: `user-${perm.viewer_user_id.substring(0, 8)}@example.com`,
        name: `User ${perm.viewer_user_id.substring(0, 8)}`,
      });
    }
  }

  return viewers;
};

