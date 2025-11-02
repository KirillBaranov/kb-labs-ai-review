# ADR-0009: Migrate to KB Labs Platform

**Date:** 2025-09-18
**Status:** Proposed → Accepted (upon kickoff)
**Deciders:** KB Labs Team
**Last Reviewed:** 2025-11-03
**Tags:** [migration, architecture, integration]

## Context

ai-review was bootstrapped rapidly and still carries legacy decisions including local types, ad-hoc logging, inline diff parsing, bespoke configuration, and direct provider wiring. Meanwhile, the KB Labs platform has matured with several key components:

- @kb-labs/devkit: unified tooling (tsconfig/eslint/vitest/tsup, reusable CI, agents, sync & drift-check)
- @kb-labs/core: low-level runtime/sys/config utilities (stable primitives)
- @kb-labs/shared: product-agnostic domain utilities (diff parsing, review types, textops, profiles schema)
- @kb-labs/cli: thin UX shell + command registry over platform APIs

ai-review should be refactored to consume these platform components instead of re-implementing them, enabling consistency across the ecosystem and reducing maintenance overhead.

## Decision

We will migrate ai-review to use the KB Labs platform components through a phased approach that:

- Converges on DevKit tooling across the repository (ESM-only, flat ESLint v9, Vitest, Tsup, TS NodeNext)
- Replaces legacy internals with Core/Shared building blocks
- Exposes CLI commands through @kb-labs/cli registry (avoiding product ↔ CLI circular dependencies)
- Enables sync + drift-check for agents, cursorrules, and editor baseline
- Prepares for future products (ai-docs, ai-tests) to reuse the same foundation

This migration will maintain existing product behavior and UX while modernizing the underlying architecture and tooling.

## Implementation

The migration will be implemented through a phased approach with the following target architecture:

**Target Architecture:**
- @kb-labs/core: sys (fs/repo detection, logging, redaction, env helpers), config (runtime loader/merging/resolution)
- @kb-labs/shared: diff (parseUnifiedDiff, added/removed lines, hunks, extractDiffFiles), review-types (Severity, Rule/RulesJson, Provider IO contracts, plan items), textops (token/byte limits, chunking, simple template utils), profiles (schema validation, loaders)
- @kb-labs/cli: core (parseArgs, context, presenters, error typing), commands (register review, build-context, render-*, etc., delegating to product APIs)
- ai-review: product-specific (static engine, provider adapters, rendering, rule evaluation, context builder; imports only from core/shared)

**Migration Plan (Phased):**

**Phase 0 — Preparation:**
- Create branch `chore/platform-migration`
- Add dev dependency: `pnpm add -D @kb-labs/devkit@github:KirillBaranov/kb-labs-devkit#main`
- Add sync script and CI drift-check (see Platform ADR-Drift Check)
- Run initial `pnpm sync` and commit `.kb/devkit/agents/`, `.cursorrules`, (optional) `.vscode/settings.json`

**Phase 1 — Tooling Convergence:**
- TypeScript: tsconfig.base.json extends @kb-labs/devkit/tsconfig/node.json
- ESLint: eslint.config.js imports @kb-labs/devkit/eslint/node.js
- Vitest: vitest.config.ts imports @kb-labs/devkit/vitest/node.js
- Tsup: tsup.config.ts imports @kb-labs/devkit/tsup/node.js
- Ensure ESM-only, proper exports with import and types

**Phase 2 — Move neutral code to Shared:**
Migrate (or replace usages with imports from @kb-labs/shared):
- Diff utilities: parsing, added/removed/hunks, file extraction
- Review types & provider IO contracts
- Textops primitives (if any local): token limits, chunking helpers
- Profiles schema/loader (rules/boundaries)

**Phase 3 — Replace infra with Core:**
- Logging → @kb-labs/core-sys/logging (via @kb-labs/core umbrella)
- Repo/fs utils → @kb-labs/core-sys/repo|fs
- Config runtime → @kb-labs/core-config/runtime (normalization, provider options, paths, defaults)

**Phase 4 — Provider Adapters & Static Engine:**
- Isolate provider interfaces to product adapters (openai/claude/mock/local) consuming Shared types
- Static engine consumes Shared diff & rule types; emits Shared findings/llm_tasks
- Wire product-level analytics/debug to Core logging (pluggable sinks later)

**Phase 5 — CLI Integration (no circular deps):**
- Register product commands in @kb-labs/cli-commands (product-specific package or module)
- Commands call ai-review exported APIs (not vice versa)
- Presenters (json/text) come from @kb-labs/cli-core

**Phase 6 — Tests & Coverage:**
- Unit tests colocated (__tests__) per module
- Minimal smoke for CLI paths (json/text)
- Target ≥90% stmts; critical branches around config/provider selection covered

**Phase 7 — Docs & ADR:**
- Update README with new import surfaces & CLI usage
- Add link to platform ADRs (Sync/Drift, ESM-only) and this migration ADR
- Add MIGRATION.md (old → new module paths, removal notes)

**Acceptance Criteria:**
- `pnpm check` green: lint + type-check + tests
- `pnpm -r build` succeeds; artifacts ESM-only
- Drift-check passes (no local edits of DevKit-managed assets)
- ai-review exports public APIs using Shared types; no duplicate infra
- CLI commands run via @kb-labs/cli presenters and return stable JSON envelope

**Timeline (suggested):**
- Day 1: Phase 1–2 (tooling, move neutral code)
- Day 2: Phase 3–4 (core infra swap, adapters/engine)
- Day 3: Phase 5–6 (CLI wiring, tests)
- Day 4: Phase 7 (docs, cleanups), release PR

## Consequences

**Positive:**
- Unified tooling and configuration across the KB Labs ecosystem
- Reduced maintenance overhead by leveraging shared platform components
- Improved consistency and reliability through standardized tooling
- Better separation of concerns with clear boundaries between platform and product code
- Enhanced developer experience with unified CLI and drift-check capabilities
- Foundation for future products to reuse the same architecture

**Negative:**
- Breaking changes to import paths and CLI flag normalization
- Migration complexity requiring careful coordination across multiple phases
- Temporary disruption during the migration process
- Need to maintain backward compatibility during transition period
- Risk of introducing bugs during the refactoring process

**Mitigation Strategies:**
- Keep compatible aliases for one minor release if feasible
- Document all changes in MIGRATION.md with clear migration paths
- Provide codemod hints in README for automated migration assistance
- Maintain rollback capability by reverting to branch pre-Phase 2
- Since infrastructure is isolated, rollback risk is low

**Follow-ups:**
- Unify provider metrics & debug sinks across products (Core sinks)
- Introduce caching layer for context generation
- Optional: codemod script to rewrite imports during migration
