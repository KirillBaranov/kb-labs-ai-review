# Contributing Guide

Thanks for helping grow the KB Labs AI Review plugin!

---

## 🧰 Local development

```bash
pnpm install
pnpm --filter @kb-labs/ai-review-plugin run build # optional warm-up
pnpm --filter @kb-labs/ai-review-plugin test
```

Handy scripts:

- `pnpm verify` – lint + type-check + test across all packages
- `pnpm kb ai-review run --diff <file>` – execute the CLI command from source
- `pnpm devkit:sync` – align configs with `@kb-labs/devkit`

## 📐 Engineering guidelines

### Layering

- `contracts` → `core` → `providers` → `plugin`
- CLI/workflow surfaces remain thin adapters over `executeReview`
- Core heuristics stay deterministic and side-effect free (no fs/net)
- Providers wrap core heuristics and emit `AiReviewRun` payloads

### Code quality

- Follow ESLint + Prettier (run `pnpm lint`)
- TypeScript is strict; add explicit types at package boundaries
- Use Vitest for providers/runtime tests (`packages/**/tests`)
- Update docs and manifests when contracts change

### Manifest checklist

1. Register new commands/workflow steps in `packages/ai-review-plugin/src/manifest.v2.ts`.
2. Declare permissions (fs/env/quotas) required by the feature.
3. Add tsup entry points so build artifacts include new handlers.
4. Provide tests and documentation updates reflecting the change.

### Conventional commits

```
feat: add boundary heuristic for shared packages
fix: correct ai-review run context paths
docs: refresh getting started guide
refactor: extract provider resolver helper
test: cover mock provider fingerprints
chore: bump devkit
```

---

## 🔄 Pull request workflow

Before opening a PR:

1. Branch off `main`.
2. Implement changes following layering + manifest guidelines.
3. Run `pnpm verify`.
4. Update docs (`README`, guides, ADRs) when contracts, workflows, or CLI behaviour change.
5. Provide CLI transcripts or artifact samples when appropriate.

PR requirements:

- Include tests proving behaviour (core, providers, runtime).
- Reference related issues or ADRs.
- Ensure CI is green and request maintainer review.

---

Documentation standards live in [`docs/DOCUMENTATION.md`](./docs/DOCUMENTATION.md). Capture major structural decisions with ADRs under [`docs/adr/`](./docs/adr/).
