-- Gmail Deliverability Viewer - Database Migration
-- Creates tables for Gmail account management, permissions, and audit logging

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: gmail_accounts
-- Stores encrypted OAuth tokens for connected Gmail accounts
CREATE TABLE IF NOT EXISTS gmail_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  access_token TEXT NOT NULL, -- encrypted
  refresh_token TEXT NOT NULL, -- encrypted
  token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, email) -- One account per user per email
);

-- Table: gmail_account_permissions
-- Stores viewer permissions for shared inboxes
CREATE TABLE IF NOT EXISTS gmail_account_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gmail_account_id UUID NOT NULL REFERENCES gmail_accounts(id) ON DELETE CASCADE,
  viewer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(gmail_account_id, viewer_user_id) -- One permission per viewer per account
);

-- Table: gmail_audit_log
-- Audit trail for account actions (connect, disconnect, share, unshare, search)
CREATE TABLE IF NOT EXISTS gmail_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gmail_account_id UUID REFERENCES gmail_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'connect', 'disconnect', 'share', 'unshare', 'search'
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_gmail_accounts_user_id ON gmail_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_gmail_accounts_email ON gmail_accounts(email);
CREATE INDEX IF NOT EXISTS idx_gmail_account_permissions_account_id ON gmail_account_permissions(gmail_account_id);
CREATE INDEX IF NOT EXISTS idx_gmail_account_permissions_viewer_id ON gmail_account_permissions(viewer_user_id);
CREATE INDEX IF NOT EXISTS idx_gmail_audit_log_account_id ON gmail_audit_log(gmail_account_id);
CREATE INDEX IF NOT EXISTS idx_gmail_audit_log_user_id ON gmail_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_gmail_audit_log_action ON gmail_audit_log(action);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_gmail_accounts_updated_at
  BEFORE UPDATE ON gmail_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE gmail_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmail_account_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmail_audit_log ENABLE ROW LEVEL SECURITY;

-- gmail_accounts SELECT policy
-- Owners can see their accounts, viewers can see accounts shared with them
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

-- gmail_accounts INSERT policy (only authenticated users)
CREATE POLICY "Users can insert their own gmail accounts"
  ON gmail_accounts FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- gmail_accounts UPDATE policy (only owners)
CREATE POLICY "Users can update their own gmail accounts"
  ON gmail_accounts FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- gmail_accounts DELETE policy (only owners)
CREATE POLICY "Users can delete their own gmail accounts"
  ON gmail_accounts FOR DELETE
  USING (user_id = auth.uid());

-- gmail_account_permissions SELECT policy
-- Viewers can see permissions for accounts shared with them
-- Owners can see all permissions for their accounts
CREATE POLICY "Users can view relevant permissions"
  ON gmail_account_permissions FOR SELECT
  USING (
    viewer_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM gmail_accounts
      WHERE gmail_accounts.id = gmail_account_permissions.gmail_account_id
      AND gmail_accounts.user_id = auth.uid()
    )
  );

-- gmail_account_permissions INSERT policy (only owners can share)
CREATE POLICY "Owners can share their gmail accounts"
  ON gmail_account_permissions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM gmail_accounts
      WHERE gmail_accounts.id = gmail_account_permissions.gmail_account_id
      AND gmail_accounts.user_id = auth.uid()
    )
  );

-- gmail_account_permissions DELETE policy (only owners can unshare)
CREATE POLICY "Owners can unshare their gmail accounts"
  ON gmail_account_permissions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM gmail_accounts
      WHERE gmail_accounts.id = gmail_account_permissions.gmail_account_id
      AND gmail_accounts.user_id = auth.uid()
    )
  );

-- gmail_audit_log SELECT policy (users can see their own audit logs)
CREATE POLICY "Users can view their own audit logs"
  ON gmail_audit_log FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM gmail_accounts
      WHERE gmail_accounts.id = gmail_audit_log.gmail_account_id
      AND gmail_accounts.user_id = auth.uid()
    )
  );

-- gmail_audit_log INSERT policy (authenticated users can insert audit logs)
-- Note: Server-side will use service role for inserts
CREATE POLICY "Authenticated users can insert audit logs"
  ON gmail_audit_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

