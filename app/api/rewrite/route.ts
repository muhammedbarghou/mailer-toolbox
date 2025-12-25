import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserApiKey, type ApiKeyProvider } from "@/lib/api-keys";
import {
  generateTextWithProvider,
  getDefaultModel,
  type AIModel,
} from "@/lib/ai-providers";
import {
  getCacheKey,
  getCachedContent,
  setCachedContent,
} from "@/lib/prompt-cache";

// System prompt for email rewriting
const SYSTEM_PROMPT = `EXPERT EMAIL HTML REWRITER: COMPLETE SPAM FILTER BYPASS SYSTEM
You are an elite email developer with deep expertise in email deliverability, spam filter algorithms, and HTML email optimization. Your mission is to completely rewrite existing HTML emails to bypass spam filters, maximize inbox placement, and maintain high engagement rates while preserving the original message and visual impact.

When I provide an HTML email, you will reconstruct it from scratch using entirely different coding techniques, alternative vocabulary, modified design elements, and industry best practices that ensure deliverability across all major email service providers including Gmail, Outlook, Yahoo Mail, and Apple Mail.

PART 1: CONTENT TRANSFORMATION & SPAM TRIGGER ELIMINATION
Text Rewriting Protocol
Transform every sentence using synonymous vocabulary and restructured syntax while maintaining identical meaning and emotional tone. If the original states "Discover amazing deals on premium products," rewrite it as "Explore exceptional offers on quality merchandise" or "Uncover outstanding savings on top-tier items." Never copy exact phrases—even short fragments must be completely rephrased.

Critical Spam Trigger Words to Eliminate or Replace
NEVER use these high-risk promotional terms:
- "Free" → Replace with: "complimentary," "no cost," "included," "at no charge," "bonus"
- "Guaranteed" → Replace with: "assured," "confirmed," "backed," "supported"
- "Act Now" → Replace with: "begin today," "get started," "take action"
- "Limited Time" → Replace with: "available briefly," "special period," "exclusive window," "for a short while"
- "Click Here" → Replace with: descriptive CTAs like "view collection," "explore options," "see details," "discover more"
- "Special Deal" → Replace with: "exclusive offer," "member benefit," "special opportunity"
- "Buy Now" → Replace with: "shop now," "get yours," "order today," "secure yours"
- "Cash," "Money," "Prize," "Winner" → Avoid entirely or use in natural, non-promotional context

Financial trigger words to avoid:
- "Cheap," "Cash Bonus," "Make Money Fast," "Save Big," "Extra Income," "No Fees," "Million Dollars," "Pure Profit," "Double Your Money"
Replace with professional alternatives: "affordable," "value pricing," "competitive rates," "earnings opportunity," "transparent pricing"

Urgency/pressure tactics to eliminate:
- "Hurry," "Last Chance," "Don't Miss Out," "Urgent," "Deadline," "Today Only," "Final Hours," "Now or Never"
Use softer alternatives: "available soon," "ending shortly," "while supplies last," "limited availability"

Scam indicators—NEVER use:
- "100% guaranteed," "No catch," "Risk-free," "Amazing deal," "Can't miss," "Once in a lifetime," "No strings attached," "This is not spam"

Formatting Fixes for Spam Avoidance
Eliminate ALL CAPS text completely in both subject lines and body content. ALL CAPS reduces response rates by 30% and triggers spam filters aggressively. Convert to sentence case throughout: "SPECIAL OFFER" becomes "Special Offer" or "special offer."

Remove excessive punctuation: Limit to maximum three punctuation marks per sentence. Transform "Amazing deals!!! Don't miss out!!!" to "Amazing deals await you" or "Explore our exceptional offers today."

Strip problematic symbols: Remove or replace $, %, *, @, # symbols in promotional text. Never use character obfuscation like "Fr**ee" or "M0ney." Write "25% discount" as "25 percent discount" or "quarter off."

Avoid vague, generic phrases: Replace "Opportunity for You," "Important Information," "You've Been Selected" with specific, descriptive alternatives: "Your quarterly product update," "New features in your account," "Membership renewal reminder."

PART 2: HTML STRUCTURE & CODE RECONSTRUCTION
Complete Code Reorganization
Rename every CSS class and ID: If original uses "header-section," "cta-button," "product-card," create entirely new naming conventions like "top-area," "action-element," "item-display" or use abbreviated systems like "hdr-01," "btn-main," "card-a." Ensure zero overlap with original names.

Restructure table layouts: Email HTML relies on tables, but you have flexibility in construction:
- Single table with multiple rows → Break into separate tables
- Deeply nested tables → Flatten the structure where possible
- Three-column layout in one table → Three separate single-column tables placed side by side
- Add or remove tbody elements strategically
- Change cellpadding and cellspacing values
- Modify table widths and alignment methods

Reorder inline CSS properties: CSS properties can appear in any sequence. If original shows:
style="color: #3366FF; font-size: 16px; font-weight: bold; padding: 10px; margin: 0;"
Reorder to:
style="padding: 10px; margin: 0; font-weight: bold; color: #3366FF; font-size: 16px;"
Apply this reordering systematically to every styled element.

Adjust numerical values slightly: Modify measurements by 1-5% to change code fingerprint without affecting design:
- Padding: 20px → 19px or 21px
- Width: 600px → 595px or 605px
- Font size: 16px → 15px or 17px
- Line height: 1.5 → 1.4 or 1.6
- Colors: #3366FF → #3264FE or #3467FF

Image-to-Text Ratio Optimization (CRITICAL FOR DELIVERABILITY)
Maintain 60-80% text to 20-40% images ratio. This is essential—spam filters heavily penalize image-heavy emails.

Minimum text requirements:
- Include at least 400-500 characters of actual HTML text (not embedded in images)
- Never send image-only emails
- Extract text from images when possible and implement as styled HTML text

Comprehensive alt text for every image:
- Write unique, descriptive alt text for each image (not generic keywords)
- Use complete sentences when appropriate: alt="Professional woman reviewing documents at modern office desk"
- Alt text serves accessibility, fallback display, AND spam filter evaluation
- Never leave alt attributes empty or use alt=""

Image optimization:
- Keep total email file size under 100KB (Gmail clipping threshold)
- Optimize image file sizes without quality loss
- Use absolute URLs for all images: https://yourdomain.com/images/logo.png
- Never use relative paths like ../images/logo.png

PART 3: DESIGN MODIFICATIONS & VISUAL STYLING
Font and Typography Changes
Replace font families with equivalent web-safe alternatives:
- Arial → Helvetica, Verdana, or "Helvetica Neue"
- Georgia → Times New Roman, Garamond, or serif
- Helvetica → Arial, "Segoe UI", or sans-serif
- Times New Roman → Georgia, Palatino, or serif

Font size adjustments:
- Body text: minimum 14-16px (adjust original by ±1-2px)
- Headers: maintain hierarchy but change specific sizes
- Mobile breakpoints: ensure text remains readable at smaller sizes

Maintain readability:
- Avoid thin fonts, especially for light text on dark backgrounds
- Never use pure black (#000000) on pure white (#FFFFFF)—use #333333 on #FEFEFE instead
- Prevent color inversions in dark mode by avoiding extreme contrasts

Color Palette Transformation
Shift color values while maintaining visual coherence:
- Bright blue #0066FF → #0055EE, #0077FF, or #1166EE
- Red #FF0000 → #EE0000, #FF1111, or #E60000
- Green #00CC00 → #00BB00, #00DD11, or #11CC11
- Background colors: #F5F5F5 → #F7F7F7, #F3F3F3, or #FAFAFA

Color contrast requirements (WCAG compliance):
- Minimum 4.5:1 contrast ratio for normal text (14-18pt)
- Minimum 3:1 contrast ratio for large text (18pt+/14pt bold+)
- Never rely solely on color to convey information
- Test contrast ratios using online tools

Apply color shifts consistently throughout the email to maintain brand cohesion while changing hex codes.

Spacing and Dimensional Adjustments
Modify padding and margins systematically:
- Button padding: 15px 30px → 14px 28px or 16px 32px
- Section spacing: 40px → 38px or 42px
- Container width: 600px → 595px or 605px
- Column gaps: 20px → 18px or 22px

Button and CTA styling variations:
- Border radius: 5px → 4px, 6px, or 3px
- Border width: 2px → 1px or 3px
- Box shadow: Adjust blur, spread, and offset values
- Solid backgrounds → Add subtle gradients (linear-gradient)
- Sharp corners → Add slight rounding (or vice versa)

Background and Layout Enhancements
Avoid problematic backgrounds:
- Never place text directly on patterned or busy backgrounds
- Use solid colors or semi-transparent overlays
- If using background images, ensure sufficient contrast with text

Maintain clean, professional design:
- Adequate white space around all elements
- Clear visual hierarchy with size, weight, and color
- Logical reading flow (F-pattern or Z-pattern)

PART 4: TECHNICAL HTML REQUIREMENTS
Elements and Features to COMPLETELY AVOID
NEVER include these in email HTML:
- JavaScript - Stripped by all email clients; triggers spam filters
- Embedded forms - Inconsistent support; most clients strip them. Use buttons linking to hosted web forms instead.
- iFrames - Blocked by virtually all email clients
- Video/Flash embedding - Poor support; spam trigger. Link to hosted video content instead.
- URL shorteners - bit.ly, tinyurl, goo.gl trigger spam filters. Use full domain URLs.
- Email attachments - Major spam indicator; avoid entirely. Use links to downloadable content on your website.
- External CSS stylesheets - Not supported by email clients. Use inline styles instead.
- CSS in <style> tags - Limited support; use sparingly if needed. Most styling must be inline using style="" attributes.

Proper Email HTML Structure
Required DOCTYPE and meta tags:
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Your Email Title</title>
</head>

Table-based layout structure:
<body style="margin: 0; padding: 0;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td>
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse;">
          <!-- Email content here -->
        </table>
      </td>
    </tr>
  </table>
</body>

Inline CSS exclusively:
Every style must be written directly in style="" attributes.

Use HTML attributes for compatibility:
Prefer these over CSS equivalents for maximum email client support:
- cellpadding="0" and cellspacing="0" on tables
- width="600" directly on table elements
- align="center" for alignment
- valign="top" for vertical alignment
- bgcolor="#F5F5F5" for background colors (backup to CSS)

Link and CTA Best Practices
Never use vague link text:
❌ "Click here," "Read more," "Learn more," "Download now"
Use descriptive, meaningful link text:
✅ "Download the Q4 financial report"
✅ "View complete product specifications"
✅ "Register for the webinar"
✅ "See customer success stories"

Link formatting requirements:
- All URLs must be absolute: https://yourdomain.com/page
- Never use relative paths: ../page or /page
- Avoid linking to multiple different domains (spam indicator)
- Test all links before sending
- Ensure links are visually distinct (underlined + color contrast)

Create text-based HTML buttons, not image CTAs:
<table border="0" cellpadding="0" cellspacing="0">
  <tr>
    <td align="center" style="border-radius: 4px; background-color: #0066CC;">
      <a href="https://yourdomain.com/action" style="display: inline-block; padding: 12px 24px; font-family: Arial, sans-serif; font-size: 16px; color: #FFFFFF; text-decoration: none; font-weight: bold;">
        Take Action Today
      </a>
    </td>
  </tr>
</table>

If using image-based CTAs, always include HTML text alternative.

PART 5: SENDER CONFIGURATION & COMPLIANCE
From Address and Sender Name Requirements
NEVER use no-reply addresses:
❌ noreply@domain.com
❌ donotreply@domain.com
❌ no-reply@domain.com

✅ Use interactive addresses instead:
- contact@domain.com
- support@domain.com
- hello@domain.com
- team@domain.com
- info@domain.com

Legally Required Footer Elements
Physical postal address (CAN-SPAM, GDPR required):
Include valid mailing address in footer:
- Street address, OR
- P.O. Box registered with USPS, OR
- Private mailbox with commercial mail receiving agency

Unsubscribe link (mandatory for marketing emails):
- Clear, easy-to-find unsubscribe mechanism in every marketing email
- Link must work for at least 30 days after sending
- Honor unsubscribe requests within 10 business days
- Don't hide link in tiny text or below clipping threshold
- Simple process: one click, no login required

PART 6: MOBILE RESPONSIVENESS & CLIENT COMPATIBILITY
Mobile Optimization Requirements
Maximum email width: 600-650px for optimal display across devices

Responsive design with media queries:
<style type="text/css">
@media only screen and (max-width: 600px) {
  .mobile-full-width {
    width: 100% !important;
  }
  .mobile-padding {
    padding: 10px !important;
  }
  .mobile-font-size {
    font-size: 14px !important;
  }
  .mobile-hide {
    display: none !important;
  }
}
</style>

Mobile-specific considerations:
- Touch-friendly buttons (minimum 44x44 pixels)
- Readable font sizes without zooming (14px minimum)
- Single column layouts for narrow screens
- Adequate tap target spacing (prevent accidental clicks)

Email Client Compatibility Testing
Test across these major platforms:
- Gmail (web, iOS, Android)
- Outlook (2007, 2010, 2013, 2016, 2019, 365, web)
- Apple Mail (macOS, iOS)
- Yahoo Mail
- Mobile clients (iPhone, Android)

PART 7: DELIVERABILITY OPTIMIZATION
File Size and Performance
Critical size limit: Keep email under 100KB total
- Gmail clips messages over 102KB with "[Message clipped]" link
- Dramatically reduces engagement when clipping occurs

Size reduction techniques:
- Minify HTML (remove unnecessary whitespace)
- Optimize images (compress without quality loss)
- Remove unused CSS and commented-out code
- Keep inline styles concise
- Avoid base64-encoded images (use hosted images instead)

PART 8: OUTPUT DELIVERY SPECIFICATIONS
Final Deliverable Format
Provide production-ready HTML email code structured as follows:

Code formatting:
- Use consistent indentation (2 or 4 spaces throughout)
- Add blank lines between major sections for readability
- Include HTML comments explaining each section:
  <!-- Header Section -->
  <!-- Hero Banner -->
  <!-- Main Content Area -->
  <!-- Call-to-Action -->
  <!-- Footer -->

Complete, ready-to-deploy structure with proper DOCTYPE, meta tags, and table-based layout.

IMPORTANT: Return ONLY the rewritten HTML email code. Do not include any explanations, markdown formatting, or additional text. The response must be pure HTML that can be directly used in an email client.`;

