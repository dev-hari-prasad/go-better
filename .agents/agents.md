# GoBetter Agent Guidance

## Project Shape

GoBetter is a pnpm monorepo with three main surfaces:

- `backend/`: Express API, PostgreSQL via Drizzle, Redis/BullMQ queues, and background workers.
- `client/`: React and Vite frontend.
- `docs/`: Mintlify documentation.

Read the nearest package-level code and documentation before changing behavior. Keep changes scoped to the owning package.

## General Rules

- Preserve existing public APIs and local patterns unless the task requires a contract change.
- Prefer small, focused edits. Do not reformat unrelated files.
- Never commit secrets, tokens, connection strings, private keys, or real environment values.
- Use `.env.example` for configuration documentation and placeholders only.
- Validate changes with the narrowest available check, then run the relevant package build or test.
- Do not commit or create branches unless explicitly requested.
- Do not revert unrelated user changes.

## Security Rules

- Treat webhook payloads as untrusted input.
- Verify GitHub webhook signatures using the raw request body and `GITHUB_WEBHOOK_VERIFICATION_SECRET` before processing.
- Keep `/webhook` free of user-session authentication so GitHub can call it, but never bypass HMAC verification.
- Match the GitHub user ID in a webhook to an existing `users.github_id` record before associating or processing a pull request.
- Re-check pull-request ownership before worker stages perform database or review updates.
- Do not expose backend environment values to the client or logs.

## Documentation Rules

- User-facing backend configuration belongs in `docs/config/serverConfiguration.md`.
- Queue and worker behavior belongs in `docs/technical-guides/queueAndWorkers.md`.
- Project roadmap items should be reflected in both `docs/todo.md` and `client/src/data/roadmap.json` when they are visible to users.
- Keep Mintlify frontmatter valid and use workspace-relative links where possible.

## Validation

Backend:

```powershell
Set-Location backend
pnpm build
```

Frontend:

```powershell
Set-Location client
pnpm build
```

Documentation and configuration:

```powershell
git diff --check
```
