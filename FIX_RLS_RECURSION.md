# Fix: Infinite Recursion in RLS Policies

## Problem
You're getting `Error: infinite recursion detected in policy for relation "gmail_accounts"`. This happens when RLS policies create circular dependencies.

## Solution

### Quick Fix

Run this SQL in your Supabase SQL Editor:

```sql
-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view their own gmail accounts" ON gmail_accounts;
DROP POLICY IF EXISTS "Users can view relevant permissions" ON gmail_account_permissions;

-- Recreate gmail_accounts SELECT policy without recursion
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

-- Recreate gmail_account_permissions SELECT policy without recursion
CREATE POLICY "Users can view relevant permissions"
  ON gmail_account_permissions FOR SELECT
  USING (
    viewer_user_id = auth.uid() OR
    gmail_account_id IN (
      SELECT id FROM gmail_accounts WHERE user_id = auth.uid()
    )
  );
```

### Or Use the Migration File

1. Go to Supabase SQL Editor
2. Copy and paste the contents of `supabase/migrations/20250101000001_fix_rls_recursion.sql`
3. Click **Run**

## What Was Wrong?

The original policies had a circular dependency:
- `gmail_accounts` SELECT policy checked `gmail_account_permissions`
- `gmail_account_permissions` SELECT policy checked `gmail_accounts`

This created infinite recursion when Supabase tried to evaluate the policies.

## The Fix

The new policies:
1. **gmail_accounts**: Still checks permissions, but permissions policy doesn't recursively check accounts
2. **gmail_account_permissions**: Uses a direct `IN` subquery instead of `EXISTS` with a join, which avoids recursion

## After Fixing

1. The error should be resolved
2. RLS policies will work correctly
3. Users can view their accounts and shared accounts
4. Permissions will be visible to owners and viewers

## Testing

After applying the fix, test by:
1. Connecting a Gmail account (should work)
2. Viewing accounts (should show owned + shared)
3. Managing permissions (should work)

