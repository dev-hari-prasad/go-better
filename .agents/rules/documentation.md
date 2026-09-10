# Documentation Rules

- The documentation site is Mintlify and is configured through `docs/docs.json`.
- Preserve YAML frontmatter at the top of `.md` and `.mdx` pages.
- Configuration variables belong in `docs/config/serverConfiguration.md` or the matching client configuration page.
- Queue and worker behavior belongs in `docs/technical-guides/queueAndWorkers.md`.
- Keep deployment instructions consistent with the repository's Vercel frontend and Railway or Docker backend setup.
- Never include real secrets, tokens, database URLs, or private endpoints in documentation.
- When a roadmap item is user-visible, update both `docs/todo.md` and `client/src/data/roadmap.json` when appropriate.
- Run `git diff --check` after documentation edits.
