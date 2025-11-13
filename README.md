# KB Labs AI Review

Monorepo for the next iteration of KB Labs AI-powered code review. The workspace contains:

- **@kb-labs/ai-review-contracts** – public contracts (artifacts, command/workflow definitions, schemas, parsers).
- **@kb-labs/ai-review-core** – diff analysis heuristics, boundary checks, markdown rendering, risk scoring.
- **@kb-labs/ai-review-providers** – provider implementations (local heuristic engine and mock provider).
- **@kb-labs/ai-review-plugin** – runtime surfaces (CLI command & workflow handler) built on top of the contracts/core/providers stack.

## Getting started

```bash
pnpm install
pnpm devkit:sync
```

Then build & test the packages:

```bash
pnpm --filter @kb-labs/ai-review-contracts test
pnpm --filter @kb-labs/ai-review-core test
pnpm --filter @kb-labs/ai-review-providers test
pnpm --filter @kb-labs/ai-review-plugin test
```

## Workspace layout

```
packages/
  ai-review-contracts   # Contracts + schemas + manifest
  ai-review-core        # Diff analysis, heuristics, rendering
  ai-review-providers   # Local/mock providers returning AiReviewRun
  ai-review-plugin      # CLI runtime (ai-review:run) + workflow glue
```

## Development notes

- Contracts follow SemVer (`contractsVersion`). Bump the version whenever public payloads change.
- The runtime writes artifacts under `.ai-review/` (context, JSON, Markdown, optional HTML).
- Providers emit `AiReviewRun` payloads; the plugin service normalises them, computes summary/risk, and writes artifacts.

## Scripts

| Command | Description |
| ------- | ----------- |
| `pnpm devkit:sync` | Regenerate DevKit-managed configs. |
| `pnpm --filter <pkg> build` | Build a specific package. |
| `pnpm --filter <pkg> test` | Run Vitest suite for a package. |

## Documentation

- [`docs/overview.md`](./docs/overview.md) – product summary and package map
- [`docs/getting-started.md`](./docs/getting-started.md) – run the CLI locally
- [`docs/cli-guide.md`](./docs/cli-guide.md) – flags, exit codes, JSON payload
- [`docs/architecture.md`](./docs/architecture.md) – detailed architecture and extension points
- [`docs/faq.md`](./docs/faq.md) – troubleshooting common issues

MIT © KB Labs
