# @kb-labs/ai-review-plugin

Runtime implementation for KB Labs AI Review. This package wires together:

- Providers (`@kb-labs/ai-review-providers`)
- Core heuristics (`@kb-labs/ai-review-core`)
- Contracts (`@kb-labs/ai-review-contracts`)
- CLI command `ai-review:run`
- Workflow helper `runAiReviewWorkflow`

## Capabilities

- Builds profile context (handbook + rules + ADR) under `.ai-review/context/<profile>.md`.
- Runs providers (local/mock) to produce an `AiReviewRun` payload.
- Writes transport JSON/Markdown artifacts and human-readable Markdown + optional HTML.

## Development

```bash
pnpm --filter @kb-labs/ai-review-plugin build
pnpm --filter @kb-labs/ai-review-plugin test
```

## CLI entrypoint

```ts
import { runAiReviewCommand } from '@kb-labs/ai-review-plugin';

await runAiReviewCommand({
  diff: 'changes.diff',
  profile: 'frontend'
});
```

MIT © KB Labs
