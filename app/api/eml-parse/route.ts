import { NextRequest, NextResponse } from "next/server"
import { simpleParser } from "mailparser"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { emailContent } = body

    if (!emailContent || typeof emailContent !== "string") {
      return NextResponse.json({ error: "Invalid email content" }, { status: 400 })
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

    // Return structured data
    return NextResponse.json({
      text: parsed.text || "",
      html: parsed.html || "",
      headers,
      rawHeaders, // RFC 2822 formatted headers string for reconstruction
      subject: parsed.subject || "",
      from: parsed.from?.text || "",
      to: parsed.to?.text || "",
      date: parsed.date?.toISOString() || "",
    })
  } catch (error) {
    console.error("Error parsing email:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to parse email" },
      { status: 500 },
    )
  }
}

