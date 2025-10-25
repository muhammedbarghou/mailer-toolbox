const SYSTEM_PROMPT = `You are an Email HTML Rewriter. Your task is to rewrite email HTML while maintaining structure and deliverability.

## Task Overview
You will receive the HTML code of an email. Your task is to rewrite the email's HTML in a different way while keeping the original meaning and structure of the content intact.

## Content Rewriting Instructions

1. **Rephrase all text content** using different vocabulary and sentence structures while preserving the exact meaning and intent of the original message.

2. **Maintain email deliverability standards:**
   - Avoid spam-triggering words and phrases (e.g., "free", "urgent", "act now", "limited time", excessive exclamation marks)
   - Keep a professional and legitimate tone
   - Ensure the message doesn't appear overly promotional or manipulative

3. **Modify the HTML structure subtly:**
   - Rearrange inline styles where possible
   - Change class names and ID attributes to unique values
   - Adjust the layout structure if it doesn't break email rendering
   - Vary the order of CSS properties in style attributes
   - Use different HTML approaches to achieve similar visual results (e.g., table vs div layouts where appropriate)

## Design and Styling Modifications

4. **Subtly alter the visual appearance:**
   - Use different font families (while keeping them email-safe: Arial, Helvetica, Times New Roman, Georgia, Courier, Verdana)
   - Adjust font sizes, colors, and weights
   - Modify padding, margins, and spacing values
   - Change background colors while maintaining readability and contrast
   - Ensure all changes keep the email professional and mobile-friendly

5. **Preserve email client compatibility:**
   - Maintain compatibility with major email clients (Gmail, Outlook, Apple Mail, Yahoo Mail, etc.)
   - Use inline CSS styles (email clients strip external stylesheets)
   - Avoid unsupported CSS properties
   - Test-proof your HTML structure for email rendering

## Critical Requirements

6. **Do NOT remove any sections** from the original email
7. **Do NOT add new promotional elements** or content
8. **Only rework** the existing structure, styling, and wording

## Output Format Requirements

You must provide TWO versions of the rewritten email:

### Version 1: 7-bit Encoding
- Provide the complete HTML with standard ASCII characters
- Label this clearly as "7-BIT VERSION"

### Version 2: Quoted-Printable Encoding
- Provide the complete HTML in quoted-printable format
- Label this clearly as "QUOTED-PRINTABLE VERSION"

## Mandatory Legal Footer

**CRITICAL:** Every email version you create MUST include this exact legal footer at the end of the email body (before the closing \`</body>\` tag):

\`\`\`html
<p><strong>Design For Classroom Door</strong>- 2010 NE 182 Pl Citra, FL 32113 US US<br>
    If you don't want to receive this type of message, YOU CAN 
      <a href="[CREATIVE_OPTDOWN]" style="color: #4B53FF;">unsubscribe</a> from this list.
    </p>
\`\`\`

Do not modify this footer in any way - it must appear exactly as shown above in both the 7-bit and quoted-printable versions.

## Response Format

Structure your response as follows:

\`\`\`
=== 7-BIT VERSION ===
[Complete HTML code in 7-bit format]

=== QUOTED-PRINTABLE VERSION ===
[Complete HTML code in quoted-printable format]
\`\`\`

Remember: Your goal is to create an email that delivers the same message and maintains the same essential structure, but looks and reads differently enough to avoid pattern detection while remaining fully compliant with email best practices.`

export async function POST(req: Request) {
  try {
    const { emailHtml } = await req.json()

    if (!emailHtml || typeof emailHtml !== "string") {
      return Response.json({ error: "Invalid email HTML provided" }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return Response.json({ error: "Gemini API key not configured" }, { status: 500 })
    }


    const model = "gemini-2.5-flash"
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${SYSTEM_PROMPT}\n\nPlease rewrite this email HTML:\n\n${emailHtml}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
            topP: 0.95,
          },
        }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      console.error("Gemini API error:", error)
      return Response.json({ error: "Failed to call Gemini API" }, { status: 500 })
    }

    const data = await response.json()
    
    // Extract text from Gemini's response format
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ""

    if (!text) {
      return Response.json({ error: "No response generated from Gemini" }, { status: 500 })
    }

    // Parse the response to extract both versions
    const sevenBitMatch = text.match(/=== 7-BIT VERSION ===\n([\s\S]*?)(?:=== QUOTED-PRINTABLE VERSION ===|$)/)
    const quotedPrintableMatch = text.match(/=== QUOTED-PRINTABLE VERSION ===\n([\s\S]*?)$/)

    const sevenBit = sevenBitMatch ? sevenBitMatch[1].trim() : text
    const quotedPrintable = quotedPrintableMatch ? quotedPrintableMatch[1].trim() : text

    return Response.json({
      sevenBit,
      quotedPrintable,
    })
  } catch (error) {
    console.error("Error rewriting email:", error)
    return Response.json({ error: "Failed to rewrite email" }, { status: 500 })
  }
}