# Fix: redirect_uri_mismatch Error

## Problem
You're getting `Error 400: redirect_uri_mismatch` when trying to connect Gmail. This means the redirect URI in your Google Cloud Console doesn't match what the app is sending.

## Solution

### Step 1: Find Your Exact Redirect URI

The app uses this redirect URI:
- **If `GOOGLE_REDIRECT_URI` is set in `.env.local`**: Uses that value
- **Otherwise**: Uses `${your_domain}/api/gmail/callback`

**For local development**, it's typically:
```
http://localhost:3000/api/gmail/callback
```

**For production**, it would be:
```
https://yourdomain.com/api/gmail/callback
```

### Step 2: Check What Your App Is Using

1. Visit this URL in your browser (while your dev server is running):
   ```
   http://localhost:3000/api/gmail/debug-redirect
   ```

2. It will show you the exact redirect URI your app is using.

### Step 3: Add to Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Click on your **OAuth 2.0 Client ID**
5. Under **Authorized redirect URIs**, click **+ ADD URI**
6. Add the **exact** redirect URI (from Step 2):
   - For development: `http://localhost:3000/api/gmail/callback`
   - For production: `https://yourdomain.com/api/gmail/callback`
7. Click **SAVE**

### Step 4: Verify Environment Variable (Optional)

If you want to use a custom redirect URI, set it in `.env.local`:

```env
GOOGLE_REDIRECT_URI=http://localhost:3000/api/gmail/callback
```

**Important Notes:**
- The URI must match **exactly** (including `http://` vs `https://`, trailing slashes, etc.)
- For localhost, use `http://` (not `https://`)
- No trailing slash after `/callback`
- Case-sensitive

### Step 5: Try Again

1. Restart your dev server (if you changed `.env.local`)
2. Try connecting Gmail again
3. The error should be resolved!

## Common Mistakes

❌ **Wrong**: `http://localhost:3000/api/gmail/callback/` (trailing slash)
✅ **Correct**: `http://localhost:3000/api/gmail/callback`

❌ **Wrong**: `localhost:3000/api/gmail/callback` (missing protocol)
✅ **Correct**: `http://localhost:3000/api/gmail/callback`

❌ **Wrong**: `http://127.0.0.1:3000/api/gmail/callback` (different host)
✅ **Correct**: `http://localhost:3000/api/gmail/callback`

## Still Having Issues?

1. **Check the exact error**: Look at the error message - it might show what URI Google received
2. **Check your `.env.local`**: Make sure `GOOGLE_REDIRECT_URI` is set correctly (or remove it to use the default)
3. **Clear browser cache**: Sometimes cached OAuth state can cause issues
4. **Check Google Cloud Console**: Make sure you saved the changes after adding the URI

## Quick Test

After adding the redirect URI, you can test it by:
1. Going to `/gmail-deliverability`
2. Clicking "Connect Gmail Account"
3. You should be redirected to Google's consent screen (not see the error)

