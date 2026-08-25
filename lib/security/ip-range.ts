/**
 * Classification of IP addresses that must never be probed on a user's behalf.
 *
 * User-supplied hostnames are resolved server-side before being looked up. Without
 * this check a caller could point a hostname at a private or loopback address and
 * use the resolved value in the response to map internal infrastructure.
 */

import { isIPv4, isIPv6 } from "net";

/**
 * Private, loopback, link-local and other non-routable IPv4 ranges
 */
const isPrivateIpv4 = (address: string): boolean => {
  const octets = address.split(".").map(Number);

  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet))) {
    return true; // Unparseable means untrusted
  }

  const [first, second] = octets;

  if (first === 0) return true; // 0.0.0.0/8 "this network"
  if (first === 10) return true; // 10.0.0.0/8 private
  if (first === 127) return true; // 127.0.0.0/8 loopback
  if (first === 169 && second === 254) return true; // 169.254.0.0/16 link-local
  if (first === 172 && second >= 16 && second <= 31) return true; // 172.16.0.0/12 private
  if (first === 192 && second === 0) return true; // 192.0.0.0/24 and 192.0.2.0/24
  if (first === 192 && second === 168) return true; // 192.168.0.0/16 private
  if (first === 198 && (second === 18 || second === 19)) return true; // 198.18.0.0/15 benchmarking
  if (first >= 224) return true; // multicast, reserved and broadcast

  return false;
};

/**
 * Loopback, unique-local and link-local IPv6 ranges, including IPv4-mapped forms
 */
const isPrivateIpv6 = (address: string): boolean => {
  const normalized = address.toLowerCase().split("%")[0];

  if (normalized === "::" || normalized === "::1") return true;

  // IPv4-mapped (::ffff:10.0.0.1) and IPv4-compatible addresses
  const mapped = normalized.match(/^::(ffff:)?(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) {
    return isPrivateIpv4(mapped[2]);
  }

  if (/^f[cd][0-9a-f]{2}:/.test(normalized)) return true; // fc00::/7 unique-local
  if (/^fe[89ab][0-9a-f]:/.test(normalized)) return true; // fe80::/10 link-local
  if (/^ff[0-9a-f]{2}:/.test(normalized)) return true; // ff00::/8 multicast

  return false;
};

/**
 * Whether an address is private, loopback or otherwise not publicly routable
 */
export const isPrivateIpAddress = (address: string): boolean => {
  const trimmed = address.trim();

  if (isIPv4(trimmed)) {
    return isPrivateIpv4(trimmed);
  }

  if (isIPv6(trimmed)) {
    return isPrivateIpv6(trimmed);
  }

  return true; // Not a valid address, so treat it as untrusted
};
