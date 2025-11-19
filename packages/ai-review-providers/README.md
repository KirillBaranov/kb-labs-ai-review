# @kb-labs/ai-review-providers

Provider implementations (local/mock) for KB Labs AI Review.

## Vision & Purpose

**@kb-labs/ai-review-providers** provides provider implementations for KB Labs AI Review. It includes local (deterministic rule-based) and mock (lightweight stub) providers.

### Core Goals

- **Local Provider**: Deterministic rule-based provider powered by core heuristics
- **Mock Provider**: Lightweight stub for tests, demos, and playgrounds
- **Run Builder**: Build review runs from provider results
- **Summary Computation**: Compute review summaries

## Package Status

- **Version**: 0.0.1
- **Stage**: Stable
- **Status**: Production Ready ✅

## Architecture

### High-Level Overview

```
AI Review Providers
    │
    ├──► Local Provider
    ├──► Mock Provider
    ├──► Run Builder
    └──► Summary Computation
```

### Key Components

1. **Local Provider** (`local.ts`): Deterministic rule-based provider
2. **Mock Provider** (`mock.ts`): Lightweight stub provider
3. **Run Builder** (`run-builder.ts`): Build review runs
4. **Types** (`types.ts`): Provider types

## ✨ Features

- **Local Provider**: Deterministic rule-based provider powered by `@kb-labs/ai-review-core` heuristics
- **Mock Provider**: Lightweight stub used in tests, demos, and playgrounds
- **Run Builder**: Build review runs from provider results
- **Summary Computation**: Compute review summaries

## 📦 API Reference

### Main Exports

#### Providers

- `localProvider`: Deterministic rule-based provider
- `mockProvider`: Lightweight stub provider

#### Utilities

- `buildRun`: Build review run from provider results
- `computeSummary`: Compute review summary

#### Types

- `ReviewProvider`: Provider interface
- `ProviderReviewInput`: Provider review input type

## 🔧 Configuration

### Configuration Options

All configuration via provider options.

## 🔗 Dependencies

### Runtime Dependencies

- `@kb-labs/ai-review-contracts` (`workspace:*`): AI Review contracts
- `@kb-labs/ai-review-core` (`workspace:*`): AI Review core
- `@kb-labs/shared-review-types` (`link:../../../kb-labs-shared/packages/review-types`): Review types

### Development Dependencies

- `@kb-labs/devkit` (`link:../../../kb-labs-devkit`): DevKit presets
- `@types/node` (`^20.16.10`): Node.js types
- `tsup` (`^8.1.0`): TypeScript bundler
- `typescript` (`^5.6.3`): TypeScript compiler
- `vitest` (`^3.2.4`): Test runner

## 🧪 Testing

### Test Structure

```
tests/
├── local.test.ts
└── mock.test.ts
```

### Test Coverage

- **Current Coverage**: ~70%
- **Target Coverage**: 90%

## 📈 Performance

### Performance Characteristics

- **Time Complexity**: O(n) for provider review, O(1) for run building
- **Space Complexity**: O(n) where n = diff size
- **Bottlenecks**: Large diff processing

## 🔒 Security

### Security Considerations

- **Input Validation**: Provider input validation
- **Path Validation**: Path validation for file operations

### Known Vulnerabilities

- None

## 🐛 Known Issues & Limitations

### Known Issues

- None currently

### Limitations

- **Provider Types**: Fixed provider types (local/mock)
- **Heuristics**: Static analysis heuristics are basic

### Future Improvements

- **More Providers**: Additional provider types
- **Enhanced Heuristics**: More sophisticated heuristics

## 🔄 Migration & Breaking Changes

### Migration from Previous Versions

No breaking changes in current version (0.0.1).

### Breaking Changes in Future Versions

- None planned

## 📚 Examples

### Example 1: Use Local Provider

```typescript
import { localProvider } from '@kb-labs/ai-review-providers';

const run = await localProvider.review({
  diffText,
  profile: 'frontend',
  rules,
  boundaries,
});
```

### Example 2: Use Mock Provider

```typescript
import { mockProvider } from '@kb-labs/ai-review-providers';

const run = await mockProvider.review({
  diffText,
  profile: 'frontend',
});
```

### Example 3: Build Run

```typescript
import { buildRun, computeSummary } from '@kb-labs/ai-review-providers';

const run = buildRun(findings, metadata);
const summary = computeSummary(run);
```

## 🤝 Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development guidelines.

## 📄 License

MIT © KB Labs
