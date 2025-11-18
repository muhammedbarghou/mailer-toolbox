# Gmail Deliverability Viewer - Quick Reference

## 🎯 Core Concept

**Read-only Gmail metadata viewer** - No email bodies stored, only metadata for deliverability analysis.

## 📊 Data Flow

```
User → OAuth → Google → Tokens (encrypted) → Supabase
                                    ↓
                            Gmail API (metadata only)
                                    ↓
                    Parse Headers (IP, Domain) → Return to Viewer
```

## 🔐 Security Principles

1. **Tokens encrypted at rest** (AES-256-GCM)
2. **Tokens never exposed to frontend** (server-side only)
3. **RLS policies** enforce access control
4. **CSRF protection** in OAuth flow
5. **No email bodies** stored or returned

## 📋 Required Tables

1. `gmail_accounts` - Encrypted OAuth tokens
2. `gmail_account_permissions` - Viewer access control
3. `gmail_audit_log` - Audit trail (optional)

## 🔌 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/gmail/auth-url` | GET | Generate OAuth URL |
| `/api/gmail/callback` | GET | Handle OAuth callback |
| `/api/gmail/search` | POST | Search messages (metadata) |
| `/api/gmail/refresh` | POST | Refresh tokens |
| `/api/gmail/disconnect` | POST | Disconnect account |

## 📦 Required Packages

```bash
npm install googleapis
```

## 🔑 Environment Variables

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=...
GMAIL_TOKEN_ENCRYPTION_SECRET=... # or reuse API_KEY_ENCRYPTION_SECRET
SUPABASE_SERVICE_ROLE_KEY=... # for server-side token access
```

## 📁 Key Files to Create

### Backend
- `lib/gmail/tokens.ts` - Token management
- `lib/gmail/permissions.ts` - Permission management
- `lib/gmail/client.ts` - Gmail API wrapper
- `lib/gmail/oauth.ts` - OAuth helpers
- `lib/gmail/headers.ts` - Header parsing
- `app/api/gmail/*/route.ts` - API routes

### Frontend
- `app/(home)/gmail-deliverability/page.tsx` - Main dashboard
- `components/gmail/GmailAccountManager.tsx` - Account management
- `components/gmail/GmailSearch.tsx` - Search interface
- `components/gmail/GmailResults.tsx` - Results display
- `components/gmail/GmailPermissionsManager.tsx` - Permissions UI

## 🎨 UI Components Needed

1. **Dashboard** - List accounts, connect button
2. **Search Interface** - Query input, label filters
3. **Results Cards** - Subject, from, snippet, labels, IP, domain
4. **Permissions Panel** - Add/remove viewers

## 🔍 Gmail API Usage

**Scopes:** `https://www.googleapis.com/auth/gmail.readonly`

**Key Methods:**
- `messages.list()` - Search messages
- `messages.get(format='metadata')` - Get metadata only

**Metadata Headers to Request:**
- `From`, `Subject`, `Received`, `Return-Path`, `DKIM-Signature`, `Authentication-Results`

## 📝 Returned Fields (Strict)

- `id` - Message ID
- `subject` - Email subject
- `from` - Sender email
- `snippet` - Preview text (~100 chars)
- `labels` - Gmail labels (PRIMARY, SPAM, etc.)
- `date` - Timestamp
- `sendingIp` - Parsed from Received header
- `sendingDomain` - Parsed from DKIM/Return-Path/From

## ⚠️ Important Notes

- **Never store email bodies**
- **Tokens must be server-side only**
- **Implement rate limiting** (Gmail API quotas)
- **Cache search results** (30-60s) to reduce API calls
- **Handle token refresh** automatically
- **Google verification may be required** for `gmail.readonly` scope

## 🚀 Implementation Order

1. Database migration (Phase 1)
2. Core libraries (Phase 2)
3. OAuth flow (Phase 3)
4. Search API (Phase 4)
5. Frontend (Phase 5)
6. Security & Testing (Phase 6)

## 📚 Full Documentation

See `GMAIL_DELIVERABILITY_IMPLEMENTATION_PLAN.md` for complete details.

