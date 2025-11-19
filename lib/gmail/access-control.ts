/**
 * Access control utility for Gmail deliverability feature
 * Restricts access to authorized users only
 */

const ALLOWED_EMAIL = "muhammedbarghou@gmail.com";

/**
 * Check if a user email has access to Gmail deliverability features
 * @param userEmail - The user's email address
 * @returns true if the user has access, false otherwise
 */
export const hasGmailDeliverabilityAccess = (userEmail: string | null | undefined): boolean => {
  if (!userEmail) {
    return false;
  }
  return userEmail.toLowerCase() === ALLOWED_EMAIL.toLowerCase();
};

/**
 * Get the allowed email address
 * @returns The allowed email address
 */
export const getAllowedEmail = (): string => {
  return ALLOWED_EMAIL;
};
