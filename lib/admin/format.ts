/**
 * Display formatters shared across the admin console.
 *
 * All of these tolerate null so table cells never render "null" or crash on
 * sparse rows returned by the aggregation RPCs.
 */

/**
 * Format a whole number with thousands separators
 */
export const formatCount = (value: number | null | undefined): string => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "0";
  }
  return new Intl.NumberFormat("en-US").format(value);
};

/**
 * Format a percentage that is already expressed as 0-100
 */
export const formatPercent = (value: number | null | undefined): string => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "0%";
  }
  return `${Number(value).toFixed(value % 1 === 0 ? 0 : 1)}%`;
};

/**
 * Format a millisecond duration as ms or seconds, whichever reads better
 */
export const formatDuration = (value: number | null | undefined): string => {
  if (typeof value !== "number" || Number.isNaN(value) || value <= 0) {
    return "—";
  }
  if (value < 1000) {
    return `${Math.round(value)} ms`;
  }
  return `${(value / 1000).toFixed(1)} s`;
};

/**
 * Absolute date and time, e.g. "Aug 25, 2026, 1:32 PM"
 */
export const formatDateTime = (value: string | null | undefined): string => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

/**
 * Short date only, e.g. "Aug 25"
 */
export const formatShortDate = (value: string | null | undefined): string => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
};

/**
 * Coarse relative time, e.g. "3 days ago". Precision is intentionally low
 * because operators only need a sense of recency.
 */
export const formatRelativeTime = (value: string | null | undefined): string => {
  if (!value) {
    return "Never";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Never";
  }

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) {
    return "Just now";
  }

  const units: { limit: number; divisor: number; label: string }[] = [
    { limit: 3600, divisor: 60, label: "minute" },
    { limit: 86400, divisor: 3600, label: "hour" },
    { limit: 2592000, divisor: 86400, label: "day" },
    { limit: 31536000, divisor: 2592000, label: "month" },
  ];

  for (const unit of units) {
    if (seconds < unit.limit) {
      const amount = Math.floor(seconds / unit.divisor);
      return `${amount} ${unit.label}${amount === 1 ? "" : "s"} ago`;
    }
  }

  const years = Math.floor(seconds / 31536000);
  return `${years} year${years === 1 ? "" : "s"} ago`;
};

/**
 * Turn a tool route into a readable name, e.g. "/eml-to-txt-converter" ->
 * "Eml To Txt Converter"
 */
export const formatToolName = (slug: string): string => {
  return slug
    .replace(/^\//, "")
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * Mask an email for display, keeping enough to be recognisable
 */
export const maskEmail = (email: string | null | undefined): string => {
  if (!email) {
    return "—";
  }

  const [local, domain] = email.split("@");
  if (!domain) {
    return email;
  }

  const visible = local.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(local.length - 2, 1))}@${domain}`;
};
