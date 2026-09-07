---
title: 'OpenAPI Contracts & Architecture'
sidebarTitle: 'OpenAPI Contract'
icon: 'file-code'
description: 'API design principles, runtime validation, and future contract specifications'
---

## Status

**Deferred** — planned for a later stage of the project.

## Why Not Now?

We considered adopting OpenAPI contract-based development early in the project, but decided against it for the current phase:

1. **No plugin available for Express.** There is no mature plugin/tooling to generate or validate OpenAPI contracts directly from our Express setup, which means we would need significant manual effort or custom glue code.
2. **It would stall our progress.** Building and maintaining contracts upfront adds overhead that slows down iteration while we are still shaping the API surface.
3. **Current approach gives us high velocity.** Our existing code-first workflow lets us ship features quickly, iterate on endpoints as requirements evolve, and avoid being locked into a contract that will inevitably churn.

## Future Introduction

Once the API surface stabilizes, we will introduce OpenAPI contract-based development:

- Define an OpenAPI specification as the source of truth for all endpoints.
- Explore contract-first tooling compatible with Express, or evaluate migrating relevant services to frameworks with first-class OpenAPI support.
- Add schema validation and automated contract tests against the spec.
- Generate client SDKs and up-to-date API reference documentation from the contract.
