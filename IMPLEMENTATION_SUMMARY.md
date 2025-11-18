# User Lookup by Email - Implementation Summary

## ✅ What Was Implemented

### 1. Database Functions
- **`get_user_by_email(email)`** - Looks up users by email address
- **`get_user_by_id(user_id)`** - Looks up users by ID (for displaying viewer info)
- Both functions use `SECURITY DEFINER` to access `auth.users` table
- Located in: `supabase/migrations/20250101000003_add_user_lookup_function.sql` and `20250101000004_add_user_lookup_by_id_function.sql`

### 2. Admin Client Library
- **`lib/supabase/admin.ts`** - New file
- `createAdminClient()` - Creates Supabase client with service role key
- `getUserByEmail()` - Looks up users by email using Admin API
- Includes pagination support for large user bases

### 3. Updated Permissions API
- **`app/api/gmail/permissions/route.ts`** - Updated POST endpoint
- Now accepts email address and looks up user
- Validates email format
- Prevents self-sharing
- Returns user info in response

### 4. Updated Permissions Library
- **`lib/gmail/permissions.ts`** - Updated `getAccountViewers()`
- Now displays actual user emails and names
- Uses RPC function first, falls back to admin client
- Shows proper user information instead of placeholders

### 5. Updated UI Component
- **`components/gmail/GmailPermissionsManager.tsx`** - Enhanced success message
- Shows the name/email of the added viewer

## 🔧 Setup Required

### 1. Run Database Migrations

Execute these SQL files in Supabase SQL Editor:
- `supabase/migrations/20250101000003_add_user_lookup_function.sql`
- `supabase/migrations/20250101000004_add_user_lookup_by_id_function.sql`

### 2. Add Environment Variable

Add to `.env.local` and Vercel:
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Get it from: Supabase Dashboard → Settings → API → service_role key

## 🎯 How It Works

### Adding a Viewer by Email

1. User enters email in permissions manager
2. Frontend sends POST to `/api/gmail/permissions` with `viewerEmail`
3. API validates email format
4. API calls `getUserByEmail()` which:
   - First tries database function (if available)
   - Falls back to Admin API with service role
5. If user found:
   - Checks user isn't sharing with themselves
   - Adds permission via `addViewerPermission()`
   - Creates audit log
   - Returns success with user info
6. Frontend refreshes viewer list

### Displaying Viewers

1. `getAccountViewers()` fetches permissions
2. For each permission, looks up user info:
   - First tries RPC function `get_user_by_id()`
   - Falls back to Admin API `getUserById()`
   - Last resort: returns placeholder
3. Returns list with actual emails and names

## 🔒 Security Features

- ✅ Service role key server-side only
- ✅ Email format validation
- ✅ Self-share prevention
- ✅ RLS policies still enforced
- ✅ Audit logging

## 📝 Error Handling

- **Invalid email format** → 400 error
- **User not found** → 404 error with helpful message
- **Self-share attempt** → 400 error
- **System errors** → 500 error with logging

## 🚀 Next Steps

1. Run the database migrations
2. Add `SUPABASE_SERVICE_ROLE_KEY` to environment variables
3. Test by adding a viewer with a registered email
4. Verify viewers display with correct names/emails

## 📚 Files Modified/Created

**New Files:**
- `lib/supabase/admin.ts`
- `supabase/migrations/20250101000003_add_user_lookup_function.sql`
- `supabase/migrations/20250101000004_add_user_lookup_by_id_function.sql`
- `USER_LOOKUP_SETUP.md`
- `IMPLEMENTATION_SUMMARY.md`

**Modified Files:**
- `app/api/gmail/permissions/route.ts`
- `lib/gmail/permissions.ts`
- `components/gmail/GmailPermissionsManager.tsx`

