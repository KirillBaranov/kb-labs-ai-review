# @kb-labs/ai-review-core

Core building blocks for KB Labs AI Review. The package contains:

- Unified diff parsing adapters (`parsedDiffToFileDiffs`).
- Static analysis heuristics (`analyzeDiff`) used by local/mock providers.
- Normalization helpers (fingerprints, severity grouping, risk scoring).
- Markdown rendering utilities used to produce human readable reports.

The code is ported from the legacy `kb-labs-ai-review` project with minimal changes. Consumers should rely on `@kb-labs/ai-review-contracts` for public types (`AiReviewRun`, artifacts) and use these helpers to implement providers or runtime services.

## Scripts

```bash
pnpm --filter @kb-labs/ai-review-core build
pnpm --filter @kb-labs/ai-review-core test
```

MIT © KB Labs
