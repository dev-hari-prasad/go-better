# Contributing to GoBetter

Thank you for your interest in contributing to **GoBetter**! We are building an autonomous, high-signal AI code review engine designed to eliminate nitpicks and catch real architectural defects, concurrency deadlocks, memory leaks, and security vulnerabilities before code hits production.

Whether you're fixing bugs, optimizing our distributed BullMQ worker pipeline, enhancing the React dashboard, or improving our documentation, your contributions are warmly welcomed.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Monorepo Architecture](#monorepo-architecture)
3. [Local Development Setup](#local-development-setup)
4. [Engineering Standards & Architecture](#engineering-standards--architecture)
5. [Git Workflow & Commit Guidelines](#git-workflow--commit-guidelines)
6. [Submitting a Pull Request](#submitting-a-pull-request)
7. [Security & Vulnerability Reporting](#security--vulnerability-reporting)

---

## Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free environment for everyone. Please treat fellow contributors with respect, empathy, and constructive professionalism.

---

## Monorepo Architecture

GoBetter is structured as a high-performance **pnpm monorepo** with three primary packages:

```text
go-better/
├── backend/          # Express API, Drizzle ORM (PostgreSQL), BullMQ workers & AI agent harness
├── client/           # React 18, Vite, Tailwind CSS, Lucide / Phosphor icons & dashboard UI
├── docs/             # Mintlify technical documentation suite (hosted at docs.gobetter.dev)
├── vercel.json       # Production frontend deployment specification
└── package.json      # Workspace root scripts & tooling
```

### Responsibility Boundaries
- **`backend/`**: Handles GitHub webhook ingestion, BullMQ worker stages (`sanitizePayload`, `extractContents`, `agenticReview`), AES-256 encrypted BYOK vault, and live streaming NDJSON chat sessions.
- **`client/`**: Provides the interactive review viewer, diff explorer, prompt generator, and model picker.
- **`docs/`**: Lives alongside code to ensure documentation never drifts from backend routes or queue topologies.

---

## Local Development Setup

### Prerequisites

- **Node.js**: `v20.x` or higher (or Bun)
- **Package Manager**: [`pnpm`](https://pnpm.io/) `v9.x` (`corepack enable pnpm`)
- **Docker**: For running local PostgreSQL and Redis containers
- **Git**: Configured on your workstation

### 1. Clone the Repository

```bash
git clone https://github.com/dev-hari-prasad/go-better.git
cd go-better
```

### 2. Start Supporting Infrastructure

Launch PostgreSQL 16 and Redis 7 in detached containers:

```bash
# Start PostgreSQL (Port 5432)
docker run -d --name gobetter-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=gobetter_db -p 5432:5432 postgres:16

# Start Redis (Port 6379)
docker run -d --name gobetter-redis -p 6379:6379 redis:7-alpine
```

### 3. Setup Environment Variables

Copy the example configurations for backend and client:

```bash
cp backend/src/.env.example backend/src/.env
cp client/.env.example client/.env
```

Ensure `backend/src/.env` contains valid local database and Redis URLs:
- `DATABASE_URL=postgres://postgres:postgres@localhost:5432/gobetter_db`
- `REDIS_HOST=localhost`
- `REDIS_PORT=6379`
- `PORT=5000`

### 4. Install Dependencies & Push Database Schema

```bash
# Install root and workspace dependencies
pnpm install

# Push Drizzle schema to local PostgreSQL
cd backend
pnpm run db:push
cd ..
```

### 5. Run Development Servers

In separate terminals, start the backend and client:

```bash
# Terminal 1: Backend API & BullMQ Workers (http://localhost:5000)
cd backend
pnpm run dev

# Terminal 2: Vite React Client (http://localhost:3000)
cd client
pnpm run dev

# Terminal 3 (Optional): Mintlify Documentation (http://localhost:3333)
pnpm run docs:dev
```

---

## Engineering Standards & Architecture

### 1. Zero-Nitpick Philosophy
GoBetter is built to avoid superficial stylistic complaints (spaces vs. tabs, trivial renames, import ordering). Contributions to prompts and analysis heuristics should focus on:
- Concurrency races and deadlock hazards
- Unbounded memory allocations and resource leaks
- Authentication, authorization, and data validation vulnerabilities
- Breaking public API contracts and regressions

### 2. Queue & Worker Resilience
- Background workers in `backend/src/workers/` must remain idempotent.
- Every queue stage must handle transient network or provider failures with exponential backoff before sending failed jobs to the Dead Letter Queue (`deadLetter`).
- Never perform blocking synchronous network operations in webhook handlers; always push to `unprocessedWebhookPayload` immediately and respond with `200 OK`.

### 3. Security Rules
- **Webhook Ingestion**: Webhook payloads are untrusted. Always verify GitHub HMAC signatures against `GITHUB_WEBHOOK_VERIFICATION_SECRET` using raw request bytes.
- **BYOK Encryption**: All user-supplied API keys must be encrypted with AES-256-GCM before database writes and decrypted only when invoking models.
- **Environment Secrets**: Never commit real API keys, credentials, private keys, or tokens. Use `.env.example` placeholders only.

---

## Git Workflow & Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/) to maintain a clean and searchable git history:

```text
feat: add streaming AST token diff analyzer
fix: handle Redis disconnect in agenticReview worker
perf: optimize model catalog caching in local storage
docs: document BullMQ dead-letter retry strategy
refactor: consolidate model picker provider detection
style: adjust chat bar gradient sheen opacity
test: add test suite for webhook signature verifier
```

### Branch Naming Conventions
- `feat/feature-name` (e.g., `feat/github-connect-sync`)
- `fix/bug-description` (e.g., `fix/chat-glow-render`)
- `docs/page-name` (e.g., `docs/queue-architecture`)
- `perf/optimization` (e.g., `perf/redis-worker-pool`)

---

## Submitting a Pull Request

1. **Fork the repo** and create your branch from `main`.
2. **Implement your changes** with minimal, focused edits. Do not reformat unrelated files.
3. **Run local validation checks**:

   ```powershell
   # 1. Verify backend build
   cd backend && pnpm build && cd ..

   # 2. Verify frontend build
   cd client && pnpm build && cd ..

   # 3. Check for trailing whitespace or formatting conflicts
   git diff --check
   ```

4. **Push to your fork** and open a Pull Request against `main`.
5. **Fill out the PR template** describing:
   - What problem this solves and the technical approach taken.
   - Verification steps taken.
   - Any breaking changes or database migration requirements.

---

## Security & Vulnerability Reporting

If you discover a potential security vulnerability in GoBetter, please **do not open a public issue**. Instead, send a detailed report directly to:

📧 **`harii.codess@gmail.com`**

Include:
- Type of issue and affected package/endpoint.
- Step-by-step reproduction instructions or proof-of-concept.
- Any proposed remediation or mitigation.

We take security seriously and appreciate your efforts to responsibly disclose findings!
