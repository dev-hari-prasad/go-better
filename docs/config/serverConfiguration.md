---
title: 'Server Configuration'
sidebarTitle: 'Server Config'
icon: 'server'
description: 'Backend environment variables, databases, Redis queues, and security parameters'
---

<Tip>
**Quick Setup with [`copy-env`](https://www.npmjs.com/package/copy-env)**  
Scaffold your `backend/.env` from the example template in one command:
```bash
npx copy-env
```
This reads `copy-env-config.json` and copies `src/.env.example` → `src/.env`, so you only need to fill in your secrets.
</Tip>

---

## Configuration Overview Table

| Feature / Setting | Option / Key | Where to Toggle | Default Value |
| :--- | :--- | :--- | :--- |
| **HTTP Listening Port** | `PORT` | `backend/.env` | `5000` |
| **CORS Origin Allowance** | `CLIENT_URL` | `backend/.env` | `http://localhost:3000` |
| **PostgreSQL Connection String** | `DATABASE_URL` | `backend/.env` | `postgresql://...` (Required) |
| **Redis Broker URI** | `REDIS_URL` | `backend/.env` | `redis://localhost:6379` |
| **Default Fallback AI Model** | `BASE_MODEL` | `backend/.env` | `openai/gpt-4o` |
| **Platform AI Provider API Key** | `AI_API_KEY` | `backend/.env` | Unset / None |
| **Custom AI Endpoint Gateway** | `AI_BASE_URL` | `backend/.env` | Default (Standard OpenAI) |
| **OpenAI Client Invocation Method**| `OPEN_AI_INTERFACE` | `backend/.env` | `chat` |
| **Email Delivery (Resend API)** | `RESEND_API_KEY` | `backend/.env` | Unset / None |
| **Brand Identity & Domain** | `BRAND_NAME`, `BRAND_URL` | `backend/.env` / `config.ts` | `Go Better`, `https://gobetter.dev` |
| **Sender Email & Theming** | `FROM_EMAIL`, `EMAIL_THEME` | `backend/.env` / `config.ts` | `noreply@mail.gobetter.dev`, `dark` |
| **Per-User Free Spend Allowance** | `perUserSpendLimit` | `backend/src/config/config.ts` | `$0.30` USD |
| **Platform Free Model Pricing** | `goBetterFreeModels` | `backend/src/config/config.ts` | Model price map |
| **Platform InceptionLabs Gateway** | `goBetterBaseUrl` | `backend/src/config/config.ts` | InceptionLabs gateway URL |


---

## Detailed Configuration Breakdown

### 1. Networking & CORS

#### `PORT`
- **Location**: `backend/.env`
- **Description**: Defines which port the server listens on upon startup (`app.listen(port)`).
- **Example**:
  ```bash
  PORT=5000
  ```

#### `CLIENT_URL`
- **Location**: `backend/.env`
- **Description**: Configured in Hono's `cors()` middleware in `backend/src/server.ts`:
  ```typescript
  app.use('*', cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
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
# ==========================================
# GoBetter Server Environment Configuration
# ==========================================

# Server Network Configuration
PORT=5000
CLIENT_URL=http://localhost:3000

# PostgreSQL Database (Drizzle ORM)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gobetter

# Redis Queue Connection (BullMQ & Sessions)
REDIS_URL=redis://localhost:6379

# Primary AI Model & Provider
BASE_MODEL=openai/gpt-4o
AI_API_KEY=your-server-ai-api-key
AI_BASE_URL=https://api.openai.com/v1
OPEN_AI_INTERFACE=chat

# Email Service (Resend)
RESEND_API_KEY=re_your_resend_api_key

# Branding & Transactional Email
BRAND_NAME="Go Better"
BRAND_URL="https://gobetter.dev"
BRAND_TAGLINE="Autonomous AI Code Reviews"
FROM_EMAIL="noreply@mail.gobetter.dev"
FROM_SENDER="Go Better <noreply@mail.gobetter.dev>"
EMAIL_THEME="dark"
COPYRIGHT_YEAR="2026"
BRAND_LOGO_URL="https://gobetter.dev/gobetter-logo.png"
```
