# @kb-labs/ai-review-core

Core building blocks for KB Labs AI Review. The package contains unified diff parsing adapters, static analysis heuristics, normalization helpers, and Markdown rendering utilities.

## Vision & Purpose

**@kb-labs/ai-review-core** provides core building blocks for KB Labs AI Review. It includes unified diff parsing adapters, static analysis heuristics, normalization helpers, and Markdown rendering utilities.

### Core Goals

- **Diff Parsing**: Unified diff parsing adapters
- **Static Analysis**: Heuristics for diff analysis
- **Normalization**: Fingerprints, severity grouping, risk scoring
- **Markdown Rendering**: Human-readable report generation

## Package Status

- **Version**: 0.0.1
- **Stage**: Stable
- **Status**: Production Ready ✅

## Architecture

### High-Level Overview

```
AI Review Core
    │
    ├──► Diff Parsing
    ├──► Static Analysis
    ├──► Normalization
    └──► Markdown Rendering
```

### Key Components

1. **Diff Adapter** (`lib/diff-adapter.ts`): Unified diff parsing adapters
2. **Engine** (`lib/engine.ts`): Static analysis heuristics
3. **Normalize** (`lib/normalize.ts`): Normalization helpers
4. **Render MD** (`lib/render-md.ts`): Markdown rendering utilities
5. **Render Config** (`lib/render-config.ts`): Render configuration
6. **Risk** (`lib/risk.ts`): Risk scoring
7. **Boundaries** (`lib/boundaries.ts`): Boundary analysis

## ✨ Features

- **Unified Diff Parsing**: `parsedDiffToFileDiffs` adapter
- **Static Analysis**: `analyzeDiff` heuristics
- **Normalization**: Fingerprints, severity grouping, risk scoring
- **Markdown Rendering**: Human-readable report generation
- **Boundary Analysis**: Module boundary checking

## 📦 API Reference

### Main Exports

#### Diff Parsing

- `parsedDiffToFileDiffs`: Parse unified diff to file diffs

#### Static Analysis

- `analyzeDiff`: Analyze diff with heuristics

#### Normalization

- Normalization helpers for fingerprints, severity grouping

#### Markdown Rendering

- `renderMarkdown`: Render human-readable Markdown reports

#### Risk Scoring

- Risk scoring utilities

## 🔧 Configuration

### Configuration Options

All configuration via function parameters.

## 🔗 Dependencies

### Runtime Dependencies

- `@kb-labs/shared-diff` (`link:../../../kb-labs-shared/packages/diff`): Diff parsing
- `@kb-labs/shared-review-types` (`link:../../../kb-labs-shared/packages/review-types`): Review types
- `@kb-labs/core-sys` (`link:../../../kb-labs-core/packages/sys`): Core system
- `ajv` (`^8.17.1`): JSON schema validation
- `ajv-formats` (`^3.0.1`): AJV formats
- `picomatch` (`^4.0.2`): Pattern matching
- `yaml` (`^2.8.0`): YAML parsing

### Development Dependencies

- `@kb-labs/devkit` (`link:../../../kb-labs-devkit`): DevKit presets
- `@types/node` (`^20.16.10`): Node.js types
- `@types/picomatch` (`^4.0.2`): Picomatch types
- `tsup` (`^8.1.0`): TypeScript bundler
- `typescript` (`^5.6.3`): TypeScript compiler
- `vitest` (`^3.2.4`): Test runner

## 🧪 Testing

### Test Structure

```
tests/
└── engine.test.ts
```

### Test Coverage

- **Current Coverage**: ~65%
- **Target Coverage**: 90%

## 📈 Performance

### Performance Characteristics

- **Time Complexity**: O(n) for diff parsing, O(n) for analysis
- **Space Complexity**: O(n) where n = diff size
- **Bottlenecks**: Large diff processing

## 🔒 Security

### Security Considerations

- **Input Validation**: Diff input validation
- **Path Validation**: Path validation for file operations

### Known Vulnerabilities

- None

## 🐛 Known Issues & Limitations

### Known Issues

- None currently

### Limitations

- **Diff Size**: Performance degrades with very large diffs
- **Heuristics**: Static analysis heuristics are basic

### Future Improvements

- **More Heuristics**: Additional static analysis heuristics
- **Performance**: Optimize for large diffs

## 🔄 Migration & Breaking Changes

### Migration from Previous Versions

No breaking changes in current version (0.0.1).

### Breaking Changes in Future Versions

- None planned

## 📚 Examples

### Example 1: Parse Diff

```typescript
import { parsedDiffToFileDiffs } from '@kb-labs/ai-review-core';

const fileDiffs = parsedDiffToFileDiffs(unifiedDiff);
```

### Example 2: Analyze Diff

```typescript
import { analyzeDiff } from '@kb-labs/ai-review-core';

const findings = analyzeDiff(fileDiffs, rules);
```

### Example 3: Render Markdown

```typescript
import { renderMarkdown } from '@kb-labs/ai-review-core';

const markdown = renderMarkdown(findings, config);
```

## 🤝 Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development guidelines.

## 📄 License

MIT © KB Labs
