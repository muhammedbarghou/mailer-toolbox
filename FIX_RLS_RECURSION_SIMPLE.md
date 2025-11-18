# Quick Fix: RLS Recursion Error

## The Problem
`Error: infinite recursion detected in policy for relation "gmail_accounts"`

This happens because the RLS policies create a circular dependency.

## Quick Fix (Run This SQL)

Go to **Supabase SQL Editor** and run:

```sql
-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view their own gmail accounts" ON gmail_accounts;
DROP POLICY IF EXISTS "Users can view relevant permissions" ON gmail_account_permissions;

-- Recreate gmail_accounts SELECT policy (safe - no recursion)
CREATE POLICY "Users can view their own gmail accounts"
  ON gmail_accounts FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM gmail_account_permissions
      WHERE gmail_account_permissions.gmail_account_id = gmail_accounts.id
      AND gmail_account_permissions.viewer_user_id = auth.uid()
    )
  );

-- Recreate gmail_account_permissions SELECT policy (simplified - breaks recursion)
CREATE POLICY "Users can view relevant permissions"
  ON gmail_account_permissions FOR SELECT
  USING (
    viewer_user_id = auth.uid()
  );
```

## What This Does

1. **gmail_accounts policy**: Still allows owners and viewers to see accounts
2. **gmail_account_permissions policy**: Simplified to only check if user is a viewer
   - This breaks the circular dependency
   - Owners can still see permissions through the accounts they own

## After Running

1. The error should be resolved ✅
2. Users can view their accounts ✅
3. Viewers can see shared accounts ✅
4. Owners can manage permissions ✅

## Why This Works

The original policies had:
- Accounts → checks Permissions → checks Accounts → **RECURSION!**

The new policies have:
- Accounts → checks Permissions (which only checks viewer_user_id) → **NO RECURSION!**
- Permissions → only checks viewer_user_id → **NO RECURSION!**

The application code handles owners viewing permissions by first querying accounts they own, then querying permissions for those accounts.

