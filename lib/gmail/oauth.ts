import crypto from "crypto";

/**
 * Generate CSRF state token for OAuth flow
 */
export const generateStateToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Generate Google OAuth2 authorization URL
 */
export const generateAuthUrl = (state: string, redirectUri: string): string => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID environment variable is required");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/gmail.readonly",
    access_type: "offline", // Required to get refresh token
    prompt: "consent", // Force consent screen to get refresh token
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

/**
 * Exchange authorization code for tokens
 */
export const exchangeCodeForTokens = async (
  code: string,
  redirectUri: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}> => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are required"
    );
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    const errorMessage = error.error_description || error.error || "Unknown error";
    
    // Provide more specific error messages
    if (error.error === "invalid_client" || errorMessage.includes("deleted")) {
      throw new Error(
        "OAuth client configuration error. The OAuth client may have been deleted or the credentials are invalid. Please check your GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables."
      );
    }
    
    throw new Error(
      `Failed to exchange code for tokens: ${errorMessage}`
    );
  }

  const data = await response.json();

  if (!data.access_token || !data.refresh_token) {
    throw new Error("Invalid token response: missing access_token or refresh_token");
  }

  const expiresIn = data.expires_in || 3600; // Default 1 hour
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt,
  };
};

/**
 * Revoke an access token
 */
export const revokeToken = async (token: string): Promise<boolean> => {
  try {
    const response = await fetch(
      `https://oauth2.googleapis.com/revoke?token=${token}`,
      { method: "POST" }
    );

    return response.ok;
  } catch (error) {
    console.error("Error revoking token:", error);
    return false;
  }
};

/**
 * Get user email from Gmail API using access token
 */
export const getUserEmail = async (accessToken: string): Promise<string> => {
  const response = await fetch(
    "https://www.googleapis.com/gmail/v1/users/me/profile",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to get user email from Gmail API");
  }

  const data = await response.json();
  return data.emailAddress || "";
};

