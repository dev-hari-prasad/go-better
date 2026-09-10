# Frontend Rules

- The frontend lives under `client/` and uses React with Vite.
- Follow the existing component, router, service, and data-file patterns before adding abstractions.
- Keep backend secrets out of client code. Only expose intentionally public `VITE_*` values.
- Keep API base URLs configurable through the client environment configuration.
- Roadmap items shown in the application are stored in `client/src/data/roadmap.json`; preserve its schema and unique keys.
- Use existing UI components and styling conventions before introducing new dependencies.
- Run `pnpm build` from `client/` after frontend changes.
