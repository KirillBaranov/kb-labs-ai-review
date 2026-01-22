# KB Labs AI Review

AI-powered code review plugin for KB Labs platform.

## Overview

AI Review combines deterministic code analysis tools (ESLint, Ruff, Clippy) with LLM-powered semantic analysis to provide comprehensive code review feedback.

### Key Features

- **Unified Rule Contract** - All engines (heuristic/LLM) use same interface
- **Engine Type Priority** - Intelligent deduplication (compiler > linter > sast > ast > llm)
- **Three Review Modes** - heuristic (CI), full (local), llm (deep)
- **Content-Hash Caching** - Fast repeat analysis via State Broker
- **Agent Mode Gating** - Only certain+fixable+local findings shown to agents
- **Platform Integration** - Uses useLLM(), useCache(), useAnalytics()

## Quick Start

```bash
# Install and build
cd kb-labs-ai-review
pnpm install
pnpm run build

# Run code review (heuristic mode - fast, CI-friendly)
pnpm kb review run

# Full analysis (heuristic + LLM - best quality)
pnpm kb review run --mode=full

# Deep LLM-only analysis
pnpm kb review run --mode=llm

# Analyze specific scope
pnpm kb review run --scope=all        # All TypeScript/JavaScript files
pnpm kb review run --scope=changed    # Changed files (git diff)
pnpm kb review run --scope=staged     # Staged files (git add)

# Use specific preset
pnpm kb review run --preset=typescript-strict
pnpm kb review run --preset=react
pnpm kb review run --preset=security

# Analyze specific files
pnpm kb review run --files="src/**/*.ts"

# JSON output (for agents/CI)
pnpm kb review run --json
```

## Packages

This monorepo contains 4 packages:

### @kb-labs/review-contracts

Type definitions and contracts used across all packages.

**Key types:**
- `ReviewFinding` - Single code review finding
- `ReviewRule` - Rule definition
- `ReviewPreset` - Configuration preset
- `ReviewResult` - Complete review result
- `EngineType` - Engine categories (compiler/linter/sast/ast/llm)

[Documentation](./packages/review-contracts/README.md)

### @kb-labs/review-heuristic

Heuristic analysis engines for deterministic code analysis.

**Features:**
- ESLint adapter (TypeScript/JavaScript)
- Engine registry with type mappings
- Fingerprint-based deduplication
- Engine type priority system

[Documentation](./packages/review-heuristic/README.md)

### @kb-labs/review-core

Core orchestration logic coordinating heuristic engines, LLM analyzers, caching, and deduplication.

**Features:**
- ReviewOrchestrator for all three modes
- Platform composables integration
- Intelligent caching
- Analytics tracking

[Documentation](./packages/review-core/README.md)

### @kb-labs/review-cli

CLI commands for running code reviews.

**Commands:**
- `review:run` - Run code review analysis

[Documentation](./packages/review-cli/README.md)

## Architecture

### Review Modes

**heuristic (CI Mode)**
- Fast, deterministic analysis
- ESLint, Ruff, golangci-lint, Clippy
- No LLM calls
- Perfect for CI pipelines

**full (Local Mode)**
- Heuristic + LLM analysis
- Comprehensive coverage
- Cached LLM results
- Ideal for pre-PR review

**llm (Deep Analysis Mode)**
- LLM-only semantic analysis
- Naming, architecture, logic bugs
- Best quality, most expensive
- For complex refactoring

### Engine Type Priority

Deduplication uses engine TYPE priority, not specific tool priority:

1. **compiler** (priority 1) - TypeScript compiler, rustc, go build
2. **linter** (priority 2) - ESLint, Ruff, golangci-lint, Clippy, RuboCop
3. **sast** (priority 3) - Semgrep, CodeQL, Bandit
4. **ast** (priority 4) - tree-sitter (read-only AST)
5. **llm** (priority 5) - LLM-based heuristics

**Example:**
- TSC (compiler) beats ESLint (linter) for same issue
- ESLint (linter) beats Semgrep (sast) for same issue
- Ruff (Python linter) beats Bandit (Python SAST) for same issue

### Deduplication

Findings are deduplicated using:

1. **Fingerprint**: `sha1(ruleId|file|bucket|snippetHash)`
   - ruleId: Rule identifier
   - file: File path
   - bucket: Line bucket (lines 10-19 → bucket 1)
   - snippetHash: Optional hash of code snippet

2. **Engine Type Priority**: compiler > linter > sast > ast > llm

3. **Severity**: blocker > high > medium > low > info (if same type)

### Platform Integration

```typescript
import { useLLM, useCache, useAnalytics } from '@kb-labs/sdk';

// Access LLM with tier selection
const llm = useLLM({ tier: 'medium' });

// Access State Broker cache
const cache = useCache();

// Track analytics
const analytics = useAnalytics();
analytics.track('review:completed', { findings: 10 });
```

