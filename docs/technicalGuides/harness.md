# AI Harness

The harness is the home for AI-specific code in this project. It is an evolving folder, so add or update its instructions when new patterns, agents, skills, or tools are introduced.

It currently lives at `backend/src/harness`:

```text
harness/
├── agents/       Agent definitions and agent-specific prompts
├── skills/       Reusable instructions and capabilities
└── tools/        Repository and context tools used by agents
```

## What belongs here?

Put code in the harness when it controls AI behavior:

- Agent definitions and model calls
- Agent prompts and output schemas
- Reusable skills
- Tools for reading files, listing the repository, or searching code
- AI-specific provider adapters and helpers

The existing `agents/review.agent.ts` is an example of an agent. The files under `tools/` are intended for small, focused repository-context tools.

Routes, workers, queues, notifications, persistence, and HTTP concerns stay outside the harness. They should prepare input, call an agent, and handle the result. They should not duplicate prompts, tool logic, or model orchestration.

## Keep the harness independent

Keep the harness as independent as possible from the rest of the backend:

- Minimize imports from other folders.
- Prefer local types, schemas, prompts, and helpers where practical.
- Do not import routes, workers, queue implementations, or application-specific lifecycle code.
- Pass structured input into agents instead of letting them read jobs or HTTP requests directly.
- Keep tools portable and isolated from the current application.

This makes the harness easier to test and allows it to be extracted and deployed later as a standalone AI microservice. This is especially important for `tools/`, since repository tools may eventually be reused by another service or runtime.

## How to interact with it

When adding an AI feature:

1. Add or update an agent under `agents/`.
2. Add reusable instructions under `skills/` when they apply to more than one agent.
3. Add narrow, validated tools under `tools/` when an agent needs repository context.
4. Define clear input and output types for the agent.
5. Keep execution, retries, and delivery in the calling worker or service.
6. Update this guide when the harness structure or conventions evolve.

As a rule: if the code decides what the model should do or how it gets context, it belongs in the harness. If it decides when the AI work runs or what the application does afterward, it belongs outside the harness.

Never hard-code provider credentials. Load them through configuration or environment variables, and keep provider-specific setup behind a small adapter where possible.
