# Supabase Authentication Setup Guide

This guide will help you set up Supabase authentication for the Mailer Toolbox application.

## Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com))
2. A Supabase project created

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in your project details:
   - Name: `mailer-toolbox` (or your preferred name)
   - Database Password: (save this securely)
   - Region: Choose the closest region to your users
4. Click "Create new project" and wait for it to be ready

## Step 2: Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. You'll need two values:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys" → "anon public")

## Step 3: Configure Environment Variables

1. Create a `.env.local` file in the root of your project (if it doesn't exist)
2. Add the following environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

Replace:
- `your_project_url_here` with your Project URL from Step 2
- `your_anon_key_here` with your anon public key from Step 2

**Example:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.example
```

## Step 4: Configure Supabase Authentication

1. In your Supabase dashboard, go to **Authentication** → **Providers**
2. Enable **Email** provider (it should be enabled by default)
3. Enable **Google** provider:
   - Click on **Google** in the providers list
   - Toggle **Enable Google provider**
   - You'll need to create OAuth credentials in Google Cloud Console:
     - Go to [Google Cloud Console](https://console.cloud.google.com/)
     - Create a new project or select an existing one
     - Enable Google+ API
     - Go to **Credentials** → **Create Credentials** → **OAuth client ID**
     - Choose **Web application**
     - Add authorized redirect URIs:
       - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
       - (Replace `YOUR_PROJECT_REF` with your Supabase project reference)
     - Copy the **Client ID** and **Client Secret**
     - Paste them into Supabase Google provider settings
   - Click **Save**
4. Configure redirect URLs:
   - Go to **Authentication** → **URL Configuration**
   - Add your site URL: `http://localhost:3000` (for development) or your production URL
   - Add redirect URLs:
     - `http://localhost:3000/auth/callback` (for development)
     - `https://yourdomain.com/auth/callback` (for production)
5. (Optional) Configure email templates under **Authentication** → **Email Templates**
6. (Optional) Set up email confirmation:
   - Go to **Authentication** → **Settings**
   - Under "Email Auth", you can configure:
     - Enable email confirmations (recommended for production)
     - Disable email confirmations (for development/testing)

## Step 5: Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000`
3. You should see a "Sign In" button in the navbar
4. Click "Sign In" and try creating an account
5. After signing in, you should see the tools section appear

## Step 6: Protect Individual Tool Pages (Optional)

If you want to protect individual tool pages (recommended), wrap each tool page component with the `ProtectedRoute` component.

**Example for `/app/rewrite/page.tsx`:**

```tsx
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"

// Your existing component
function RewritePageContent() {
  // ... your existing code
}

export default function RewritePage() {
  return (
    <ProtectedRoute>
      <RewritePageContent />
    </ProtectedRoute>
  )
}
```

Apply this pattern to all tool pages:
- `/app/rewrite/page.tsx`
- `/app/header-processor/page.tsx`
- `/app/eml-to-txt-converter/page.tsx`
- `/app/eml-text-extractor/page.tsx`
- `/app/html-to-img/page.tsx`
- `/app/ip-comparator/page.tsx`
- `/app/photo-editor/page.tsx`

## Features Implemented

✅ **Authentication System**
- Sign up with email and password
- Sign in with email and password
- Sign out functionality
- Session management

✅ **Protected Routes**
- Tools are hidden on the home page until signed in
- Individual tool pages can be protected with `ProtectedRoute` component
- User menu in navbar showing email and sign out option

✅ **User Experience**
- Loading states during authentication
- Error handling with toast notifications
- Smooth transitions between authenticated/unauthenticated states

## Troubleshooting

### "Invalid API key" error
- Double-check your `.env.local` file has the correct values
- Make sure the environment variables start with `NEXT_PUBLIC_`
- Restart your development server after adding environment variables

### "Email not confirmed" error
- Check your Supabase email settings
- For development, you can disable email confirmation in Supabase dashboard
- Check your spam folder for confirmation emails

### Authentication not working
- Verify your Supabase project is active
- Check the browser console for errors
- Ensure your `.env.local` file is in the root directory
- Make sure you've restarted the dev server after adding environment variables

## Production Deployment

When deploying to production (e.g., Vercel):

1. Add your environment variables in your hosting platform's dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. Make sure to enable email confirmations in production for security

3. Configure your site URL in Supabase:
   - Go to **Authentication** → **URL Configuration**
   - Add your production URL to "Site URL"
   - Add your production URL to "Redirect URLs"

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

