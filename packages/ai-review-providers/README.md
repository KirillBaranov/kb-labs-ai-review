# @kb-labs/ai-review-providers

Provider implementations for KB Labs AI Review. The package currently ships:

- **local** – deterministic rule-based provider powered by `@kb-labs/ai-review-core` heuristics.
- **mock** – lightweight stub used in tests, demos, and playgrounds.

Both providers return payloads conforming to `AiReviewRun` from `@kb-labs/ai-review-contracts`.

## Usage

```ts
import { localProvider, mockProvider } from '@kb-labs/ai-review-providers';

const run = await localProvider.review({
  diffText,
  profile: 'frontend',
  rules,
  boundaries
});
```

## Scripts

```bash
pnpm --filter @kb-labs/ai-review-providers build
pnpm --filter @kb-labs/ai-review-providers test
```

MIT © KB Labs
