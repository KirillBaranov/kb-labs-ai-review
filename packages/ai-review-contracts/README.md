# @kb-labs/ai-review-contracts

Contracts package for the KB Labs AI Review plugin. It describes the artifacts, command/workflow IDs, payload schemas, and helper parsers that other KB Labs surfaces consume.

## Contents

- `pluginContractsManifest` – the canonical manifest with artifact + command/workflow metadata.
- TypeScript types & Zod schemas for `AiReviewRun`, findings, risk score, command inputs/outputs.
- Runtime helpers: `parseAiReviewRun`, `parseAiReviewCommandOutput`.
- `contractsVersion` (SemVer) to coordinate breaking changes across surfaces.

## Artifact IDs

| ID | Kind | Description |
| --- | --- | --- |
| `ai-review.context` | markdown | Grounding context assembled from handbook/rules/ADR. |
| `ai-review.review.json` | json | Canonical machine-readable review output (`AiReviewRun`). |
| `ai-review.review.md` | markdown | Transport Markdown with embedded JSON payload. |
| `ai-review.review.human-md` | markdown | Human-friendly Markdown grouped by severity. |
| `ai-review.review.html` | file | Rendered HTML report for sharing. |

## Command & workflow

- `ai-review:run` – single entrypoint for running AI Review against a diff.
- `ai-review.workflow.run` – workflow step that wraps the command and emits the same artifacts.

Input/output schemas live in `src/schema.ts` and are referenced via `@kb-labs/ai-review-contracts/schema#…`.

## Usage example

```ts
import {
  AiReviewRunSchema,
  parseAiReviewRun,
  pluginContractsManifest
} from '@kb-labs/ai-review-contracts';

const run = parseAiReviewRun(jsonPayload);
const artifactId = pluginContractsManifest.artifacts['ai-review.review.json'].id;
```

## Versioning rules

| Change | Bump |
| ------ | ---- |
| Breaking change to artifacts/command/workflow or payload shape | **MAJOR** |
| Backwards-compatible additions (new fields/artifacts/commands) | **MINOR** |
| Documentation or metadata updates | **PATCH** |

## Development checklist

1. Update schemas/types in `src/schema.ts` when payloads evolve.
2. Adjust `pluginContractsManifest` so artifact/command IDs stay accurate.
3. Bump `contractsVersion` following the table above.
4. Run `pnpm --filter @kb-labs/ai-review-contracts test type-check`.
5. Build (`pnpm build`) before publishing to refresh `dist/`.

MIT © KB Labs

