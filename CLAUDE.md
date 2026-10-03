> **Git policy — never auto-commit or auto-push.** Leave work in the working tree. Run git commit, git push, gh pr create or a release script only when the user explicitly asks in that turn.

# raidr_agent_types

Shared TypeScript types for the RaidrAgent API and apps. Pure types plus a few tiny runtime helpers; no dependencies beyond `@sudobility/types` (peer).

**Package**: `@sudobility/raidr_agent_types` (public on npm)

## What raidr_agent is

raidr_agent is a native agent app. It takes a user's request in plain language and:

1. finds the intent via **shapeshyft** (a hosted structured-AI endpoint);
2. filters the **raidr** catalog of MCP servers by label to the sites that can serve that intent;
3. signs the user in to those sites in an in-app **web view** — the site session tokens stay on the device and are never sent to the raidr_agent backend;
4. calls the sites through **raidr's hosted MCP** endpoint (raidr_api);
5. renders the results with the **Vercel AI SDK**.

## Layering

```
raidr_agent_types -> raidr_agent_client -> raidr_agent_lib -> raidr_agent_app_rn
raidr_agent_types ------------------------------------------> raidr_agent_api
```

- `raidr_agent_types` — shared TypeScript types and response helpers (no runtime deps).
- `raidr_agent_client` — `RaidrAgentClient` HTTP class (injected `NetworkClient`) + TanStack Query hooks.
- `raidr_agent_lib` — business logic: Zustand stores and hooks composed from client hooks.
- `raidr_agent_api` — Hono + Postgres (Drizzle) backend; Firebase auth; talks to shapeshyft and raidr.
- `raidr_agent_app_rn` — the React Native app (separate repo).

All repos use **Bun only** — never npm, yarn or pnpm.

## Project structure

```
src/
├── index.ts        # User, ApiInfoResponse, HealthResponse, HealthCheckData,
│                   # successResponse / errorResponse, isSuccessResponse / isErrorResponse
└── index.test.ts
```

## Commands

```bash
bun install
bun run typecheck     # tsc --noEmit
bun run lint          # eslint src
bun run test:unit     # vitest run
bun run build         # tsc -p tsconfig.esm.json -> dist/
bun run verify        # all of the above
```

## Notes

- Placeholder export: `HealthCheckData` (alias of `HealthResponse`). Replace/extend with real domain types (intent, MCP server, run results) as they are designed.
- Re-exports `ApiResponse`, `BaseResponse`, `NetworkClient`, `Optional` from `@sudobility/types`.
- Response envelope: `{ success, data?, error?, timestamp }` — always build it with `successResponse` / `errorResponse`.
- Keep this package free of runtime dependencies; every other raidr_agent repo depends on it.

## CI/CD

`.github/workflows/ci-cd.yml` calls `johnqh/workflows/.github/workflows/unified-cicd.yml@main` on push and PR to `main` and `develop`.

## Origin

Scaffolded from the mogulgame repos (themselves a copy of the company "starter" template), with the game domain removed.
