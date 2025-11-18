/**
 * Header parsing utilities for extracting sending IP and domain from email headers
 */

/**
 * Internal hop patterns to skip when parsing Received headers
 */
const INTERNAL_HOP_PATTERNS = [
  /google\.com/i,
  /gmail\.com/i,
  /googlemail\.com/i,
  /mx\.google\.com/i,
  /aspmx\.l\.google\.com/i,
];

/**
 * Check if a hostname is an internal hop (should be skipped)
 */
export const isInternalHop = (hostname: string): boolean => {
  return INTERNAL_HOP_PATTERNS.some((pattern) => pattern.test(hostname));
};

/**
 * Extract IPv4 or IPv6 address from a string
 */
const extractIpAddress = (text: string): string | null => {
  // IPv4 pattern
  const ipv4Pattern = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/;
  // IPv6 pattern (simplified)
  const ipv6Pattern = /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/;

  const ipv4Match = text.match(ipv4Pattern);
  if (ipv4Match) return ipv4Match[0];

  const ipv6Match = text.match(ipv6Pattern);
  if (ipv6Match) return ipv6Match[0];

  return null;
};

/**
 * Extract sending IP from Received headers
 * Prefers the earliest external hop
 */
export const extractSendingIp = (
  receivedHeaders: string[]
): string | null => {
  if (!receivedHeaders || receivedHeaders.length === 0) return null;

  // Process headers in reverse order (oldest first)
  for (let i = receivedHeaders.length - 1; i >= 0; i--) {
    const header = receivedHeaders[i];

    // Extract hostname from Received header
    // Format: "from hostname (domain) by ..."
    const fromMatch = header.match(/from\s+([^\s(]+)/i);
    if (!fromMatch) continue;

    const hostname = fromMatch[1].toLowerCase();

    // Skip internal hops
    if (isInternalHop(hostname)) continue;

    // Try to extract IP from the header
    const ip = extractIpAddress(header);
    if (ip) return ip;

    // If no IP in this header, check if hostname is an IP
    if (extractIpAddress(hostname)) {
      return hostname;
    }
  }

  // Fallback: try to extract any IP from all headers
  for (const header of receivedHeaders) {
    const ip = extractIpAddress(header);
    if (ip) return ip;
  }

  return null;
};

/**
 * Extract domain from DKIM signature
 */
const extractDkimDomain = (dkimHeader: string): string | null => {
  // DKIM format: v=1; a=rsa-sha256; d=example.com; ...
  const dkimMatch = dkimHeader.match(/d=([^;]+)/i);
  return dkimMatch ? dkimMatch[1].trim() : null;
};

/**
 * Extract domain from Return-Path header
 */
const extractReturnPathDomain = (returnPath: string): string | null => {
  // Return-Path: <user@domain.com>
  const emailMatch = returnPath.match(/<([^>]+)>/);
  if (!emailMatch) return null;

  const email = emailMatch[1];
  const domainMatch = email.match(/@([^\s>]+)/);
  return domainMatch ? domainMatch[1].trim() : null;
};

/**
 * Extract domain from From header
 */
const extractFromDomain = (fromHeader: string): string | null => {
  // From: Name <user@domain.com> or user@domain.com
  const emailMatch = fromHeader.match(/<([^>]+)>/) || fromHeader.match(/(\S+@\S+)/);
  if (!emailMatch) return null;

  const email = emailMatch[1];
  const domainMatch = email.match(/@([^\s>]+)/);
  return domainMatch ? domainMatch[1].trim() : null;
};

/**
 * Extract sending domain from headers
 * Priority: DKIM d= > Return-Path > From
 */
export const extractSendingDomain = (headers: {
  "DKIM-Signature"?: string;
  "Return-Path"?: string;
  From?: string;
}): string | null => {
  // Try DKIM first (most reliable)
  if (headers["DKIM-Signature"]) {
    const domain = extractDkimDomain(headers["DKIM-Signature"]);
    if (domain) return domain;
  }

  // Try Return-Path
  if (headers["Return-Path"]) {
    const domain = extractReturnPathDomain(headers["Return-Path"]);
    if (domain) return domain;
  }

  // Fallback to From
  if (headers.From) {
    const domain = extractFromDomain(headers.From);
    if (domain) return domain;
  }

  return null;
};

