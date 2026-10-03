# raidr_agent_types

Shared TypeScript types for the RaidrAgent API and apps. Pure types plus a few tiny runtime helpers; no dependencies beyond `@sudobility/types` (peer).

Part of **raidr_agent**: a native agent app that turns a user request into an intent (shapeshyft), picks matching raidr MCP servers by label, signs the user in to those sites in a web view (tokens stay on device), calls them through raidr's hosted MCP, and shows the results with the Vercel AI SDK.

Layering: `raidr_agent_types` -> `raidr_agent_client` -> `raidr_agent_lib` -> `raidr_agent_api` / `raidr_agent_app_rn`.

## Development

Bun only.

```bash
bun install
bun run typecheck     # tsc --noEmit
bun run lint          # eslint src
bun run test:unit     # vitest run
bun run build         # tsc -p tsconfig.esm.json -> dist/
bun run verify        # all of the above
```

## License

BUSL-1.1
