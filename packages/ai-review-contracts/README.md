# @kb-labs/ai-review-contracts

Public contracts for KB Labs AI Review: artifacts, commands, workflows, and schemas.

## Vision & Purpose

**@kb-labs/ai-review-contracts** provides public contracts for KB Labs AI Review. It describes the artifacts, command/workflow IDs, payload schemas, and helper parsers that other KB Labs surfaces consume.

### Core Goals

- **Contract Definition**: Define public contracts for AI Review
- **Schema Validation**: Zod schemas for validation
- **Type Safety**: TypeScript types derived from schemas
- **Versioning**: SemVer-based contract versioning

## Package Status

- **Version**: 0.0.1
- **Stage**: Stable
- **Status**: Production Ready ✅

## Architecture

### High-Level Overview

```
AI Review Contracts
    │
    ├──► Contract Manifest
    ├──► Zod Schemas
    ├──► TypeScript Types
    └──► Helper Parsers
```

### Key Components

1. **Contract Manifest** (`contract.ts`): Plugin contracts manifest
2. **Schemas** (`schema/`): Zod validation schemas
3. **Types** (`types.ts`): TypeScript type definitions
4. **Parsers** (`schema.ts`): Helper parsers

## ✨ Features

- **Contract Manifest**: Canonical manifest with artifact + command/workflow metadata
- **Zod Schemas**: Validation schemas for `AiReviewRun`, findings, risk score
- **TypeScript Types**: Type definitions for command inputs/outputs
- **Helper Parsers**: `parseAiReviewRun`, `parseAiReviewCommandOutput`
- **Versioning**: SemVer-based contract versioning

## 📦 API Reference

### Main Exports

#### Contract Manifest

- `pluginContractsManifest`: Canonical manifest with artifact + command/workflow metadata
- `contractsVersion`: SemVer version for contract coordination
- `contractsSchemaId`: Schema ID for contract validation

#### Schemas

- `AiReviewRunSchema`: AI Review run schema
- `parseAiReviewRun`: Parse AI Review run
- `parseAiReviewCommandOutput`: Parse command output

#### Types

- `AiReviewRun`: AI Review run type
- `ReviewFinding`: Review finding type
- `RiskScore`: Risk score type

## 🔧 Configuration

### Configuration Options

No configuration needed - pure contract definitions.

## 🔗 Dependencies

### Runtime Dependencies

- `zod` (`^3.23.8`): Schema validation

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
├── contracts.manifest.test.ts
├── schema.spec.ts
└── schema.test.ts
```

### Test Coverage

- **Current Coverage**: ~70%
- **Target Coverage**: 90%

## 📈 Performance

### Performance Characteristics

- **Time Complexity**: O(1) for type operations, O(n) for schema validation
- **Space Complexity**: O(1)
- **Bottlenecks**: Schema validation for large payloads

## 🔒 Security

### Security Considerations

- **Schema Validation**: Input validation via Zod schemas
- **Type Safety**: TypeScript type safety

### Known Vulnerabilities

- None

## 🐛 Known Issues & Limitations

### Known Issues

- None currently

### Limitations

- **Schema Validation**: Basic validation only

### Future Improvements

- **Enhanced Validation**: More validation rules

## 🔄 Migration & Breaking Changes

### Versioning Rules

| Change | Bump |
| ------ | ---- |
| Breaking change to artifacts/command/workflow or payload shape | **MAJOR** |
| Backwards-compatible additions (new fields/artifacts/commands) | **MINOR** |
| Documentation or metadata updates | **PATCH** |

### Breaking Changes in Future Versions

- None planned

## 📚 Examples

### Example 1: Use Contract Manifest

```typescript
import { pluginContractsManifest } from '@kb-labs/ai-review-contracts';

const artifactId = pluginContractsManifest.artifacts['ai-review.review.json'].id;
```

### Example 2: Parse AI Review Run

```typescript
import { parseAiReviewRun } from '@kb-labs/ai-review-contracts';

const run = parseAiReviewRun(jsonPayload);
```

### Example 3: Use Types

```typescript
import type { AiReviewRun } from '@kb-labs/ai-review-contracts';

function processRun(run: AiReviewRun) {
  // Type-safe processing
}
```

## 🤝 Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development guidelines.

## 📄 License

MIT © KB Labs
