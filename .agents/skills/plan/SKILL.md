---
name: plan
description: 'Create evidence-based implementation plans for GoBetter tasks. Use when a request spans backend, frontend, workers, database, deployment, security, or Mintlify documentation; when ownership is unclear; or when the user asks for a plan. Explore the relevant code and documentation before proposing edits, then carry the plan through implementation when code changes are requested.'
argument-hint: 'Describe the feature, bug, or change to investigate.'
---

# Plan Skill

Create plans that are grounded in this repository, not generic checklists. The plan should reduce uncertainty, identify the controlling code path, and make the smallest safe implementation obvious.

## When to Use

Use this skill when:

- A request crosses package boundaries or has unclear ownership.
- The task changes security, authentication, webhooks, queues, database writes, deployment, or public APIs.
- The task affects both application behavior and Mintlify documentation.
- The user explicitly asks for a plan, roadmap item, design, or implementation approach.
- A failing behavior has multiple plausible causes.

For a small, obvious edit with a nearby test, use the normal coding workflow instead of producing a long plan.

## Required Exploration

Before writing the plan, inspect enough of the repository to identify the real control point.

1. Read the root project guidance in `.agents/agents.md` and the relevant rule file under `.agents/rules/`.
2. Identify the owning package: `backend/`, `client/`, `docs/`, or a cross-package change.
3. Read the nearest implementation file, its caller, and its relevant schema/type/configuration.
4. Search for all references to the affected route, symbol, environment variable, queue, database field, or UI data source.
5. Explore the documentation properly:
   - Read `docs/docs.json` to confirm navigation.
   - Read the relevant Mintlify page and its neighboring technical or configuration page.
   - Search for existing terminology and configuration names before inventing new wording.
   - Check README and deployment docs when the task affects setup or operations.
6. Read nearby tests, scripts, build commands, or call sites that can disconfirm the proposed approach.
7. Check `git status` before editing and preserve unrelated user changes.

Do not map the entire repository. Stop exploring once you can name the controlling path, one falsifiable hypothesis, one cheap discriminating check, and the smallest plausible edit.

## Plan Format

Use the template in [plan-template.md](./references/plan-template.md). Every plan should state:

- The goal and user-visible behavior.
- The current behavior and evidence for it.
- The controlling files and boundaries.
- The data, security, and compatibility implications.
- A small ordered list of implementation steps with exact file targets.
- A focused validation command for each risky slice.
- Documentation updates, including the Mintlify navigation path when relevant.
- Open questions and explicit assumptions.

Keep steps action-oriented. Name symbols, routes, schemas, queue names, or data files rather than saying “update the backend.”

## Implementation Handoff

A plan is not a substitute for implementation when the user asked for code changes.

1. Present the concise plan once enough evidence is gathered.
2. Make the smallest first edit that tests the current hypothesis.
3. Immediately run the cheapest focused validation for that edit.
4. If validation supports the hypothesis, continue with adjacent edits and rerun focused validation.
5. If validation disproves it, take one nearby hop to the controlling abstraction and revise the plan.
6. Finish with an executable validation result and a summary of files changed.

Do not broaden exploration after the plan is sufficiently grounded. Do not claim a feature is complete when only documentation or a proposal was produced.

## Safety Boundaries

- Never print, copy, or add real secrets from `.env` files.
- Treat webhook, OAuth, session, and database ownership checks as security-sensitive.
- Preserve raw request bytes when a signature is involved.
- For worker pipelines, verify ownership before every stage that writes state or invokes a paid model.
- Do not change migrations, public API contracts, or deployment configuration without checking the corresponding docs and rollback implications.
- Do not commit or push unless explicitly requested.
