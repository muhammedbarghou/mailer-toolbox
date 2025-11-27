import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isIPv4, isIPv6 } from "net";
import dns from "dns/promises";

type QueryType = "ip" | "domain" | "url";

interface AbuseIpdbReport {
  reportedAt: string;
  comment: string | null;
  categories: number[];
  reporterId: number;
  reporterCountryCode: string | null;
  reporterCountryName: string | null;
}

interface AbuseIpdbCheckData {
  ipAddress: string;
  isPublic: boolean;
  ipVersion: number;
  isWhitelisted: boolean | null;
  abuseConfidenceScore: number;
  countryCode: string | null;
  countryName?: string | null;
  usageType: string | null;
  isp: string | null;
  domain: string | null;
  hostnames: string[];
  isTor: boolean;
  totalReports: number;
  numDistinctUsers: number;
  lastReportedAt: string | null;
  reports?: AbuseIpdbReport[];
}

interface AbuseIpdbErrorItem {
  detail: string;
  status: number | string;
}

interface AbuseIpdbErrorResponse {
  errors?: AbuseIpdbErrorItem[];
}

interface ReputationQueryItem {
  input: string;
}

interface ReputationRequestBody {
  items: ReputationQueryItem[];
  maxAgeInDays?: number;
  verbose?: boolean;
}

interface ReputationResultItem {
  input: string;
  queryType: QueryType;
  value: string;
  ipAddress?: string;
  success: boolean;
  error?: string;
  data?: AbuseIpdbCheckData;
}

const isIpAddress = (value: string): boolean => {
  if (!value) return false;
  return isIPv4(value) || isIPv6(value);
};

const parseQueryValue = (raw: string): { queryType: QueryType; value: string } => {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("Empty value");
  }

  if (isIpAddress(trimmed)) {
    return { queryType: "ip", value: trimmed };
  }

  let url: URL | null = null;
  try {
    url = new URL(trimmed);
  } catch {
    try {
      url = new URL(`http://${trimmed}`);
    } catch {
      return { queryType: "domain", value: trimmed };
    }
  }

  return { queryType: "url", value: url.hostname };
};

const resolveToIpAddress = async (value: string): Promise<string> => {
  if (isIpAddress(value)) {
    return value;
  }

  try {
    const addresses = await dns.resolve4(value);
    if (addresses.length > 0) {
      return addresses[0];
    }
  } catch {
  }

  try {
    const addresses6 = await dns.resolve6(value);
    if (addresses6.length > 0) {
      return addresses6[0];
    }
  } catch {
  }

  throw new Error("Unable to resolve hostname to IP address");
};

const fetchAbuseIpdbCheck = async (
  ipAddress: string,
  apiKey: string,
  maxAgeInDays: number,
  verbose: boolean,
): Promise<AbuseIpdbCheckData> => {
  const searchParams = new URLSearchParams();
  searchParams.set("ipAddress", ipAddress);
  searchParams.set("maxAgeInDays", String(maxAgeInDays));
  if (verbose) {
    searchParams.set("verbose", "");
  }

  const url = `https://api.abuseipdb.com/api/v2/check?${searchParams.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Key: apiKey,
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!response.ok) {
    let errorMessage = `AbuseIPDB request failed with status ${response.status}`;

    if (isJson) {
      const errorBody: AbuseIpdbErrorResponse = await response.json().catch(() => ({}));
      if (errorBody?.errors && errorBody.errors.length > 0) {
        errorMessage = errorBody.errors[0].detail || errorMessage;
      }
    }

    throw new Error(errorMessage);
  }

  if (!isJson) {
    throw new Error("Unexpected response from AbuseIPDB (non-JSON)");
  }

  const json = (await response.json()) as { data: AbuseIpdbCheckData };
  if (!json || !json.data) {
    throw new Error("Invalid response from AbuseIPDB");
  }

  return json.data;
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: "Authentication required. Please sign in to use the IP reputation tool.",
        },
        { status: 401 },
      );
    }

    let body: ReputationRequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    if (!body || !Array.isArray(body.items)) {
      return NextResponse.json(
        { error: "Request body must include an 'items' array." },
        { status: 400 },
      );
    }

    const trimmedItems = body.items
      .map((item) => ({
        input: (item?.input || "").trim(),
      }))
      .filter((item) => item.input.length > 0);

    if (trimmedItems.length === 0) {
      return NextResponse.json(
        { error: "Please provide at least one IP address, domain, or URL." },
        { status: 400 },
      );
    }

    if (trimmedItems.length > 30) {
      return NextResponse.json(
        { error: "You can check up to 30 IPs/domains/URLs at a time." },
        { status: 400 },
      );
    }

    const maxAgeInDaysRaw = body.maxAgeInDays;
    let maxAgeInDays = 30;
    if (typeof maxAgeInDaysRaw === "number" && !Number.isNaN(maxAgeInDaysRaw)) {
      maxAgeInDays = Math.min(Math.max(Math.floor(maxAgeInDaysRaw), 1), 365);
    }

    const verbose = Boolean(body.verbose);

    const apiKey = process.env.ABUSEIPDB_API_KEY;
    if (!apiKey || apiKey.trim().length === 0) {
      return NextResponse.json(
        {
          error:
            "AbuseIPDB API key is not configured. Please set the ABUSEIPDB_API_KEY environment variable on the server.",
        },
        { status: 500 },
      );
    }

    const results: ReputationResultItem[] = [];

    for (const item of trimmedItems) {
      const baseResult: ReputationResultItem = {
        input: item.input,
        queryType: "ip",
        value: item.input,
        success: false,
      };

      try {
        const { queryType, value } = parseQueryValue(item.input);
        baseResult.queryType = queryType;
        baseResult.value = value;

        const ipAddress = await resolveToIpAddress(value);
        baseResult.ipAddress = ipAddress;

        const data = await fetchAbuseIpdbCheck(
          ipAddress,
          apiKey,
          maxAgeInDays,
          verbose,
        );

        baseResult.data = data;
        baseResult.success = true;
      } catch (error: any) {
        baseResult.error =
          typeof error?.message === "string"
            ? error.message
            : "Failed to check reputation for this item.";
        baseResult.success = false;
      }

      results.push(baseResult);
    }

    return NextResponse.json({
      maxAgeInDays,
      verbose,
      count: results.length,
      results,
    });
  } catch (error: any) {
    const message =
      typeof error?.message === "string"
        ? error.message
        : "An unexpected error occurred while checking IP reputation.";
    console.error("Error in /api/ip-reputation:", error);

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 },
    );
  }
}


