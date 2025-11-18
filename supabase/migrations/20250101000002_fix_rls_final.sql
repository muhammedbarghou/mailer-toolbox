-- Final fix for RLS recursion
-- The issue is that checking account ownership in permissions policy
-- causes recursion when accounts policy checks permissions

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own gmail accounts" ON gmail_accounts;
DROP POLICY IF EXISTS "Users can view relevant permissions" ON gmail_account_permissions;

-- Solution: Use a simpler approach
-- 1. Accounts policy: Check permissions directly (this is safe)
-- 2. Permissions policy: Only check viewer_user_id (no account check needed for SELECT)

-- Recreate gmail_accounts SELECT policy
-- This is safe because it only reads from permissions table
CREATE POLICY "Users can view their own gmail accounts"
  ON gmail_accounts FOR SELECT
  USING (
    -- Owners can always see their accounts
    user_id = auth.uid() OR
    -- Viewers can see accounts if they have a permission
    -- This is safe - no recursion because permissions policy doesn't check accounts
    EXISTS (
      SELECT 1 FROM gmail_account_permissions
      WHERE gmail_account_permissions.gmail_account_id = gmail_accounts.id
      AND gmail_account_permissions.viewer_user_id = auth.uid()
    )
  );

-- Recreate gmail_account_permissions SELECT policy
-- Simplified: Only check if user is the viewer
-- Owners can see permissions through the accounts they own (which they can query)
-- This breaks the circular dependency
CREATE POLICY "Users can view relevant permissions"
  ON gmail_account_permissions FOR SELECT
  USING (
    -- Viewers can see permissions where they are the viewer
    viewer_user_id = auth.uid()
    -- Owners don't need a separate check here because:
    -- - They can query accounts they own (user_id = auth.uid())
    -- - They can then query permissions for those accounts
    -- - This avoids the circular dependency
  );

-- Note: For owners to see all permissions for their accounts,
-- the application can query: 
-- SELECT * FROM gmail_account_permissions 
-- WHERE gmail_account_id IN (SELECT id FROM gmail_accounts WHERE user_id = auth.uid())
-- This works because the accounts query doesn't trigger permissions RLS recursion

