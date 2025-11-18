import { createClient } from "@/lib/supabase/server";
import { encryptGmailToken, decryptGmailToken } from "@/lib/encryption";

export interface GmailAccount {
  id: string;
  user_id: string;
  email: string;
  access_token: string; // encrypted
  refresh_token: string; // encrypted
  token_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DecryptedTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date | null;
}

/**
 * Store Gmail OAuth tokens in database (encrypted)
 * Server-side only
 */
export const storeGmailTokens = async (
  userId: string,
  email: string,
  accessToken: string,
  refreshToken: string,
  expiresAt: Date | null
): Promise<GmailAccount> => {
  const supabase = await createClient();

  // Encrypt tokens
  const encryptedAccessToken = encryptGmailToken(accessToken);
  const encryptedRefreshToken = encryptGmailToken(refreshToken);

  // Check if account already exists
  const { data: existing } = await supabase
    .from("gmail_accounts")
    .select("id")
    .eq("user_id", userId)
    .eq("email", email)
    .single();

  if (existing) {
    // Update existing account
    const { data, error } = await supabase
      .from("gmail_accounts")
      .update({
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        token_expires_at: expiresAt?.toISOString() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;
    return data as GmailAccount;
  } else {
    // Create new account
    const { data, error } = await supabase
      .from("gmail_accounts")
      .insert({
        user_id: userId,
        email,
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        token_expires_at: expiresAt?.toISOString() || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data as GmailAccount;
  }
};

/**
 * Get decrypted Gmail tokens for an account
 * Server-side only - never expose to frontend
 */
export const getGmailTokens = async (
  accountId: string
): Promise<DecryptedTokens | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("gmail_accounts")
    .select("access_token, refresh_token, token_expires_at")
    .eq("id", accountId)
    .single();

  if (error || !data) return null;

  try {
    return {
      accessToken: decryptGmailToken(data.access_token),
      refreshToken: decryptGmailToken(data.refresh_token),
      expiresAt: data.token_expires_at
        ? new Date(data.token_expires_at)
        : null,
    };
  } catch (error) {
    console.error("Error decrypting tokens:", error);
    return null;
  }
};

/**
 * Refresh Gmail access token using refresh token
 */
export const refreshGmailToken = async (
  accountId: string
): Promise<GmailAccount | null> => {
  const supabase = await createClient();

  // Get current tokens
  const tokens = await getGmailTokens(accountId);
  if (!tokens) return null;

  // Check if token is expired or expiring soon (within 5 minutes)
  const now = new Date();
  const expiresAt = tokens.expiresAt;
  if (expiresAt && expiresAt > new Date(now.getTime() + 5 * 60 * 1000)) {
    // Token still valid, return existing account
    const { data } = await supabase
      .from("gmail_accounts")
      .select()
      .eq("id", accountId)
      .single();
    return data as GmailAccount | null;
  }

  // Refresh token via Google OAuth API
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: tokens.refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Token refresh error:", error);
      return null;
    }

    const data = await response.json();
    const newAccessToken = data.access_token;
    const expiresIn = data.expires_in || 3600; // Default 1 hour
    const newExpiresAt = new Date(
      now.getTime() + expiresIn * 1000
    );

    // Update database
    const encryptedAccessToken = encryptGmailToken(newAccessToken);

    const { data: updated, error: updateError } = await supabase
      .from("gmail_accounts")
      .update({
        access_token: encryptedAccessToken,
        token_expires_at: newExpiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", accountId)
      .select()
      .single();

    if (updateError) throw updateError;
    return updated as GmailAccount;
  } catch (error) {
    console.error("Error refreshing token:", error);
    return null;
  }
};

/**
 * Revoke Gmail tokens and delete account
 */
export const revokeGmailToken = async (
  accountId: string,
  userId: string
): Promise<boolean> => {
  const supabase = await createClient();

  // Verify ownership
  const { data: account } = await supabase
    .from("gmail_accounts")
    .select("access_token, refresh_token")
    .eq("id", accountId)
    .eq("user_id", userId)
    .single();

  if (!account) return false;

  try {
    // Revoke token via Google
    const tokens = await getGmailTokens(accountId);
    if (tokens) {
      await fetch(
        `https://oauth2.googleapis.com/revoke?token=${tokens.accessToken}`,
        { method: "POST" }
      );
    }
  } catch (error) {
    console.error("Error revoking token:", error);
    // Continue with deletion even if revocation fails
  }

  // Delete from database
  const { error } = await supabase
    .from("gmail_accounts")
    .delete()
    .eq("id", accountId)
    .eq("user_id", userId);

  return !error;
};

