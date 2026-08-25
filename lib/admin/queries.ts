/**
 * Data access for the admin console.
 *
 * Every function here uses the service role client and calls a security-definer
 * RPC, so aggregation happens in Postgres rather than by pulling rows into JS.
 * Callers must already have passed requireAdmin.
 */

import { createAdminClient } from "@/lib/supabase/admin";

export type AdminRange = "24h" | "7d" | "30d" | "90d";

export const ADMIN_RANGES: { value: AdminRange; label: string }[] = [
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

const RANGE_HOURS: Record<AdminRange, number> = {
  "24h": 24,
  "7d": 24 * 7,
  "30d": 24 * 30,
  "90d": 24 * 90,
};

/**
 * Coerce an untrusted query param into a supported range
 */
export const parseRange = (value: string | null | undefined): AdminRange => {
  if (value && value in RANGE_HOURS) {
    return value as AdminRange;
  }
  return "30d";
};

/**
 * Convert a range into the inclusive-from, exclusive-to window the RPCs expect
 */
export const resolveRange = (range: AdminRange): { from: string; to: string } => {
  const to = new Date();
  const from = new Date(to.getTime() - RANGE_HOURS[range] * 60 * 60 * 1000);

  return { from: from.toISOString(), to: to.toISOString() };
};

export interface KpiSummary {
  total_users: number;
  new_users: number;
  active_users: number;
  signed_in_users: number;
  total_runs: number;
  total_views: number;
  error_runs: number;
  error_rate: number;
  cache_hits: number;
  cache_hit_rate: number;
  avg_duration_ms: number;
}

export interface DailyActivity {
  day: string;
  runs: number;
  errors: number;
  views: number;
  active_users: number;
  signups: number;
}

export interface ToolBreakdown {
  tool_slug: string;
  runs: number;
  views: number;
  unique_users: number;
  errors: number;
  error_rate: number;
  cache_hits: number;
  p95_duration_ms: number;
  last_used_at: string | null;
}

export interface AiBreakdown {
  provider: string;
  model: string;
  runs: number;
  cache_hits: number;
  errors: number;
  error_rate: number;
  avg_duration_ms: number;
  p95_duration_ms: number;
}

export interface ErrorBreakdown {
  tool_slug: string;
  provider: string;
  error_code: string;
  occurrences: number;
  last_seen_at: string;
}

export interface AdminUserRow {
  id: string;
  email: string;
  display_name: string | null;
  auth_provider: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed: boolean;
  total_runs: number;
  total_events: number;
  api_key_count: number;
  gmail_account_count: number;
  last_active_at: string | null;
  total_count: number;
}

export interface ApiKeyOverview {
  totals: {
    total: number;
    active: number;
    inactive: number;
    valid: number;
    invalid: number;
    expired: number;
    pending: number;
    never_validated: number;
    users_with_keys: number;
  };
  by_provider: {
    provider: string;
    total: number;
    active: number;
    valid: number;
    broken: number;
    users: number;
  }[];
  attention: {
    id: string;
    user_id: string;
    email: string | null;
    provider: string;
    key_name: string | null;
    is_active: boolean;
    is_default: boolean;
    validation_status: string;
    validation_error: string | null;
    last_validated_at: string | null;
    created_at: string;
  }[];
}

export interface GmailOverview {
  totals: {
    accounts: number;
    shares: number;
    audit_entries: number;
    expiring_tokens: number;
  };
  accounts: {
    id: string;
    email: string;
    owner_email: string | null;
    token_expires_at: string | null;
    created_at: string;
    viewer_count: number;
  }[];
  shares: {
    id: string;
    account_email: string | null;
    owner_email: string | null;
    viewer_email: string | null;
    created_at: string;
  }[];
  audit: {
    id: string;
    action: string;
    actor_email: string | null;
    account_email: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
  }[];
}

export interface UserDetail {
  profile: {
    id: string;
    email: string;
    display_name: string | null;
    avatar_url: string | null;
    auth_provider: string;
    created_at: string;
    last_sign_in_at: string | null;
    email_confirmed: boolean;
    banned_until: string | null;
  } | null;
  api_keys: {
    id: string;
    provider: string;
    key_name: string | null;
    is_active: boolean;
    is_default: boolean;
    validation_status: string;
    validation_error: string | null;
    last_validated_at: string | null;
    created_at: string;
  }[];
  gmail_accounts: {
    id: string;
    email: string;
    token_expires_at: string | null;
    created_at: string;
  }[];
  header_profiles: {
    id: string;
    name: string;
    is_default: boolean;
    created_at: string;
  }[];
  tool_usage: {
    tool_slug: string;
    runs: number;
    errors: number;
    last_used_at: string;
  }[];
  recent_events: {
    id: string;
    tool_slug: string;
    action: string;
    status: string;
    provider: string | null;
    model: string | null;
    cached: boolean;
    duration_ms: number | null;
    error_code: string | null;
    created_at: string;
  }[];
}

/**
 * Run an admin RPC, returning a fallback rather than throwing so one broken
 * panel cannot take down an entire admin page
 */
const callRpc = async <T>(
  fn: string,
  params: Record<string, unknown>,
  fallback: T
): Promise<T> => {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc(fn, params);

    if (error) {
      console.error(`Admin RPC ${fn} failed:`, error.message);
      return fallback;
    }

    return (data ?? fallback) as T;
  } catch (error) {
    console.error(`Admin RPC ${fn} threw:`, error);
    return fallback;
  }
};

