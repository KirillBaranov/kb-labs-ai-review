# KB Labs AI Review (@kb-labs/ai-review)

> **AI-powered code review framework** with profile-based rules, dual output (JSON + Markdown), and GitHub/GitLab integration. Designed to catch architectural and stylistic issues beyond static linters.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18.18.0+-green.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-9.0.0+-orange.svg)](https://pnpm.io/)

## 🎯 Vision

KB Labs AI Review is an AI-powered code review framework with profile-based rules, dual output (JSON + Markdown), and GitHub/GitLab integration. It is designed to catch architectural and stylistic issues beyond static linters, providing intelligent code analysis that goes beyond what traditional linters can detect.

The project solves the problem of catching complex architectural and stylistic issues that static linters cannot detect by using AI-powered analysis with profile-based rules. Instead of manually reviewing code for architectural patterns, developers can use AI Review to automatically detect issues related to boundaries, dependencies, design patterns, and style consistency.

This project is part of the **@kb-labs** ecosystem and integrates seamlessly with Core, CLI, Shared, and all other KB Labs tools.

## 🚀 Quick Start

### Installation

```bash
# Clone repository
git clone https://github.com/kirill-baranov/kb-labs-ai-review.git
cd kb-labs-ai-review

# Install dependencies
pnpm install
```

### Development

```bash
# Build all packages
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint
```

### Basic Usage

#### Build Context

```bash
# Build AI context (frontend profile)
kb ai-review build-context --profile frontend
```

#### Run Review

```bash
# Run review on demo diff
kb ai-review review --diff fixtures/changes.diff --profile frontend

# Review with custom options
kb ai-review review --diff changes.diff --profile frontend --fail-on error
```

#### Render Results

```bash
# Render Markdown report
kb ai-review render-md --in review.json --out review.md

# Render HTML report
kb ai-review render-html --in review.json --out review.html
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

### Output Files

- **`dist/ai-review-context.md`** → Assembled context (rules + handbook + ADR)
- **`review.json`** → Machine findings (for metrics)
- **`review.md`** → Human-readable review report

## ✨ Features

- **Profiles**: Isolated rule sets (`frontend`, `backend`, `e2e`), each with its own handbook, ADRs, and rules.json
- **Dual Output**: JSON (machine, metrics) + Markdown (developer-friendly)
- **Core/CLI Separation**: 
  - `@kb-labs/ai-review-core` → parsing, normalization, rendering
  - `@kb-labs/ai-review-cli` → developer interface and CI integration
- **AI-Assisted Findings**: Complex cases beyond ESLint/TypeScript
- **Workspace-Friendly**: Built with `pnpm` monorepo
- **KB Labs Platform Integration**: Uses `@kb-labs/shared`, `@kb-labs/core`, and `@kb-labs/cli` for unified tooling
- **Analytics Integration**: Tracks findings, metrics, and trends
- **Provider Support**: Multiple LLM providers (mock, local, OpenAI, Claude)

## 📁 Repository Structure

```
kb-labs-ai-review/
├── apps/                    # Demo projects
│   └── demo/                # Demo application
├── packages/                # Core packages
│   ├── core/                # Parsing, normalization, rendering (@kb-labs/ai-review-core)
│   ├── cli/                 # CLI tool (@kb-labs/ai-review-cli)
│   ├── analytics/           # Analytics schema and aggregator (@kb-labs/ai-review-analytics)
│   └── providers/           # LLM integrations
│       ├── mock/            # Mock provider
│       ├── local/           # Local provider
│       ├── openai/          # OpenAI provider
│       └── claude/          # Claude provider
├── profiles/                # Rule sets per domain
│   ├── frontend/            # Frontend profile
│   ├── backend/             # Backend profile
│   ├── e2e/                 # E2E profile
│   └── ...                  # Other profiles
├── fixtures/                # Test diffs and examples
├── docs/                    # Documentation
│   └── adr/                 # Architecture Decision Records
└── scripts/                 # Utility scripts
```

### Directory Descriptions

- **`apps/`** - Demo applications demonstrating AI Review usage
- **`packages/core/`** - Core library for parsing, normalization, and rendering
- **`packages/cli/`** - CLI tool for developer interface and CI integration
- **`packages/analytics/`** - Analytics schema and aggregator for tracking findings
- **`packages/providers/`** - LLM provider integrations (mock, local, OpenAI, Claude)
- **`profiles/`** - Profile-based rule sets with handbook, ADRs, and rules
- **`fixtures/`** - Test diffs and example changes for testing
- **`docs/`** - Documentation including ADRs and guides

## 📦 Packages

| Package | Description |
|---------|-------------|
| [@kb-labs/ai-review-core](./packages/core/) | Core library for parsing, normalization, and rendering |
| [@kb-labs/ai-review-cli](./packages/cli/) | CLI tool for developer interface and CI integration |
| [@kb-labs/ai-review-analytics](./packages/analytics/) | Analytics schema and aggregator for tracking findings and metrics |

### Package Details

**@kb-labs/ai-review-core** provides the core review engine:
- Diff parsing and normalization
- Rule evaluation and matching
- Finding generation and categorization
- Result rendering (JSON, Markdown, HTML)
- Context building from profiles

**@kb-labs/ai-review-cli** provides the CLI interface:
- Command registration in `@kb-labs/cli`
- Context building commands
- Review execution commands
- Result rendering commands
- Analytics commands

**@kb-labs/ai-review-analytics** provides analytics:
- Findings schema and validation
- Run tracking and metadata
- Feedback collection
- Metrics aggregation
- Report generation

## 🛠️ Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development mode for selected packages |
| `pnpm build` | Build all packages |
| `pnpm build:clean` | Clean and build all packages |
| `pnpm test` | Run all tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:coverage` | Run tests with coverage reporting |
| `pnpm lint` | Lint all code |
| `pnpm lint:fix` | Fix linting issues |
| `pnpm format` | Format code with Prettier |
| `pnpm type-check` | TypeScript type checking |
| `pnpm check` | Run lint, type-check, and tests |
| `pnpm ci` | Full CI pipeline (clean, build, check) |
| `pnpm clean:all` | Clean all node_modules and build artifacts |
| `pnpm clean:analytics` | Clean analytics data |

## 📋 Development Policies

- **Code Style**: ESLint + Prettier, TypeScript strict mode
- **Testing**: Vitest with comprehensive test coverage
- **Versioning**: SemVer with automated releases through Changesets
- **Architecture**: Document decisions in ADRs (see `docs/adr/`)
- **Profile System**: Isolated rule sets with handbook, ADRs, and rules

## 🔧 Requirements

- **Node.js**: >= 18.18.0
- **pnpm**: >= 9.0.0

## 📚 Documentation

- [Documentation Standard](./docs/DOCUMENTATION.md) - Full documentation guidelines
- [Contributing Guide](./CONTRIBUTING.md) - How to contribute
- [Architecture Decisions](./docs/adr/) - ADRs for this project

**Guides:**
- [Migration Guide](./docs/MIGRATION.md) - Guide for migrating from legacy architecture
- [ADR-0001: Migrate to KB Labs Platform](./docs/adr/0001-migrate-to-kb-labs-platform.md) - Migration decision record
- [CLI README](./packages/cli/README.md) - CLI package documentation

**Platform ADRs:**
- [KB Labs Platform Sync/Drift Check](https://github.com/kirill-baranov/kb-labs-devkit#sync--drift-check) - DevKit sync and drift-check system
- [ESM-only Architecture](https://github.com/kirill-baranov/kb-labs-devkit#esm-only) - ESM-only module standard

## 🔗 Related Packages

### Dependencies

- [@kb-labs/core](https://github.com/KirillBaranov/kb-labs-core) - Core utilities
- [@kb-labs/shared](https://github.com/KirillBaranov/kb-labs-shared) - Shared utilities
- [@kb-labs/cli](https://github.com/KirillBaranov/kb-labs-cli) - CLI framework

### Used By

- All KB Labs projects for AI-powered code review
- CI/CD pipelines

### Ecosystem

- [KB Labs](https://github.com/KirillBaranov/kb-labs) - Main ecosystem repository

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines and contribution process.

## 📄 License

MIT © KB Labs

---

**See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines and contribution process.**
