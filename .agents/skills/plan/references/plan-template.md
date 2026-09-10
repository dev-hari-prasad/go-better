# Implementation Plan Template

## Goal

State the requested behavior in one or two sentences.

## Current Evidence

- Current behavior:
- Controlling code path:
- Relevant documentation:
- Nearby validation:

## Hypothesis

State one falsifiable explanation for the current behavior or the smallest design assumption.

## Scope

- Files or symbols to change:
- Files explicitly left unchanged:
- Security or compatibility constraints:

## Steps

1. Make the smallest edit at the controlling boundary.
2. Run the focused validation that could disconfirm it.
3. Update adjacent code, tests, and docs only as required.
4. Run the package-level validation.

## Documentation

- Mintlify page/navigation:
- README or deployment guidance:
- Configuration examples:

## Validation

List exact commands and the expected result.

## Assumptions / Open Questions

List only unresolved decisions that could change the implementation.
