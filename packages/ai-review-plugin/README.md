# @kb-labs/ai-review-plugin

Runtime implementation for KB Labs AI Review. This package wires together providers, core heuristics, contracts, CLI commands, and workflow helpers.

## Vision & Purpose

**@kb-labs/ai-review-plugin** provides runtime implementation for KB Labs AI Review. It wires together providers, core heuristics, contracts, CLI commands, and workflow helpers.

### Core Goals

- **Profile Context**: Build profile context (handbook + rules + ADR)
- **Provider Integration**: Run providers (local/mock) to produce AiReviewRun payload
- **Artifact Generation**: Write transport JSON/Markdown artifacts and human-readable reports
- **CLI Commands**: Provide `ai-review:run` command
- **Workflow Helpers**: Provide `runAiReviewWorkflow` helper

## Package Status

- **Version**: 0.0.1
- **Stage**: Stable
- **Status**: Production Ready ✅

## Architecture

### High-Level Overview

```
AI Review Plugin
    │
    ├──► CLI Commands
    ├──► Workflow Helpers
    ├──► Runtime Services
    └──► Artifact Management
```

### Key Components

1. **CLI Commands** (`cli/commands/`): CLI command implementations
2. **Runtime Services** (`runtime/`): Review service, workflow, artifacts, context, profile
3. **Manifest** (`manifest.v2.ts`): Plugin manifest definition

## ✨ Features

- **Profile Context**: Build profile context under `.ai-review/context/<profile>.md`
- **Provider Integration**: Run providers (local/mock) to produce AiReviewRun payload
- **Artifact Generation**: Write transport JSON/Markdown artifacts and human-readable Markdown + optional HTML
- **CLI Command**: `ai-review:run` command
- **Workflow Helper**: `runAiReviewWorkflow` workflow step

## 📦 API Reference

### Main Exports

#### CLI Commands

- `runAiReviewCommand`: Run AI Review command

#### Workflow Helpers

- `runAiReviewWorkflow`: Run AI Review workflow step

#### Runtime Services

- `ReviewService`: Review service implementation
- `Workflow`: Workflow implementation
- `Artifacts`: Artifact management
- `Context`: Review context
- `Profile`: Profile management

## 🔧 Configuration

### Configuration Options

All configuration via CLI flags and kb-labs.config.json.

### CLI Flags

- `--diff`: Diff file path
- `--profile`: Profile name
- `--output`: Output directory

## 🔗 Dependencies

### Runtime Dependencies

- `@kb-labs/ai-review-contracts` (`workspace:*`): AI Review contracts
- `@kb-labs/ai-review-core` (`workspace:*`): AI Review core
- `@kb-labs/ai-review-providers` (`workspace:*`): AI Review providers
- `@kb-labs/plugin-manifest` (`link:../../../kb-labs-plugin/packages/manifest`): Plugin manifest
- `picomatch` (`^4.0.3`): Pattern matching
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
├── review-service.test.ts
└── workflow.test.ts
```

### Test Coverage

- **Current Coverage**: ~60%
- **Target Coverage**: 90%

## 📈 Performance

### Performance Characteristics

- **Time Complexity**: O(n) for review execution, O(1) for command registration
- **Space Complexity**: O(n) where n = diff size
- **Bottlenecks**: Large diff processing

## 🔒 Security

### Security Considerations

- **Input Validation**: Command input validation
- **Path Validation**: Path validation for file operations

### Known Vulnerabilities

- None

## 🐛 Known Issues & Limitations

### Known Issues

- None currently

### Limitations

- **Provider Types**: Fixed provider types (local/mock)
- **Output Formats**: Fixed output formats

### Future Improvements

- **More Providers**: Additional provider types
- **Custom Output Formats**: Custom output format support

## 🔄 Migration & Breaking Changes

### Migration from Previous Versions

No breaking changes in current version (0.0.1).

### Breaking Changes in Future Versions

- None planned

## 📚 Examples

### Example 1: Run AI Review Command

```typescript
import { runAiReviewCommand } from '@kb-labs/ai-review-plugin';

await runAiReviewCommand({
  diff: 'changes.diff',
  profile: 'frontend',
});
```

### Example 2: Use Workflow Helper

```typescript
import { runAiReviewWorkflow } from '@kb-labs/ai-review-plugin';

await runAiReviewWorkflow({
  diff: 'changes.diff',
  profile: 'frontend',
});
```

## 🤝 Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development guidelines.

## 📄 License

MIT © KB Labs
