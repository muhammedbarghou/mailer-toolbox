import { createClient } from "@supabase/supabase-js";

/**
 * Create Supabase admin client with service role key
 * Use this for operations that require bypassing RLS or accessing auth.users
 * 
 * WARNING: Only use server-side! Never expose service role key to client.
 */
export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required"
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

/**
 * Look up user by email using admin client
 * Returns user ID, email, and metadata
 * 
 * Note: This lists all users and searches. For large user bases,
 * consider implementing pagination or using a database function instead.
 */
export const getUserByEmail = async (email: string) => {
  const admin = createAdminClient();

  // Normalize email
  const normalizedEmail = email.trim().toLowerCase();

  // List users with pagination (fetch in batches if needed)
  let page = 1;
  const perPage = 1000; // Max per page
  
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(`Failed to list users: ${error.message}`);
    }

    // Search for user in current page
    const user = data.users.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    if (user) {
      return {
        id: user.id,
        email: user.email || email,
        name: user.user_metadata?.display_name || user.email || email,
        metadata: user.user_metadata,
      };
    }

    // If no more pages, user not found
    if (!data.users.length || data.users.length < perPage) {
      break;
    }

    page++;
  }

  return null;
};

