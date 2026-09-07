---
title: 'Cursor-Based Pagination'
sidebarTitle: 'Cursor Pagination'
icon: 'table-columns'
description: 'Database query design patterns for consistent, leak-free pagination'
---

This codebase uses **cursor-based pagination**. Do not use offset-based pagination.

Use a stable cursor such as:
- `id`
- `createdAt`
- `updatedAt`

Prefer `createdAt` or `updatedAt` for chronological pagination.

```ts
.where(lt(table.createdAt, new Date(lastCreatedAt)))
.orderBy(desc(table.createdAt))
.limit(20)
```

Avoid `.offset()` for pagination.