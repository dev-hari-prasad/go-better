# Backend Rules

- Backend source lives under `backend/src` and runs as an Express API with BullMQ workers started from `backend/src/server.ts`.
- Use the existing Drizzle schemas and services instead of duplicating database access patterns.
- Validate webhook signatures before reading a GitHub payload for processing. Preserve the raw JSON body for HMAC verification.
- Use `GITHUB_WEBHOOK_VERIFICATION_SECRET`; never hard-code or print its value.
- `/webhook` is public to GitHub callers, but signed requests are mandatory. Do not put normal session middleware on that route.
- GitHub webhook ownership is based on the numeric GitHub user ID stored in `users.github_id`. Unknown users must not enter the queue.
- Worker stages must verify the pull request owner before performing review or pull-request updates.
- Keep queue retries and dead-letter handling consistent with the existing BullMQ configuration.
- Run `pnpm build` from `backend/` after backend changes.