## Development

### Setup

```bash
# From kb-labs root directory
pnpm install

# Build all packages
pnpm --filter "@kb-labs/review-*" run build

# Or build in order
pnpm --filter @kb-labs/review-contracts run build
pnpm --filter @kb-labs/review-heuristic run build
pnpm --filter @kb-labs/review-core run build
pnpm --filter @kb-labs/review-cli run build
```

### Project Structure

```
kb-labs-ai-review/
├── packages/
│   ├── review-contracts/    # Type definitions
│   │   ├── src/types.ts
│   │   └── src/index.ts
│   │
│   ├── review-heuristic/    # Heuristic engines
│   │   ├── src/engine-registry.ts
│   │   ├── src/deduplication.ts
│   │   └── src/adapters/eslint-adapter.ts
│   │
│   ├── review-core/         # Orchestration
│   │   └── src/orchestrator.ts
│   │
│   └── review-cli/          # CLI commands
│       ├── src/commands/run.ts
│       ├── src/formatters/index.ts
│       └── src/manifest.ts
│
└── README.md (this file)
```

### Testing

```bash
# Test on kb-labs-plugin-template
cd /path/to/kb-labs-plugin-template
kb review run --mode=heuristic
```

## Roadmap

### Phase 1: Heuristic Layer ✅
- [x] Monorepo structure
- [x] Type definitions (review-contracts)
- [x] ESLint adapter (review-heuristic)
- [x] Orchestrator (review-core)
- [x] CLI commands (review-cli)
- [x] Built-in presets

### Phase 2: LLM Analyzers ✅
- [x] LLM analyzers (architecture, security, naming)
- [x] Full mode implementation
- [x] LLM mode implementation
- [x] Anti-hallucination verification
- [x] Content-hash caching

### Phase 3: CLI Integration ✅ (Current)
- [x] ctx.runtime.fs.glob() integration
- [x] InputFile → ParsedFile flow
- [x] Link dependencies (cross-repo)
- [ ] Test on real codebase
- [ ] CI/CD integration

### Phase 4: Future
- [ ] Ruff adapter (Python)
- [ ] golangci-lint adapter (Go)
- [ ] Clippy adapter (Rust)
- [ ] Mind RAG integration (dynamic examples)
- [ ] Agent-powered preset generation
- [ ] Auto-fix support
- [ ] Studio integration

## Design Decisions

### 1. Unified Rule Contract

All engines (heuristic and LLM) output the same `ReviewFinding` interface.

**Why:**
- Enables unified deduplication
- Consistent output format
- Easy to extend with new engines

### 2. Engine Type Priority (Not Tool Priority)

Instead of hardcoding "ESLint always wins", we use **engine type priority**.

**Why:**
- Language-agnostic
- Predictable (priority based on engine type)
- Easy to extend (add new tools without changing deduplication)
- Respects expertise (compilers > linters > SAST)

### 3. Content-Hash Based Caching

Cache keys include file content hashes for precise invalidation.

**Why:**
- Prevents stale cache (file changed → cache invalidated)
- Fast repeat analysis (no re-analysis if unchanged)
- Deterministic (same content → same cache key)

### 4. Agent Mode Gating

Only findings with `confidence='certain' + fix + scope='local' + automated=true` are shown to agents.

**Why:**
- Prevents agent hallucination (only certain findings)
- Reduces blast radius (only local fixes)
- Enables automation (only automated fixes)

### 5. Platform Composables (Not Direct Access)

Always use composables instead of direct platform access.

**Why:**
- Preserves prototype chain (methods available)
- Consistent API across plugins
- Future-proof (platform can change internals)

### 6. Three Review Modes

**heuristic**: Fast, deterministic, no LLM (CI pipelines)
**full**: Heuristic + LLM (local development)
**llm**: LLM-only (deep analysis)

**Why:**
- Flexibility (choose speed vs quality)
- Cost control (avoid LLM in CI)
- Use case driven (CI vs local vs deep)

## Related Documentation

- [AI Review Design](../docs/AI-REVIEW-DESIGN.md) - High-level design
- [AI Review Spec](../docs/AI-REVIEW-SPEC.md) - Implementation spec
- [V3 Plugin Guide](../kb-labs-plugin/docs/V3-PLUGIN-GUIDE.md) - Plugin architecture
- [Platform Composables](../kb-labs-sdk/README.md) - useLLM, useCache, etc.

## Contributing

Follow KB Labs plugin conventions:

1. **Package structure**: core/cli/contracts pattern
2. **Build**: tsup with ESM output
3. **Types**: Always generate .d.ts files
4. **Platform**: Use composables (useLLM, useCache, useAnalytics)
5. **Commands**: Use defineCommand() from @kb-labs/sdk
6. **Manifest**: Follow kb.plugin/3 schema

## License

MIT
