/**
 * Single source of truth for who counts as an admin.
 *
 * The allowlist is hardcoded rather than stored in the database, so a
 * compromised row cannot grant admin rights.
 *
 * This module stays free of server-only imports so it can be used from
 * proxy.ts and client components. The session-reading helper lives in
 * lib/admin/require-admin.ts.
 */

export const ADMIN_EMAILS = ["muhammedbarghou@gmail.com"] as const;

export type AdminEmail = (typeof ADMIN_EMAILS)[number];

export interface AdminUser {
  id: string;
  email: string;
}

/**
 * Check whether an email address belongs to the admin allowlist
 */
export const isAdminEmail = (email: string | null | undefined): boolean => {
  if (!email) {
    return false;
  }

  const normalized = email.trim().toLowerCase();
  return ADMIN_EMAILS.some((allowed) => allowed.toLowerCase() === normalized);
};
