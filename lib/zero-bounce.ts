import ZeroBounceSDK from "@zerobounce/zero-bounce-sdk";
import { Redis } from "@upstash/redis";
import { UNKNOWN_IP } from "@/lib/security/client-ip";

// Initialize ZeroBounce SDK
const zeroBounce = new ZeroBounceSDK();
const ZEROBOUNCE_API_KEY = process.env.ZEROBOUNCE_API_KEY;

if (ZEROBOUNCE_API_KEY) {
  zeroBounce.init(ZEROBOUNCE_API_KEY);
}

// Initialize Redis client for IP tracking
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = REDIS_URL && REDIS_TOKEN
  ? new Redis({
      url: REDIS_URL,
      token: REDIS_TOKEN,
    })
  : null;

// Configuration
const SPAM_TRAP_THRESHOLD = 3; // Block after 3 spam trap attempts
const ATTEMPT_EXPIRY = 86400; // 24 hours in seconds (for attempts counter)

// Validation result interface
export interface EmailValidationResult {
  valid: boolean;
  status: string;
  isSpamTrap: boolean;
  isDisposable: boolean;
  isInvalid: boolean;
  error?: string;
  details?: {
    address: string;
    status: string;
    sub_status: string;
    free_email: boolean;
    did_you_mean: string | null;
    account: string;
    domain: string;
    domain_age_days: string;
    smtp_provider: string;
    mx_found: string;
    mx_record: string;
    firstname: string;
    lastname: string;
    gender: string;
    country: string;
    region: string;
    city: string;
    zipcode: string;
    processed_at: string;
  };
}

/**
 * Check if an IP address is permanently blocked
 */
export const isIpBlocked = async (ip: string): Promise<boolean> => {
  if (!redis || ip === UNKNOWN_IP) {
    return false;
  }

  try {
    const blocked = await redis.get<boolean>(`spam-trap:blocked:${ip}`);
    return blocked === true;
  } catch (error) {
    console.error("Redis error checking IP block status:", error);
    return false;
  }
};

/**
 * Get the current spam trap attempt count for an IP
 */
export const getSpamTrapAttempts = async (ip: string): Promise<number> => {
  if (!redis || ip === UNKNOWN_IP) {
    return 0;
  }

  try {
    const attempts = await redis.get<number>(`spam-trap:attempts:${ip}`);
    return attempts || 0;
  } catch (error) {
    console.error("Redis error getting spam trap attempts:", error);
    return 0;
  }
};

/**
 * Track a spam trap attempt for an IP address
 * Returns the new attempt count and whether IP should be blocked
 */
export const trackSpamTrapAttempt = async (ip: string): Promise<{ attempts: number; shouldBlock: boolean }> => {
  if (!redis || ip === UNKNOWN_IP) {
    return { attempts: 0, shouldBlock: false };
  }

  try {
    const key = `spam-trap:attempts:${ip}`;
    const currentAttempts = await getSpamTrapAttempts(ip);
    const newAttempts = currentAttempts + 1;

    // Update attempts counter with expiry
    await redis.set(key, newAttempts, { ex: ATTEMPT_EXPIRY });

    // If threshold reached, block IP permanently
    if (newAttempts >= SPAM_TRAP_THRESHOLD) {
      await blockIp(ip);
      return { attempts: newAttempts, shouldBlock: true };
    }

    return { attempts: newAttempts, shouldBlock: false };
  } catch (error) {
    console.error("Redis error tracking spam trap attempt:", error);
    return { attempts: 0, shouldBlock: false };
  }
};

/**
 * Permanently block an IP address
 */
export const blockIp = async (ip: string): Promise<void> => {
  if (!redis || ip === UNKNOWN_IP) {
    return;
  }

  try {
    // Set permanent block (no expiration)
    await redis.set(`spam-trap:blocked:${ip}`, true);
    console.log(`IP ${ip} has been permanently blocked due to spam trap abuse`);
  } catch (error) {
    console.error("Redis error blocking IP:", error);
  }
};

/**
 * Lift a permanent block and clear the attempt counter for an IP address
 */
export const unblockIp = async (ip: string): Promise<boolean> => {
  if (!redis || !ip || ip === UNKNOWN_IP) {
    return false;
  }

  try {
    await redis.del(`spam-trap:blocked:${ip}`, `spam-trap:attempts:${ip}`);
    console.log(`IP ${ip} has been unblocked`);
    return true;
  } catch (error) {
    console.error("Redis error unblocking IP:", error);
    return false;
  }
};

export interface SpamTrapIpRecord {
  ip: string;
  blocked: boolean;
  attempts: number;
  /** Seconds until the attempt counter expires, or null when there is none */
  attemptsExpireIn: number | null;
}

/**
 * Read every IP currently tracked for spam trap abuse, blocked or not.
 *
 * Uses SCAN rather than KEYS so a large keyspace cannot stall Redis.
 */
