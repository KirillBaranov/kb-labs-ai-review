# idempotent Profile

This profile contains:
- docs/handbook/*.md
- docs/rules/rules.json
- docs/rules/boundaries.json
- docs/adr (optional)

## Usage

Build context (optional, to inspect the full knowledge-pack for AI):
```bash
pnpm --filter @kb-labs/ai-review-cli exec tsx src/index.ts build-context --profile idempotent
```

Run review against a diff:
```bash
pnpm --filter @kb-labs/ai-review-cli exec tsx src/index.ts review \
  --diff ../../fixtures/changes.diff \
  --profile idempotent \
  --profiles-dir packages/profiles \
  --provider local \
  --out-md review.md --out-json review.json
```
