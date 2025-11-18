# User Lookup by Email - Setup Guide

## ✅ Implementation Complete

User lookup by email has been implemented! You can now add viewers to Gmail accounts by entering their email address.

## 🚀 Setup Steps

### 1. Run Database Migrations

Run these SQL migrations in your Supabase SQL Editor:

1. **`supabase/migrations/20250101000003_add_user_lookup_function.sql`**
   - Creates `get_user_by_email()` function
   - Allows looking up users by email address

2. **`supabase/migrations/20250101000004_add_user_lookup_by_id_function.sql`**
   - Creates `get_user_by_id()` function
   - Allows looking up users by ID (for displaying viewer info)

### 2. Set Environment Variable

Add to your `.env.local` (and Vercel environment variables):

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**To get your service role key:**
1. Go to Supabase Dashboard
2. Settings → API
3. Copy the **service_role** key (NOT the anon key)
4. ⚠️ **Keep this secret!** Never expose it to the frontend.

### 3. How It Works

The implementation uses two approaches:

1. **Database Functions (Preferred)**
   - `get_user_by_email()` - Lookup by email
   - `get_user_by_id()` - Lookup by ID
   - Uses `SECURITY DEFINER` to access `auth.users` table
   - More efficient for large user bases

2. **Admin Client (Fallback)**
   - Uses Supabase Admin API with service role key
   - Lists users and searches by email
   - Used when database functions aren't available

### 4. Features

✅ **Email validation** - Validates email format before lookup  
✅ **User not found handling** - Clear error messages  
✅ **Self-share prevention** - Users can't share with themselves  
✅ **Case-insensitive lookup** - Works regardless of email case  
✅ **Audit logging** - Logs all share/unshare actions  

## 📝 Usage

### Adding a Viewer

1. Go to Gmail Deliverability page
2. Click "Manage Accounts" tab
3. Click "Manage Access" on an account
4. Enter the viewer's email address
5. Click "Add"

The system will:
- Validate the email format
- Look up the user in Supabase Auth
- Check if user exists
- Prevent self-sharing
- Add the permission
- Display the viewer in the list

### Error Messages

- **"Invalid email format"** - Email doesn't match standard format
- **"User not found"** - Email not registered in the system
- **"You cannot share an account with yourself"** - Attempted self-share
- **"Failed to look up user"** - System error (check logs)

## 🔒 Security

- Service role key is **server-side only**
- Email validation prevents injection
- RLS policies still enforce access control
- Audit logs track all permission changes

## 🐛 Troubleshooting

### "SUPABASE_SERVICE_ROLE_KEY is required"

**Solution:** Add the service role key to your environment variables.

### "User not found" but user exists

**Possible causes:**
1. User hasn't signed up yet (must be registered in Supabase Auth)
2. Email case mismatch (should be handled automatically)
3. Database functions not created (run migrations)

### Performance issues with large user bases

**Solution:** The current implementation lists users. For 1000+ users, consider:
- Using database functions (more efficient)
- Implementing user search with pagination
- Creating a users view/table that syncs with auth.users

## 📚 Files Created

- `lib/supabase/admin.ts` - Admin client and user lookup functions
- `supabase/migrations/20250101000003_add_user_lookup_function.sql` - Email lookup function
- `supabase/migrations/20250101000004_add_user_lookup_by_id_function.sql` - ID lookup function
- Updated `app/api/gmail/permissions/route.ts` - Uses user lookup
- Updated `lib/gmail/permissions.ts` - Displays user info

## ✅ Testing

After setup, test by:
1. Adding a viewer with a valid email (should work)
2. Adding a viewer with invalid email (should show error)
3. Adding a viewer that doesn't exist (should show "not found")
4. Trying to share with yourself (should be prevented)