export const listSpamTrapIps = async (): Promise<SpamTrapIpRecord[]> => {
  if (!redis) {
    return [];
  }

  try {
    const scanAll = async (match: string): Promise<string[]> => {
      const found: string[] = [];
      let cursor = "0";

      do {
        const [nextCursor, keys] = await redis.scan(cursor, {
          match,
          count: 500,
        });
        found.push(...keys);
        cursor = String(nextCursor);
      } while (cursor !== "0");

      return found;
    };

    const [blockedKeys, attemptKeys] = await Promise.all([
      scanAll("spam-trap:blocked:*"),
      scanAll("spam-trap:attempts:*"),
    ]);

    const blockedIps = new Set(
      blockedKeys.map((key) => key.replace("spam-trap:blocked:", ""))
    );
    const attemptIps = attemptKeys.map((key) =>
      key.replace("spam-trap:attempts:", "")
    );

    const allIps = Array.from(new Set([...blockedIps, ...attemptIps]));

    const records = await Promise.all(
      allIps.map(async (ip) => {
        const [attempts, ttl] = await Promise.all([
          getSpamTrapAttempts(ip),
          redis.ttl(`spam-trap:attempts:${ip}`),
        ]);

        return {
          ip,
          blocked: blockedIps.has(ip),
          attempts,
          attemptsExpireIn: ttl > 0 ? ttl : null,
        };
      })
    );

    // Blocked first, then by attempt count
    return records.sort((a, b) => {
      if (a.blocked !== b.blocked) {
        return a.blocked ? -1 : 1;
      }
      return b.attempts - a.attempts;
    });
  } catch (error) {
    console.error("Redis error listing spam trap IPs:", error);
    return [];
  }
};

/**
 * Expose the block threshold so the admin UI can explain the policy
 */
export const getSpamTrapThreshold = (): number => SPAM_TRAP_THRESHOLD;

/**
 * Validate an email address using ZeroBounce SDK
 * @param email - Email address to validate
 * @param ipAddress - Optional IP address for context
 * @returns Validation result with spam trap detection
 */
export const validateEmail = async (
  email: string,
  ipAddress?: string
): Promise<EmailValidationResult> => {
  // Check if API key is configured
  if (!ZEROBOUNCE_API_KEY) {
    console.warn("ZEROBOUNCE_API_KEY not configured, skipping validation");
    return {
      valid: true, // Allow signup if ZeroBounce is not configured
      status: "unknown",
      isSpamTrap: false,
      isDisposable: false,
      isInvalid: false,
      error: "ZeroBounce API key not configured",
    };
  }

  try {
    // Validate email with ZeroBounce
    const response = await zeroBounce.validateEmail(email, ipAddress || "");

    // Check response structure - ZeroBounce SDK returns different formats
    // Handle both direct response and nested data structure
    const data = (response as any).data || response;
    
    const status = data.status?.toLowerCase() || "";
    const subStatus = data.sub_status?.toLowerCase() || "";

    // Determine if it's a spam trap
    // ZeroBounce identifies spam traps with status "spam_trap" or sub_status containing "spam"
    const isSpamTrap = 
      status === "spam_trap" || 
      status === "spamtrap" ||
      subStatus.includes("spam_trap") ||
      subStatus.includes("spamtrap") ||
      data.sub_status === "spam_trap";

    // Check for disposable/temporary emails
    const isDisposable = 
      status === "disposable" ||
      subStatus.includes("disposable") ||
      data.free_email === false && status === "invalid"; // Some disposable emails marked as invalid

    // Check if email is invalid
    const isInvalid = 
      status === "invalid" ||
      status === "catch_all" ||
      status === "unknown";

    return {
      valid: !isSpamTrap && !isInvalid,
      status: status || "unknown",
      isSpamTrap,
      isDisposable,
      isInvalid,
      details: data,
    };
  } catch (error: any) {
    console.error("ZeroBounce validation error:", error);
    
    // On API error, allow signup but log the error
    // This prevents blocking legitimate users if ZeroBounce API is down
    return {
      valid: true,
      status: "error",
      isSpamTrap: false,
      isDisposable: false,
      isInvalid: false,
      error: error?.message || "Validation service unavailable",
    };
  }
};

/**
 * Validate email and check IP blocking status
 * This is the main function to use for signup validation
 */
export const validateEmailWithIpCheck = async (
  email: string,
  ipAddress: string
): Promise<{
  allowed: boolean;
  reason?: string;
  validationResult?: EmailValidationResult;
  attemptsRemaining?: number;
}> => {
  // First check if IP is blocked
  const blocked = await isIpBlocked(ipAddress);
  if (blocked) {
    return {
      allowed: false,
      reason: "Your IP address has been blocked due to repeated spam trap signup attempts.",
    };
  }

  // Validate email
  const validationResult = await validateEmail(email, ipAddress);

  // If spam trap detected, track the attempt
  if (validationResult.isSpamTrap) {
    const { attempts, shouldBlock } = await trackSpamTrapAttempt(ipAddress);
    
    if (shouldBlock) {
      return {
        allowed: false,
        reason: "Spam trap email detected. Your IP address has been blocked due to repeated violations.",
        validationResult,
        attemptsRemaining: 0,
      };
    }

    const attemptsRemaining = SPAM_TRAP_THRESHOLD - attempts;
    return {
      allowed: false,
      reason: `Spam trap email detected. ${attemptsRemaining} more attempt(s) will result in IP blocking.`,
      validationResult,
      attemptsRemaining,
    };
  }

  // If invalid email, reject but don't track as spam trap
  if (validationResult.isInvalid) {
    return {
      allowed: false,
      reason: "Invalid email address. Please check your email and try again.",
      validationResult,
    };
  }

  // Email is valid
  return {
    allowed: true,
    validationResult,
  };
};
