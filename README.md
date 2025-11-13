# Mailer Toolbox

A comprehensive suite of email and IP tools built with Next.js 16, designed to simplify your workflow and enhance productivity.

## Features

- **AI Email Rewriter** - Transform HTML emails to bypass spam filters and improve deliverability
- **Subject Line Rewriter** - Generate multiple optimized subject line alternatives
- **User API Key Management** - Users can add their own Gemini API keys (encrypted and secure)
- **Header Processor** - Process and analyze email headers
- **HTML to Image Converter** - Convert HTML emails to images
- **EML to TXT Converter** - Extract text content from EML files
- **IP Comparator** - Compare and analyze IP addresses
- **Photo Editor** - Edit and process images

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm/bun
- Google Generative AI API key ([Get one here](https://aistudio.google.com/app/apikey))
- Upstash Redis account ([Create free account](https://upstash.com/))

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mailer-toolbox
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Fill in your environment variables in `.env.local`:
```env
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key_here
UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_redis_token_here
PROMPT_VERSION=v1.0
API_KEY_ENCRYPTION_SECRET=your_encryption_secret_here
```
**Important**: Generate a strong random string for `API_KEY_ENCRYPTION_SECRET` (at least 32 characters). This is used to encrypt user API keys in the database.

5. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## AI Email Rewriter

### Overview

The AI Email Rewriter (`/rewrite`) is a powerful tool that transforms HTML emails to improve deliverability and bypass spam filters while maintaining the original message and visual design.

### How It Works

1. **Content Transformation**: Rewrites all text using alternative vocabulary while preserving meaning
2. **Spam Trigger Elimination**: Removes high-risk promotional words and replaces them with deliverability-safe alternatives
3. **HTML Structure Optimization**: Reorganizes code structure, renames classes/IDs, and adjusts styling for better compatibility
4. **Smart Caching**: Uses Redis to cache responses, saving tokens and improving response time

### Caching Strategy

The rewriter uses a sophisticated caching system:

- **Cache Key**: Generated using SHA-256 hash of `PROMPT_VERSION + systemPrompt + html`
- **TTL**: 24 hours (86400 seconds)
- **Cache Invalidation**: When `PROMPT_VERSION` changes, all old caches become invalid
- **Benefits**: 
  - Identical requests are served instantly from cache
  - Significant token savings for repeated content
  - Faster response times

### Updating the System Prompt

If you need to update the AI system prompt:

1. Modify the `SYSTEM_PROMPT` constant in `app/api/rewrite/route.ts`
2. Increment `PROMPT_VERSION` in your `.env.local` file (e.g., `v1.0` → `v1.1`)
3. Deploy the changes

This ensures that:
- Old cached responses are no longer used
- New requests use the updated prompt
- Cache invalidation happens automatically

### API Endpoint

**POST** `/api/rewrite`

Request body:
```json
{
  "html": "<html>Your email HTML here</html>"
}
```

Response:
```json
{
  "html": "<html>Rewritten email HTML</html>",
  "cached": false
}
```

- `html`: The rewritten HTML email
- `cached`: Boolean indicating if the response came from cache

## User API Key Management

### Overview

Users can now add their own Gemini API keys through the Settings page. This feature allows:
- **Cost Control**: Users pay for their own API usage
- **Better Rate Limits**: Each user has their own quota
- **Privacy**: API calls use user's own keys
- **Multiple Keys**: Support for multiple keys per provider (for future multi-AI model support)

### How It Works

1. **Encryption**: API keys are encrypted using AES-256-GCM before storage
2. **Real-time Validation**: Keys are validated when added or updated
3. **Priority System**: User keys take priority over environment variable
4. **Fallback**: If no user key is set, the app falls back to `GOOGLE_GENERATIVE_AI_API_KEY`

### Using User API Keys

1. Navigate to **Settings** (`/settings`) from the sidebar or user menu
2. Click **Add New API Key**
3. Select provider (currently Gemini)
4. Enter a name for your key
5. Paste your Gemini API key
6. Optionally set as default
7. Click **Add API Key** - the key will be validated automatically

### API Key Priority

When making API calls, the system uses keys in this order:
1. User's default API key (if authenticated and set)
2. User's active API key (if authenticated, no default set)
3. Environment variable `GOOGLE_GENERATIVE_AI_API_KEY` (fallback)
4. Error if none available

### Security

- All API keys are encrypted at rest using AES-256-GCM
- Keys are only decrypted server-side when needed
- Row Level Security (RLS) ensures users can only access their own keys
- Keys are never logged or exposed in error messages

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Your Google Generative AI API key (fallback if users don't provide their own) | Yes |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL | Yes |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token | Yes |
| `PROMPT_VERSION` | Version identifier for cache invalidation | No (defaults to `v1.0`) |
| `API_KEY_ENCRYPTION_SECRET` | Secret key for encrypting user API keys (min 32 chars, use strong random string) | Yes (for production) |

## Deployment

### Deploy on Vercel

1. Push your code to GitHub/GitLab/Bitbucket
2. Import your repository in [Vercel](https://vercel.com/new)
3. Add environment variables in the Vercel dashboard:
   - `GOOGLE_GENERATIVE_AI_API_KEY`
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `PROMPT_VERSION` (optional)
4. Deploy!

The app is optimized for Vercel's serverless functions and works seamlessly with Upstash Redis.

### Manual Deployment

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **AI**: Google Gemini 2.0 Flash (Experimental)
- **Cache**: Upstash Redis
- **UI**: shadcn/ui, Tailwind CSS
- **Deployment**: Vercel (recommended)

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Google AI Studio](https://aistudio.google.com/)
- [Upstash Redis Documentation](https://docs.upstash.com/redis)
- [shadcn/ui Components](https://ui.shadcn.com/)

## License

This project is private and proprietary.
