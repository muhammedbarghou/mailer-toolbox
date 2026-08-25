/**
 * Access control utility for Gmail deliverability feature
 * Restricts access to authorized users only
 *
 * Delegates to the shared admin allowlist in lib/admin/access-control so there
 * is one place to change who has privileged access.
 */

import { ADMIN_EMAILS, isAdminEmail } from "@/lib/admin/access-control";

/**
 * Check if a user email has access to Gmail deliverability features
 * @param userEmail - The user's email address
 * @returns true if the user has access, false otherwise
 */
export const hasGmailDeliverabilityAccess = (userEmail: string | null | undefined): boolean => {
  return isAdminEmail(userEmail);
};

/**
 * Get the allowed email address
 * @returns The allowed email address
 */
export const getAllowedEmail = (): string => {
  return ADMIN_EMAILS[0];
};
