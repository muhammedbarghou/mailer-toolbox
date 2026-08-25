/**
 * Resolve the calling client's IP address from proxy headers.
 *
 * The IP drives signup blocking and rate limiting, so only headers the hosting
 * platform is known to overwrite on every request are trusted.
 * x-vercel-forwarded-for is written by Vercel's edge and cannot be forged by a
 * client; x-forwarded-for is the standard fallback for other proxies.
 *
 * Headers a client can set freely end-to-end (x-real-ip, cf-connecting-ip) are
 * deliberately not consulted by default, because trusting them would let an
 * attacker rotate their apparent IP at will and walk straight through both
 * controls. Deployments that sit behind a proxy which sets a different header
 * can name it in TRUSTED_CLIENT_IP_HEADER.
 */

export const UNKNOWN_IP = "unknown";

const PLATFORM_IP_HEADERS = ["x-vercel-forwarded-for", "x-forwarded-for"] as const;

/**
 * Read the first address from a possibly comma-separated forwarding header
 */
const firstAddress = (value: string | null): string | null => {
  const first = value?.split(",")[0]?.trim();
  return first && first.length > 0 ? first : null;
};

/**
 * Extract the client IP, or UNKNOWN_IP when no trusted header is present
 */
export const extractIpAddress = (headers: Headers): string => {
  const configuredHeader = process.env.TRUSTED_CLIENT_IP_HEADER?.trim().toLowerCase();

  const candidates = configuredHeader
    ? [configuredHeader, ...PLATFORM_IP_HEADERS]
    : [...PLATFORM_IP_HEADERS];

  for (const header of candidates) {
    const address = firstAddress(headers.get(header));
    if (address) {
      return address;
    }
  }

  return UNKNOWN_IP;
};
