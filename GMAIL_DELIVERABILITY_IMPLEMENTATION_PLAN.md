# Gmail Deliverability Viewer - Implementation Plan

**Based on:** `Gmail Deliverability Viewer.mdc`  
**Date:** Implementation Planning Phase  
**Status:** Ready for Implementation

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Implementation Phases](#implementation-phases)
3. [Phase 1: Database Setup](#phase-1-database-setup)
4. [Phase 2: Core Infrastructure](#phase-2-core-infrastructure)
5. [Phase 3: OAuth Flow](#phase-3-oauth-flow)
6. [Phase 4: Gmail API Integration](#phase-4-gmail-api-integration)
7. [Phase 5: Frontend Components](#phase-5-frontend-components)
8. [Phase 6: Security & Testing](#phase-6-security--testing)
9. [Dependencies](#dependencies)
10. [Environment Variables](#environment-variables)
11. [File Structure](#file-structure)

---

## Overview

This plan implements a **read-only Gmail metadata viewer** that allows:
- Inbox owners to connect Gmail accounts via OAuth2
- Owners to share inbox access with colleagues
- Viewers to search emails by subject/from and filter by labels
- Display metadata: From, Subject, Snippet, Labels, Date, Sending IP, Sending Domain
- **Never store email bodies** - privacy-first approach

---

## Implementation Phases

### Phase 1: Database Setup ⚙️
**Estimated Time:** 1-2 hours

### Phase 2: Core Infrastructure 🔧
**Estimated Time:** 2-3 hours

### Phase 3: OAuth Flow 🔐
**Estimated Time:** 3-4 hours

### Phase 4: Gmail API Integration 📧
**Estimated Time:** 4-5 hours

### Phase 5: Frontend Components 🎨
**Estimated Time:** 5-6 hours

### Phase 6: Security & Testing 🛡️
**Estimated Time:** 2-3 hours

**Total Estimated Time:** 17-23 hours

---

## Phase 1: Database Setup

### 1.1 Create Supabase Migration

**File:** `supabase/migrations/YYYYMMDDHHMMSS_create_gmail_deliverability_tables.sql`

**Tables to create:**
1. `gmail_accounts` - Stores encrypted OAuth tokens
2. `gmail_account_permissions` - Stores viewer permissions
3. `gmail_audit_log` (optional) - Audit trail for permission changes

**Migration SQL:**

```sql
-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: gmail_accounts
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
CREATE TABLE IF NOT EXISTS gmail_account_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gmail_account_id UUID NOT NULL REFERENCES gmail_accounts(id) ON DELETE CASCADE,
  viewer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(gmail_account_id, viewer_user_id) -- One permission per viewer per account
);

-- Optional: Audit log table
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

-- gmail_audit_log INSERT policy (system can insert audit logs)
-- Note: This will be handled server-side with service role
-- For now, allow authenticated users to insert (will be restricted server-side)
CREATE POLICY "Authenticated users can insert audit logs"
  ON gmail_audit_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
```

### 1.2 Verify Migration

- Run migration in Supabase SQL Editor
- Verify tables created
- Test RLS policies with test user

---

## Phase 2: Core Infrastructure

### 2.1 Extend Encryption Library

**File:** `lib/encryption.ts` (extend existing)

Add functions for Gmail token encryption (reuse existing encryption functions):

```typescript
// Reuse existing encryptApiKey and decryptApiKey functions
// They can be used for Gmail tokens as well
// Or create aliases:
export const encryptGmailToken = encryptApiKey;
export const decryptGmailToken = decryptApiKey;
```

### 2.2 Create Gmail Token Management Library

**File:** `lib/gmail/tokens.ts`

**Functions:**
- `storeGmailTokens(userId, email, accessToken, refreshToken, expiresAt)`
- `getGmailTokens(accountId)` - returns decrypted tokens (server-side only)
- `refreshGmailToken(accountId)` - refresh expired token
- `revokeGmailToken(accountId)` - revoke and delete tokens

### 2.3 Create Gmail Permissions Library

**File:** `lib/gmail/permissions.ts`

**Functions:**
- `getGmailAccountsForUser(userId)` - get accounts user owns or can view
- `addViewerPermission(accountId, viewerUserId)`
- `removeViewerPermission(accountId, viewerUserId)`
- `checkViewerPermission(accountId, viewerUserId)` - verify access

### 2.4 Create Gmail API Client Wrapper

**File:** `lib/gmail/client.ts`

**Functions:**
- `createGmailClient(accessToken)` - create authenticated Gmail API client
- `searchMessages(client, query, label, maxResults)` - search messages
- `getMessageMetadata(client, messageId)` - get metadata only
- `parseSendingIp(headers)` - extract IP from Received headers
- `parseSendingDomain(headers)` - extract domain from DKIM/Return-Path/From

---

## Phase 3: OAuth Flow

### 3.1 Google Cloud Console Setup

**Required Steps:**
1. Create/select Google Cloud Project
2. Enable Gmail API
3. Create OAuth 2.0 Client ID (Web application)
4. Configure authorized redirect URIs:
   - `http://localhost:3000/api/gmail/callback` (dev)
   - `https://yourdomain.com/api/gmail/callback` (prod)
5. Note Client ID and Client Secret

### 3.2 Create OAuth Helper Library

**File:** `lib/gmail/oauth.ts`

**Functions:**
- `generateAuthUrl(state)` - generate OAuth authorization URL
- `exchangeCodeForTokens(code)` - exchange authorization code for tokens
- `revokeToken(token)` - revoke access token

### 3.3 Create API Routes

#### 3.3.1 GET `/api/gmail/auth-url`

**File:** `app/api/gmail/auth-url/route.ts`

**Purpose:** Generate OAuth authorization URL

**Flow:**
1. Authenticate user (Supabase session)
2. Generate state token (CSRF protection)
3. Generate Google OAuth URL with `gmail.readonly` scope
4. Return URL to frontend

#### 3.3.2 GET `/api/gmail/callback`

**File:** `app/api/gmail/callback/route.ts`

**Purpose:** Handle OAuth callback

**Flow:**
1. Validate state token (CSRF check)
2. Exchange code for tokens
3. Get user email from Gmail API
4. Encrypt and store tokens in `gmail_accounts`
5. Create audit log entry
6. Redirect to success page

#### 3.3.3 POST `/api/gmail/disconnect`

**File:** `app/api/gmail/disconnect/route.ts`

**Purpose:** Disconnect Gmail account

**Flow:**
1. Authenticate user
2. Verify ownership of account
3. Revoke token via Google API
4. Delete from database
5. Create audit log entry

---

## Phase 4: Gmail API Integration

### 4.1 Create Search API Route

**File:** `app/api/gmail/search/route.ts`

**Purpose:** Search Gmail messages (metadata only)

**Flow:**
1. Authenticate viewer
2. Verify viewer has permission for account
3. Get decrypted tokens (server-side)
4. Refresh token if expired
5. Create Gmail API client
6. Call `messages.list` with query
7. For each message ID, call `messages.get` with `format=metadata`
8. Parse headers (IP, domain)
9. Return compact result set
10. Implement rate limiting and caching

**Request Body:**
```typescript
{
  accountId: string;
  query?: string; // Gmail search query (subject:, from:, etc.)
  label?: string; // PRIMARY, PROMOTIONS, SPAM, SOCIAL
  maxResults?: number; // default 25
  pageToken?: string; // for pagination
}
```

**Response:**
```typescript
{
  messages: Array<{
    id: string;
    subject: string;
    from: string;
    snippet: string;
    labels: string[];
    date: string; // ISO timestamp
    sendingIp?: string;
    sendingDomain?: string;
  }>;
  nextPageToken?: string;
}
```

### 4.2 Create Token Refresh Route

**File:** `app/api/gmail/refresh/route.ts`

**Purpose:** Proactively refresh tokens (can be called by cron)

**Flow:**
1. Find tokens expiring soon (within 1 hour)
2. Refresh each token
3. Update database
4. Handle errors gracefully

### 4.3 Header Parsing Utilities

**File:** `lib/gmail/headers.ts`

**Functions:**
- `extractSendingIp(receivedHeaders)` - parse first external Received header
- `extractSendingDomain(headers)` - parse from DKIM d=, Return-Path, or From
- `isInternalHop(hostname)` - check if hostname is internal (google.com, etc.)

---

## Phase 5: Frontend Components

### 5.1 Gmail Dashboard Page

**File:** `app/(home)/gmail-deliverability/page.tsx`

**Features:**
- List connected Gmail accounts (for owners)
- List shared inboxes (for viewers)
- "Connect Gmail" button
- Inbox selector
- Search interface
- Results display

### 5.2 Gmail Account Management Component

**File:** `components/gmail/GmailAccountManager.tsx`

**Features:**
- Display connected accounts
- Connect new account button
- Disconnect account
- Manage permissions (add/remove viewers)

### 5.3 Gmail Search Component

**File:** `components/gmail/GmailSearch.tsx`

**Features:**
- Inbox selector dropdown
- Search input (with subject:/from: syntax hints)
- Label filter (Primary/Promotions/Spam/Social)
- Time range filter
- Search button
- Loading state
- Results display

### 5.4 Gmail Results Component

**File:** `components/gmail/GmailResults.tsx`

**Features:**
- Card-based results display
- Each card shows:
  - From (with avatar if available)
  - Subject (highlight matching terms)
  - Snippet (first two lines)
  - Label badge (color-coded)
  - Timestamp
  - Sending IP and Domain (muted, expandable)
- Expandable details modal
- Pagination

### 5.5 Gmail Permissions Manager

**File:** `components/gmail/GmailPermissionsManager.tsx`

**Features:**
- List of viewers for an account
- Add viewer (autocomplete by email)
- Remove viewer
- Audit log display

### 5.6 Update Navigation

**File:** `components/Layouts/app-sidebar.tsx`

Add "Gmail Deliverability" link to sidebar navigation.

---

## Phase 6: Security & Testing

### 6.1 Security Checklist

- [ ] Tokens encrypted at rest
- [ ] Tokens never exposed to frontend
- [ ] RLS policies tested
- [ ] CSRF protection in OAuth flow
- [ ] Rate limiting implemented
- [ ] Error handling (no token leakage in errors)
- [ ] Input validation on all API routes
- [ ] Permission checks on all operations

### 6.2 Testing Checklist

- [ ] OAuth flow end-to-end
- [ ] Token refresh on expiry
- [ ] Permission sharing/unsharing
- [ ] Search functionality
- [ ] Header parsing accuracy
- [ ] Rate limit handling
- [ ] Error scenarios (expired tokens, revoked access, etc.)

### 6.3 Error Handling

**Common Errors to Handle:**
- Token expired → auto-refresh
- Token revoked → notify user, remove account
- Rate limit exceeded → show message, retry with backoff
- Permission denied → 403 response
- Invalid account → 404 response
- Gmail API errors → log, return user-friendly message

---

## Dependencies

### New Packages to Install

```bash
npm install googleapis
npm install --save-dev @types/googleapis
```

**Package:** `googleapis` - Official Google APIs Node.js client

### Existing Packages (Already Installed)

- `@supabase/ssr` - Supabase client
- `@supabase/supabase-js` - Supabase types
- `next` - Next.js framework
- `crypto` - Node.js built-in (for encryption)

---

## Environment Variables

Add to `.env.local`:

```env
# Google OAuth (Gmail API)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/gmail/callback

# Encryption (reuse existing or create new)
GMAIL_TOKEN_ENCRYPTION_SECRET=your_encryption_secret_here
# OR reuse:
API_KEY_ENCRYPTION_SECRET=your_existing_secret_here

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key # For server-side token access
```

**Production:**
- Update `GOOGLE_REDIRECT_URI` to production URL
- Use strong encryption secrets
- Store service role key securely

---

## File Structure

```
mailer-toolbox/
├── app/
│   ├── api/
│   │   └── gmail/
│   │       ├── auth-url/
│   │       │   └── route.ts
│   │       ├── callback/
│   │       │   └── route.ts
│   │       ├── search/
│   │       │   └── route.ts
│   │       ├── refresh/
│   │       │   └── route.ts
│   │       └── disconnect/
│   │           └── route.ts
│   └── (home)/
│       └── gmail-deliverability/
│           └── page.tsx
├── components/
│   └── gmail/
│       ├── GmailAccountManager.tsx
│       ├── GmailSearch.tsx
│       ├── GmailResults.tsx
│       └── GmailPermissionsManager.tsx
├── lib/
│   ├── encryption.ts (extend existing)
│   └── gmail/
│       ├── tokens.ts
│       ├── permissions.ts
│       ├── client.ts
│       ├── oauth.ts
│       └── headers.ts
└── supabase/
    └── migrations/
        └── YYYYMMDDHHMMSS_create_gmail_deliverability_tables.sql
```

---

## Implementation Order

1. **Phase 1** - Database setup (migration + RLS)
2. **Phase 2** - Core libraries (tokens, permissions, client)
3. **Phase 3** - OAuth flow (auth-url, callback, disconnect)
4. **Phase 4** - Search API (search route, header parsing)
5. **Phase 5** - Frontend (dashboard, components)
6. **Phase 6** - Security hardening & testing

---

## Next Steps

1. Review and approve this plan
2. Set up Google Cloud Console project
3. Create database migration
4. Begin Phase 1 implementation
5. Test each phase before moving to next

---

## Notes

- **Privacy First:** Never store email bodies, only metadata
- **Token Security:** Tokens encrypted, server-side only access
- **Rate Limiting:** Implement caching and throttling
- **Error Handling:** User-friendly messages, no token leakage
- **RLS Policies:** Critical for security, test thoroughly
- **Google Verification:** May be required for `gmail.readonly` scope

---

**End of Implementation Plan**

