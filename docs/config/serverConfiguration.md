---
title: 'Server Configuration'
sidebarTitle: 'Server Config'
icon: 'server'
description: 'Backend environment variables, databases, Redis queues, and security parameters'
---

<Tip>
**Quick Setup with [`copy-env`](https://www.npmjs.com/package/copy-env)**  
From the `backend/` directory, scaffold the runtime env file in one command:
```bash
pnpm install
pnpm run copy-env
```
This reads `copy-env-config.json` and copies `src/.env.example` to `src/.env`. The backend loads `src/.env` at startup; fill in the generated placeholders before running the server. Docker Compose can additionally load `backend/src/.env` when that file exists.
</Tip>

<Note>
  The production backend container runs pending Drizzle migrations before starting the API. Set `DATABASE_URL` in the container environment before startup. Keep migration execution in the container's startup command rather than the image build so the image can be built without database access.
</Note>

---

## Configuration Overview Table

| Feature / Setting | Option / Key | Where to Toggle | Default Value |
| :--- | :--- | :--- | :--- |
| **HTTP Listening Port** | `PORT` | `backend/src/.env` or Compose | `5000` |
| **CORS Origin Allowance** | `CLIENT_URL` | `backend/src/.env` or Compose | `http://localhost:3000` |
| **PostgreSQL Connection String** | `DATABASE_URL` | `backend/src/.env` or Compose | Required |
| **Redis Broker URI** | `REDIS_URL` | `backend/src/.env` or Compose | `redis://localhost:6379` |
| **Default Fallback AI Model** | `BASE_MODEL` | `backend/src/.env` or Compose | Provider-specific |
| **Platform AI Provider API Key** | `AI_API_KEY` | `backend/src/.env` or Compose | Unset / None |
| **Custom AI Endpoint Gateway** | `AI_BASE_URL` | `backend/src/.env` or Compose | Provider-specific |
| **OpenAI Client Invocation Method**| `OPEN_AI_INTERFACE` | `backend/src/.env` or Compose | `chat` |
| **Email Delivery (Resend API)** | `RESEND_API_KEY` | `backend/src/.env` or Compose | Unset / None |
| **GitHub Integration** | `GITHUB_ACESSES_TOKEN`, `GITHUB_OAUTH_*`, `GITHUB_APP_SLUG`, `GITHUB_WEBHOOK_VERIFICATION_SECRET` | `backend/src/.env` or Compose | Unset / None |
| **Encryption & Auth** | `API_ENCRYPTION_KEY`, `BETTER_AUTH_URL` | `backend/src/.env` or Compose | Unset / None |
| **Per-User Free Spend Allowance** | `perUserSpendLimit` | `backend/src/config/config.ts` | `$0.30` USD |
| **Platform Free Model Pricing** | `goBetterFreeModels` | `backend/src/config/config.ts` | Model price map |
| **Platform InceptionLabs Gateway** | `goBetterBaseUrl` | `backend/src/config/config.ts` | InceptionLabs gateway URL |


---

## Detailed Configuration Breakdown

## Where to Get Each Backend Value

Create the backend file from `backend/src/.env.example` and replace every `YOUR_VALUE_HERE` placeholder. Keep this file private: backend environment values are secrets unless marked **public configuration**.

| Variable | Required | How to acquire it |
| :--- | :---: | :--- |
| `PORT` | Yes | Use `5000` locally. In a hosted container, use the port required by the platform and keep the Compose mapping in sync. **Public configuration.** |
| `BASE_MODEL` | Yes | Copy the model ID from the AI provider's model catalog, for example `mercury-2` for InceptionLabs. |
| `AI_BASE_URL` | Yes | Copy the OpenAI-compatible API base URL from the provider's API documentation. |
| `AI_API_KEY` | Yes | Create an API key in the selected AI provider's dashboard. Store it only in the backend environment. |
| `OPEN_AI_INTERFACE` | Yes | Use `chat` for chat-completions providers. Use `responses` only when the selected provider supports it. |
| `GITHUB_ACESSES_TOKEN` | Optional | This is the current spelling in the template. The current backend does not read it directly; prefer the GitHub App values below. |
| `REDIS_URL` | Yes | Create a Redis database with Redis Cloud, Upstash, Railway, or locally. Copy its full connection URI. |
| `DATABASE_URL` | Yes | Create a PostgreSQL database with Neon, Supabase, Railway, or locally. Copy its connection string and keep SSL parameters intact. |
| `API_ENCRYPTION_KEY` | Yes | Generate a unique 32-byte secret encoded as base64. Do not reuse a password or commit it. |
| `CLIENT_URL` | Yes | Set this to the browser origin allowed to call the API, such as `http://localhost:3000` or your deployed frontend URL. **Public configuration.** |
| `API_BASE_URL` | Yes for GitHub callbacks | Set this to the public backend origin, such as `http://localhost:5000` or `https://api.example.com`. **Public configuration.** |
| `BETTER_AUTH_URL` | Yes for hosted auth | Set this to the backend's public origin. It normally matches `API_BASE_URL`. **Public configuration.** |
| `RESEND_API_KEY` | Yes for email | Create an API key in the Resend dashboard. Verify the sending domain and sender address first. |
| `GITHUB_OAUTH_CLIENT_ID` | Yes for GitHub login | Create or open a GitHub OAuth App and copy its Client ID. Set its callback URL to `<API_BASE_URL>/auth/github/callback`. |
| `GITHUB_OAUTH_CLIENT_SECRET` | Yes for GitHub login | Copy or generate the Client secret from the same GitHub OAuth App. Store it only in the backend environment. |
| `GITHUB_OAUTH_SCOPE` | Yes for GitHub OAuth Apps | Set to `user:email`. The login flow uses it to retrieve a private primary email address. |
| `GITHUB_APP_SLUG` | Yes for GitHub App links | Copy the slug from the GitHub App installation URL or app settings. |
| `GITHUB_WEBHOOK_VERIFICATION_SECRET` | Yes for GitHub webhooks | Create a strong random secret in the GitHub webhook settings and configure the same value in the backend environment. GitHub uses it to generate the `X-Hub-Signature-256` header. |

#### `GITHUB_WEBHOOK_VERIFICATION_SECRET`

This secret authenticates incoming `POST /webhook` requests. The backend verifies GitHub's HMAC-SHA256 signature against the raw request body before checking the event type or writing to PostgreSQL and Redis.

Configure the same secret in both places:

1. In the GitHub repository or GitHub App webhook settings, enter it in the **Secret** field.
2. In `backend/src/.env` or the production backend environment, set `GITHUB_WEBHOOK_VERIFICATION_SECRET` to the same value.

Do not add the secret to the frontend, commit it to source control, or include it in logs. The `/webhook` endpoint does not require a user session because GitHub authenticates it with this signature.

### Generate an Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Backend Secrets and Rotation

Never place `AI_API_KEY`, `DATABASE_URL`, `REDIS_URL`, `RESEND_API_KEY`, GitHub secrets, or `API_ENCRYPTION_KEY` in frontend files, source control, Docker images, or public issue reports. If a secret is exposed, revoke it at the provider immediately and replace it in the backend environment.

### 1. Networking & CORS

#### `PORT`
- **Location**: `backend/.env`
- **Description**: Defines which port the server listens on upon startup (`app.listen(port)`).
- **Example**:
  ```bash
  PORT=5000
  ```

#### `CLIENT_URL`
- **Location**: `backend/src/.env` or the Compose environment
- **Description**: Configured in Express's `cors()` middleware in `backend/src/server.ts`:
  ```typescript
  app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }));
  ```
- **Example**:
  ```bash
  CLIENT_URL=http://localhost:3000
  ```

---

### 2. Database & Storage

#### `DATABASE_URL`
- **Location**: `backend/.env`
- **Description**: Target PostgreSQL database instance. Required for running migrations via Drizzle ORM and managing client queries through `pg.Pool`.
- **Format**: `postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=[mode]`
- **Example**:
  ```bash
  DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gobetter_db
  ```

#### `REDIS_URL`
- **Location**: `backend/.env`
- **Description**: Redis instance utilized for BullMQ task distribution, queueing pull request webhooks, managing user sessions, and coordinating async worker jobs.
- **Example**:
  ```bash
  REDIS_URL=redis://localhost:6379
  ```

---

### 3. AI Engine & Provider Routing

#### `BASE_MODEL`
- **Location**: `backend/.env`
- **Description**: Default model slug invoked when a review job does not supply an explicit model preference.
- **Example**:
  ```bash
  BASE_MODEL=openai/gpt-4o
  ```

#### `AI_API_KEY` & `AI_BASE_URL`
- **Location**: `backend/.env`
- **Description**: Supplies authentication and custom base URL for the backend's AI service (`backend/src/service/ai.service.ts`).
- **Example**:
  ```bash
  AI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  AI_BASE_URL=https://api.openai.com/v1
  ```

#### `OPEN_AI_INTERFACE`
- **Location**: `backend/.env`
- **Description**: Determines interface method on OpenAI SDK (`chat` by default).

---

### 4. Email Service & Delivery

#### `RESEND_API_KEY`
- **Location**: `backend/.env`
- **Description**: Authenticates with Resend API (`backend/src/lib/resendEmail.ts`) to dispatch transactional authentication emails (email verification OTPs, password reset links).
- **Example**:
  ```bash
  RESEND_API_KEY=re_123456789_abcdefg
  ```

---

### 5. Platform Branding & Email Theming

Configured in `backend/.env` or defaults in `backend/src/config/config.ts`:

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `BRAND_NAME` | `Go Better` | Visible brand name in notification headings and emails |
| `BRAND_URL` | `https://gobetter.dev` | Landing page URL linked in footers |
| `BRAND_TAGLINE` | `Autonomous AI Code Reviews` | Subtitle displayed in email headers |
| `FROM_EMAIL` | `noreply@mail.gobetter.dev` | Envelope sender address |
| `FROM_SENDER` | `Go Better <noreply@mail.gobetter.dev>` | Friendly from-name and address |
| `EMAIL_THEME` | `dark` | Email template theme (`dark` or `light`) |
| `BRAND_LOGO_URL` | `https://gobetter.dev/gobetter-logo.png` | Public URL for email header badge |

---

### 6. In-Code Platform Pricing & Quotas

Located in [`backend/src/config/config.ts`](file:///d:/hono-rabbit/backend/src/config/config.ts):

```typescript
// Amount user can spend on the platform before they need to enable BYOK
export const perUserSpendLimit = 0.30;

export const goBetterFreeModels = {
    'alibaba/qwen3.7-flash': {
        inputCost: 0.03,
        outputCost: 0.13
    },
    'deepseek/deepseek-v4-flash-0731': {
        inputCost: 0.05,
        outPutCost: 0.10
    },
    'nvidia/nemotron-3.5-lightning': {
        inputCost: 0.05,
        outPutCost: 0.15
    },
    'zai/glm-4.7-flashx': {
        inputCost: 0.06,
        outputCost: 0.40
    },
    'openai/gpt-oss-20b': {
        inputCost: 0.07,
        outputCost: 0.30
    },
};

export const goBetterBaseUrl = 'https://api.inceptionlabs.ai/v1/chat/completions';
```

---

## Server Environment Template (`backend/.env.example`)

```bash
# Copy backend/src/.env.example to backend/src/.env, then replace placeholders.
PORT="YOUR_VALUE_HERE"
BASE_MODEL="YOUR_VALUE_HERE"
AI_BASE_URL="YOUR_VALUE_HERE"
AI_API_KEY="YOUR_VALUE_HERE"
OPEN_AI_INTERFACE="YOUR_VALUE_HERE"
GITHUB_ACESSES_TOKEN="YOUR_VALUE_HERE"
REDIS_URL="YOUR_VALUE_HERE"
DATABASE_URL="YOUR_VALUE_HERE"
API_ENCRYPTION_KEY="YOUR_VALUE_HERE"
CLIENT_URL="YOUR_VALUE_HERE"
API_BASE_URL="YOUR_VALUE_HERE"
BETTER_AUTH_URL="YOUR_VALUE_HERE"
RESEND_API_KEY="YOUR_VALUE_HERE"
GITHUB_OAUTH_CLIENT_ID="YOUR_VALUE_HERE"
GITHUB_OAUTH_CLIENT_SECRET="YOUR_VALUE_HERE"
GITHUB_OAUTH_SCOPE="user:email"
GITHUB_APP_SLUG="YOUR_VALUE_HERE"
```