const EMPTY_KPI: KpiSummary = {
  total_users: 0,
  new_users: 0,
  active_users: 0,
  signed_in_users: 0,
  total_runs: 0,
  total_views: 0,
  error_runs: 0,
  error_rate: 0,
  cache_hits: 0,
  cache_hit_rate: 0,
  avg_duration_ms: 0,
};

export const getKpiSummary = async (range: AdminRange): Promise<KpiSummary> => {
  const { from, to } = resolveRange(range);
  const rows = await callRpc<KpiSummary[]>(
    "admin_kpi_summary",
    { p_from: from, p_to: to },
    []
  );

  return rows[0] ?? EMPTY_KPI;
};

export const getDailyActivity = async (range: AdminRange): Promise<DailyActivity[]> => {
  const { from, to } = resolveRange(range);
  return callRpc<DailyActivity[]>("admin_daily_activity", { p_from: from, p_to: to }, []);
};

export const getToolBreakdown = async (range: AdminRange): Promise<ToolBreakdown[]> => {
  const { from, to } = resolveRange(range);
  return callRpc<ToolBreakdown[]>("admin_tool_breakdown", { p_from: from, p_to: to }, []);
};

export const getAiBreakdown = async (range: AdminRange): Promise<AiBreakdown[]> => {
  const { from, to } = resolveRange(range);
  return callRpc<AiBreakdown[]>("admin_ai_breakdown", { p_from: from, p_to: to }, []);
};

export const getErrorBreakdown = async (range: AdminRange): Promise<ErrorBreakdown[]> => {
  const { from, to } = resolveRange(range);
  return callRpc<ErrorBreakdown[]>("admin_error_breakdown", { p_from: from, p_to: to }, []);
};

export const getUserList = async (params: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ rows: AdminUserRow[]; totalCount: number }> => {
  const rows = await callRpc<AdminUserRow[]>(
    "admin_user_list",
    {
      p_search: params.search?.trim() || null,
      p_limit: params.limit ?? 50,
      p_offset: params.offset ?? 0,
    },
    []
  );

  return { rows, totalCount: rows[0]?.total_count ?? 0 };
};

export const getUserDetail = async (userId: string): Promise<UserDetail | null> => {
  const detail = await callRpc<UserDetail | null>(
    "admin_user_detail",
    { p_user_id: userId },
    null
  );

  if (!detail?.profile) {
    return null;
  }

  return detail;
};

export const getApiKeyOverview = async (): Promise<ApiKeyOverview> =>
  callRpc<ApiKeyOverview>("admin_api_key_overview", {}, {
    totals: {
      total: 0,
      active: 0,
      inactive: 0,
      valid: 0,
      invalid: 0,
      expired: 0,
      pending: 0,
      never_validated: 0,
      users_with_keys: 0,
    },
    by_provider: [],
    attention: [],
  });

export const getGmailOverview = async (): Promise<GmailOverview> =>
  callRpc<GmailOverview>("admin_gmail_overview", {}, {
    totals: { accounts: 0, shares: 0, audit_entries: 0, expiring_tokens: 0 },
    accounts: [],
    shares: [],
    audit: [],
  });

export interface AdminAuditEntry {
  id: string;
  actor_user_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

/**
 * Recent entries from the admin console's own audit trail
 */
export const getAdminAuditLog = async (limit = 50): Promise<AdminAuditEntry[]> => {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("admin_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Failed to read admin audit log:", error.message);
      return [];
    }

    return (data ?? []) as AdminAuditEntry[];
  } catch (error) {
    console.error("Failed to read admin audit log:", error);
    return [];
  }
};
