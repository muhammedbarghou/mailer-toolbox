import { NextRequest, NextResponse } from "next/server"
import { simpleParser, type AddressObject } from "mailparser"
import { createClient } from "@/lib/supabase/server"
import { logToolRun, logToolError } from "@/lib/analytics/usage-events"
import { checkRateLimit, rateLimitResponse } from "@/lib/security/rate-limit"

const TOOL_SLUG = "/eml-parse"

/**
 * Parsing is CPU and memory heavy, so the payload is capped. This comfortably
 * fits a normal .eml file including inline attachments.
 */
const MAX_EMAIL_CONTENT_LENGTH = 5_000_000

/**
 * The client calls this once per uploaded file, so the window is generous
 * enough for a bulk upload while still bounding a scripted flood.
 */
const RATE_LIMIT = { max: 200, windowSeconds: 300 }

/**
 * Recipient headers parse to either a single address group or one per header
 * occurrence, so both shapes are flattened to the same display string
 */
const addressText = (address: AddressObject | AddressObject[] | undefined): string => {
  if (!address) {
    return ""
  }

  return Array.isArray(address)
    ? address.map((entry) => entry.text).join(", ")
    : address.text
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required. Please sign in to parse email files." },
      { status: 401 },
    )
  }

  const userId = user.id

  const rateLimit = await checkRateLimit(`eml-parse:${userId}`, RATE_LIMIT)
  if (!rateLimit.allowed) {
    await logToolError({
      userId,
      toolSlug: TOOL_SLUG,
      durationMs: Date.now() - startedAt,
      errorCode: "rate_limited",
    })

    return rateLimitResponse(rateLimit)
  }

  try {
    const body = await request.json()
    const { emailContent } = body

    if (!emailContent || typeof emailContent !== "string") {
      await logToolError({
        userId,
        toolSlug: TOOL_SLUG,
        durationMs: Date.now() - startedAt,
        errorCode: "invalid_email_content",
      })

      return NextResponse.json({ error: "Invalid email content" }, { status: 400 })
    }

    if (emailContent.length > MAX_EMAIL_CONTENT_LENGTH) {
      await logToolError({
        userId,
        toolSlug: TOOL_SLUG,
        durationMs: Date.now() - startedAt,
        errorCode: "email_content_too_large",
      })

      return NextResponse.json(
        { error: "Email content is too large to parse." },
        { status: 413 },
      )
    }

    // Convert string to Buffer for mailparser (it can handle strings, but Buffer is more reliable)
    const emailBuffer = Buffer.from(emailContent, "utf-8")

    // Parse the email using mailparser
    const parsed = await simpleParser(emailBuffer)

    // Extract headers as a plain object
    const headers: Record<string, string> = {}
    if (parsed.headers) {
      parsed.headers.forEach((value, key) => {
        // Handle header values that might be arrays or objects
        if (Array.isArray(value)) {
          headers[key] = value.map((v) => (typeof v === "string" ? v : String(v))).join(", ")
        } else if (value && typeof value === "object") {
          headers[key] = String(value)
        } else {
          headers[key] = String(value || "")
        }
      })
    }

    // Format headers as RFC 2822 string for reconstruction
    const headerLines: string[] = []
    if (parsed.headers) {
      parsed.headers.forEach((value, key) => {
        // Format key with proper capitalization (Title-Case)
        const formattedKey = key
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join("-")

        // Handle header values
        let headerValue = ""
        if (Array.isArray(value)) {
          headerValue = value.map((v) => (typeof v === "string" ? v : String(v))).join(", ")
        } else if (value && typeof value === "object") {
          headerValue = String(value)
        } else {
          headerValue = String(value || "")
        }

        headerLines.push(`${formattedKey}: ${headerValue}`)
      })
    }
    const rawHeaders = headerLines.join("\n")

    await logToolRun({
      userId,
      toolSlug: TOOL_SLUG,
      durationMs: Date.now() - startedAt,
      metadata: {
        inputLength: emailContent.length,
        headerCount: headerLines.length,
        hasHtml: Boolean(parsed.html),
      },
    })

    // Return structured data
    return NextResponse.json({
      text: parsed.text || "",
      html: parsed.html || "",
      headers,
      rawHeaders, // RFC 2822 formatted headers string for reconstruction
      subject: parsed.subject || "",
      from: parsed.from?.text || "",
      to: addressText(parsed.to),
      date: parsed.date?.toISOString() || "",
    })
  } catch (error) {
    console.error("Error parsing email:", error)

    await logToolError({
      userId,
      toolSlug: TOOL_SLUG,
      durationMs: Date.now() - startedAt,
      errorCode: "parse_failed",
    })

    return NextResponse.json({ error: "Failed to parse email" }, { status: 500 })
  }
}
