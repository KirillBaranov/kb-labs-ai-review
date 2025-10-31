# KB Labs AI Review

**AI-powered code review framework** with profile-based rules, dual output (JSON + Markdown), and GitHub/GitLab integration.  
Designed to catch architectural and stylistic issues beyond static linters.

<p align="center">
  <img src="https://img.shields.io/badge/build-passing-brightgreen" alt="Build Status" />
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License: MIT" />
  <img src="https://img.shields.io/badge/pnpm-workspaces-orange" alt="pnpm workspaces" />
</p>

---

## ✨ Features
- **Profiles**: isolated rule sets (`frontend`, `backend`, `e2e`), each with its own handbook, ADRs, and rules.json.
- **Dual output**: JSON (machine, metrics) + Markdown (developer-friendly).
- **Core/CLI separation**:
  - `@kb-labs/ai-review-core` → parsing, normalization, rendering.
  - `@kb-labs/ai-review-cli` → developer interface and CI integration.
- **AI-assisted findings**: complex cases beyond ESLint/TypeScript.
- **Workspace-friendly**: built with `pnpm` monorepo.
- **KB Labs Platform integration**: uses `@kb-labs/shared`, `@kb-labs/core`, and `@kb-labs/cli` for unified tooling.

---

## 🚀 Quick Start

```bash
# clone
git clone https://github.com/kirill-baranov/kb-labs-ai-review.git
cd kb-labs-ai-review

# install deps
pnpm install

# build AI context (frontend profile)
kb ai-review build-context --profile frontend

# run review on demo diff
kb ai-review review --diff fixtures/changes.diff --profile frontend
```

### Using via @kb-labs/cli

AI Review commands are registered in `@kb-labs/cli`:

```bash
# Show available commands
kb ai-review --help

# Review code changes
kb ai-review review --diff changes.diff --profile frontend

# Build context
kb ai-review build-context --profile frontend

# Render results
kb ai-review render-md --in review.json --out review.md
```

### Outputs:
* dist/ai-review-context.md → assembled context (rules + handbook + ADR).
* review.json → machine findings (for metrics).
* review.md → human-readable review report.

## 📂 Project Structure
```bash
apps/           # demo projects
packages/
  core/         # parsing, normalization, rendering
  cli/          # CLI tool
  providers/    # LLM integrations (mock, openai, claude)
profiles/       # rules, handbook, ADR per domain
tools/          # build scripts, diff, metrics
analytics/      # schema + aggregator
```

## 📜 Roadmap
*	Extend rule sets (frontend / backend / e2e).
*	Add provider integrations (OpenAI, Claude).
*	GitHub Actions bot → comment reviews in PR.
*	Web dashboard for metrics & trends.

⸻

## 📚 Documentation

- [Migration Guide](./docs/MIGRATION.md) - Guide for migrating from legacy architecture
- [ADR-0001: Migrate to KB Labs Platform](./docs/adr/0001-migrate-to-kb-labs-platform.md) - Migration decision record
- [CLI README](./packages/cli/README.md) - CLI package documentation

### Platform ADRs

- [KB Labs Platform Sync/Drift Check](https://github.com/kirill-baranov/kb-labs-devkit#sync--drift-check) - DevKit sync and drift-check system
- [ESM-only Architecture](https://github.com/kirill-baranov/kb-labs-devkit#esm-only) - ESM-only module standard

⸻

## 🤝 Contributing

Contributions welcome!
See CONTRIBUTING.md for guidelines.

⸻

## 📄 License

MIT © Kirill Baranov
