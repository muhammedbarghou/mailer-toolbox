# Email Templates for Mailer Toolbox

This directory contains email templates for Supabase authentication emails.

## Files

- `confirmation-email.html` - HTML email template for email confirmation
- `confirmation-email-plain.txt` - Plain text version for email clients that don't support HTML

## How to Use in Supabase

### Option 1: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Email Templates**
3. Select **Confirm signup** template
4. Copy the content from `confirmation-email.html`
5. Paste it into the HTML editor
6. Save the template

### Option 2: Using Supabase CLI

You can also configure email templates via the Supabase CLI or API.

## Template Variables

The template uses the following Supabase variables:

- `{{ .ConfirmationURL }}` - The confirmation link URL that users need to click

## Customization

### Logo

To add your logo to the email:

1. Host your logo image (e.g., on your website or CDN)
2. Replace the logo placeholder in the HTML template:
   ```html
   <img src="https://yourdomain.com/Logo.svg" alt="Mailer Toolbox" style="width: 48px; height: 48px;">
   ```

### Colors

The template uses the app's brand colors:
- Primary gradient: Blue (#2563eb) → Cyan (#06b6d4) → Teal (#14b8a6)
- Text colors: Dark gray (#1f2937) for headings, Medium gray (#6b7280) for body text

### Font

The template uses Ubuntu font (matching the app) with fallbacks for email clients.

## Email Client Compatibility

This template is designed to work with:
- ✅ Gmail
- ✅ Outlook (desktop and web)
- ✅ Apple Mail
- ✅ Yahoo Mail
- ✅ Most modern email clients

The template uses:
- Inline CSS (required for email clients)
- Table-based layout (best compatibility)
- Web-safe fonts with fallbacks
- Responsive design principles

## Testing

Before deploying:

1. Test the template in multiple email clients
2. Verify the confirmation link works correctly
3. Check mobile responsiveness
4. Test with different email providers (Gmail, Outlook, etc.)

## Notes

- The template uses inline styles for maximum email client compatibility
- Tables are used for layout instead of modern CSS Grid/Flexbox
- All colors are specified in hex format for better compatibility
- The template includes both HTML and plain text versions