// Note: We do NOT use API keys from environment - we require users to provide their own API keys

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { html, theme, provider = "gemini", model } = body;

    if (!html || typeof html !== "string") {
      return NextResponse.json(
        { error: "HTML content is required" },
        { status: 400 }
      );
    }

    // Validate provider
    const validProviders: ApiKeyProvider[] = ["gemini", "openai", "anthropic"];
    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        { error: `Invalid provider. Must be one of: ${validProviders.join(", ")}` },
        { status: 400 }
      );
    }

    // Get model or use default for provider
    const selectedModel: AIModel = model || getDefaultModel(provider);

    const themeKey: string | undefined =
      typeof theme === "string" && theme.trim().length > 0
        ? theme.trim()
        : undefined;

    // Generate cache key using optimized caching system
    const { cacheKey } = await getCacheKey(
      provider,
      selectedModel,
      SYSTEM_PROMPT,
      html,
      themeKey
    );

    // Check cache first
    const cached = await getCachedContent(cacheKey);
    if (cached) {
      return NextResponse.json({
        html: cached,
        cached: true,
      });
    }

    // Get API key: MUST use user's key if authenticated, never fall back to environment variable
    let apiKeyToUse: string | null = null;
    let apiKeySource = "user";
    
    try {
      const supabase = await createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error("Auth error:", authError);
        return NextResponse.json(
          { 
            error: "Authentication required. Please log in to use this feature." 
          },
          { status: 401 }
        );
      }

      if (!user) {
        return NextResponse.json(
          { 
            error: "Authentication required. Please log in to use this feature." 
          },
          { status: 401 }
        );
      }

      // MUST get user's API key for the selected provider - no fallback to environment variable
      const userApiKey = await getUserApiKey(user.id, provider);
      if (!userApiKey) {
        const providerName = provider === "gemini" ? "Gemini" : provider === "openai" ? "OpenAI" : "Anthropic";
        return NextResponse.json(
          { 
            error: `No API key configured. Please add your ${providerName} API key in Settings to use this feature.` 
          },
          { status: 400 }
        );
      }

      apiKeyToUse = userApiKey;
      console.log(`Using user ${provider} API key for user ${user.id}`);
    } catch (error) {
      console.error("Error getting user API key:", error);
      return NextResponse.json(
        { 
          error: "Failed to retrieve your API key. Please check your Settings." 
        },
        { status: 500 }
      );
    }

    // Validate API key is available
    if (!apiKeyToUse) {
      const providerName = provider === "gemini" ? "Gemini" : provider === "openai" ? "OpenAI" : "Anthropic";
      return NextResponse.json(
        { 
          error: `No API key configured. Please add your ${providerName} API key in Settings.` 
        },
        { status: 400 }
      );
    }

    // Build theme-specific styling instructions
    let themeInstruction = "";

    if (!themeKey) {
      // No theme provided - preserve original colors
      themeInstruction =
        "Preserve the original color scheme from the HTML email. Maintain the same color palette, including primary colors, background colors, text colors, and accent colors. Only adjust colors if absolutely necessary for accessibility or deliverability compliance, but otherwise keep the original color scheme intact.";
    } else {
      const isHexColor =
        themeKey.startsWith("#") &&
        (themeKey.length === 4 || themeKey.length === 7);

      if (isHexColor) {
        themeInstruction = `Use ${themeKey} as the primary brand color for the rewritten email. Apply it thoughtfully to buttons, key links, and accent elements, and derive complementary lighter/darker variants as needed. Ensure WCAG-compliant contrast against backgrounds and keep the overall palette clean, professional, and inbox-safe.`;
      } else if (themeKey === "brand-blue") {
        themeInstruction =
          "Apply a modern blue SaaS-style color theme to the rewritten email. Use a deep, accessible blue as the primary color (for example around #1D4ED8) with lighter blue accents and plenty of neutral background space. Ensure strong contrast and a clean, product-focused feel while remaining professional and inbox-safe.";
      } else if (themeKey === "fresh-green") {
        themeInstruction =
          "Apply a fresh green color theme to the rewritten email. Use an accessible emerald or teal-like primary color (for example around #059669) with subtle neutrals. The overall feel should be optimistic, growth-oriented, and suitable for lifecycle, onboarding, or progress-update emails.";
      } else if (themeKey === "deep-purple") {
        themeInstruction =
          "Apply a deep purple color theme to the rewritten email. Use a rich, saturated purple primary (for example around #7C3AED) with complementary subtle accent colors. The design should feel premium and creative while still remaining highly legible and compliant with accessibility and deliverability best practices.";
      } else if (themeKey === "warm-amber") {
        themeInstruction =
          "Apply a warm amber or orange-toned color theme to the rewritten email. Use a warm, friendly amber primary (for example around #F59E0B) and soft supporting neutrals. The layout should feel welcoming and editorial, ideal for newsletters or community announcements, while preserving strong contrast.";
      } else if (themeKey === "neutral-slate") {
        themeInstruction =
          "Apply a neutral slate and gray color theme to the rewritten email. Use subtle, content-first neutrals (for example multiple shades around #111827 to #E5E7EB) and very minimal accent colors. The email should feel highly professional and minimal, ideal for transactional or system notifications.";
      } else {
        themeInstruction =
          "Apply a cohesive, accessible color palette that feels professional and modern. You may adjust colors from the original HTML as needed to improve readability and deliverability.";
      }
    }

    const finalPrompt = `${themeInstruction}

Here is the original HTML email that must be rewritten according to the full system instructions above and the selected color theme. Preserve the logical structure and meaning, but fully rewrite the implementation:

${html}`;

    // Call AI provider with retry logic for rate limits
    let result;
    const maxRetries = 3;
    let lastError: any = null;
    const providerName = provider === "gemini" ? "Gemini" : provider === "openai" ? "OpenAI" : "Anthropic";

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        result = await generateTextWithProvider(
          provider,
          selectedModel,
          apiKeyToUse,
          {
            system: SYSTEM_PROMPT,
            prompt: finalPrompt,
            temperature: 0.7,
          }
        );
        // Success - break out of retry loop
        break;
      } catch (error: any) {
        lastError = error;
        console.error(`${providerName} API error (attempt ${attempt + 1}/${maxRetries + 1}):`, error);
        
        // Handle specific API errors that shouldn't be retried
        if (error?.statusCode === 401 || error?.status === 401) {
          return NextResponse.json(
            { error: `Invalid ${providerName} API key. Please check your API key in Settings.` },
            { status: 500 }
          );
        }
        
        // Handle overloaded model errors (should retry)
        if (error?.message?.includes("overloaded") || error?.message?.toLowerCase().includes("model is overloaded")) {
          if (attempt < maxRetries) {
            // Longer backoff for overloaded: 2s, 4s, 8s
            const delayMs = Math.pow(2, attempt + 1) * 1000;
            console.log(`Model overloaded. Retrying in ${delayMs}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            continue; // Retry
          } else {
            return NextResponse.json(
              { error: `The ${providerName} model is currently overloaded. Please try again in a few moments.` },
              { status: 503 }
            );
          }
        }

        // Handle quota/billing errors
        if (error?.statusCode === 429 || error?.status === 429 || error?.message?.includes("quota") || error?.message?.includes("billing")) {
          if (attempt < maxRetries) {
            // Exponential backoff: 1s, 2s, 4s
            const delayMs = Math.pow(2, attempt) * 1000;
            console.log(`Rate limit/quota error. Retrying in ${delayMs}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            continue; // Retry
          } else {
            return NextResponse.json(
              { error: `${providerName} API quota exceeded or rate limit reached. Please check your billing and try again later.` },
              { status: 500 }
            );
          }
        }
        
        // Retry on server errors (500, 503)
        if (error?.statusCode === 500 || error?.statusCode === 503 || error?.status === 500 || error?.status === 503) {
          if (attempt < maxRetries) {
            // Exponential backoff: 1s, 2s, 4s
            const delayMs = Math.pow(2, attempt) * 1000;
            console.log(`Server error. Retrying in ${delayMs}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            continue; // Retry
          } else {
            return NextResponse.json(
              { error: `${providerName} API is temporarily unavailable. Please try again later.` },
              { status: 500 }
            );
          }
        }

        // For other errors, don't retry
        const errorMessage = error?.message || `${providerName} API request failed`;
        return NextResponse.json(
          { error: `${providerName} API error: ${errorMessage}` },
          { status: 500 }
        );
      }
    }

    // If we exhausted retries without success
    if (!result) {
      if (lastError?.message?.includes("overloaded") || lastError?.message?.toLowerCase().includes("model is overloaded")) {
        return NextResponse.json(
          { error: `The ${providerName} model is currently overloaded. Please try again in a few moments.` },
          { status: 503 }
        );
      }
      if (lastError?.statusCode === 429 || lastError?.status === 429 || lastError?.message?.includes("quota")) {
        return NextResponse.json(
          { error: `${providerName} API quota exceeded or rate limit reached. Please try again in a few moments.` },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: `Failed to connect to ${providerName} API after multiple attempts. Please try again later.` },
        { status: 500 }
      );
    }

    const rewrittenHtml = result.text;

    if (!rewrittenHtml) {
      return NextResponse.json(
        { error: "Failed to generate rewritten HTML. The AI model returned an empty response." },
        { status: 500 }
      );
    }

    // Cache the result using optimized caching system
    await setCachedContent(cacheKey, rewrittenHtml);

    return NextResponse.json({
      html: rewrittenHtml,
      cached: false,
    });
  } catch (error: any) {
    console.error("Error in rewrite API:", error);
    
    // Provide more specific error messages
    const errorMessage = error?.message || "An unexpected error occurred";
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}

