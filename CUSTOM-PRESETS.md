# KB Labs AI Review - Custom Presets Guide

## Quick Start

### 1. Create custom preset in `.kb/kb.config.json`

```json
{
  "review": {
    "defaultPreset": "my-company",
    
    "presets": [
      {
        "id": "my-company",
        "name": "My Company Rules",
        "description": "Custom rules for our codebase",
        
        // Inherit from kb-labs preset
        "extends": "kb-labs",
        
        // Override specific rules
        "engines": {
          "eslint": {
            "enabled": true,
            "config": {
              "rules": {
                // Add your custom ESLint rules
                "no-console": "error",
                "@typescript-eslint/explicit-module-boundary-types": "error"
              }
            }
          }
        },
        
        // LLM analyzers configuration
        "llm": {
          "enabled": true,
          "analyzers": ["naming", "architecture", "pyramid"]
        },
        
        // Custom naming and architecture conventions
        "context": {
          "projectType": "monorepo",
          "framework": "nodejs",
          "language": "typescript",
          "conventions": {
            "naming": "Use @company/{repo}-{package} pattern. Interfaces prefixed with I.",
            "architecture": "Use Clean Architecture. Domain layer must not depend on infrastructure.",
            "security": "All API inputs must be validated with Zod schemas."
          },
          "adrs": [
            "ADR-001: Use Clean Architecture",
            "ADR-002: Pyramid naming rule"
          ]
        },
        
        "include": ["**/src/**/*.ts"],
        "exclude": ["**/*.test.ts", "**/__tests__/**"]
      }
    ]
  }
}
```

### 2. Create custom LLM analyzer (optional)

Create `.kb/review/analyzers/pyramid-analyzer.ts`:

```typescript
import { BaseLLMAnalyzer } from '@kb-labs/review-contracts';
import type { ReviewFinding, ParsedFile, ReviewContext } from '@kb-labs/review-contracts';
import { useLLM } from '@kb-labs/sdk';

export class PyramidAnalyzer extends BaseLLMAnalyzer {
  readonly id = 'pyramid';
  readonly name = 'Pyramid Naming Rule';

  async analyze(files: ParsedFile[], context: ReviewContext): Promise<ReviewFinding[]> {
    const findings: ReviewFinding[] = [];
    const llm = useLLM({ tier: 'small' });

    if (!llm?.chatWithTools) {
      throw new Error('LLM not configured');
    }

    for (const file of files) {
      // Build prompt with Pyramid Rule
      const systemPrompt = `You are a code reviewer checking Pyramid Rule compliance.

Pyramid Rule: @company/{repo}-{package}
- Package names MUST follow pattern: @company/{repo}-{package}
- Folder names MUST match package name exactly
- Examples:
  - ✅ @company/auth-api
  - ✅ @company/auth-contracts
  - ❌ @company/api (missing repo prefix)

Check imports and package.json references.`;

      const userPrompt = `Review this file for Pyramid Rule violations:\n\n${file.content}`;

      const response = await llm.chatWithTools(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        {
          tools: [{
            name: 'report_pyramid_violation',
            description: 'Report a Pyramid Rule violation',
            inputSchema: {
              type: 'object',
              properties: {
                line: { type: 'number' },
                message: { type: 'string' },
                suggestion: { type: 'string' },
              },
              required: ['line', 'message', 'suggestion'],
            },
          }],
          temperature: 0.2,
        }
      );

      // Process tool calls
      for (const call of response.toolCalls || []) {
        const args = call.input as any;
        
        findings.push({
          id: this.buildFindingId(file, args.line, 'pyramid'),
          ruleId: 'pyramid:naming',
          type: 'style',
          severity: 'error',
          confidence: 'heuristic',
          file: file.path,
          line: args.line,
          message: args.message,
          suggestion: args.suggestion,
          rationale: 'Violates Pyramid naming rule',
          engine: 'llm',
          source: 'llm-pyramid',
          scope: 'local',
          automated: false,
        });
      }
    }

    return findings;
  }
}
```

### 3. Run review with your preset

```bash
# Use custom preset
pnpm kb review run --preset=my-company

# Use full mode (heuristic + LLM)
pnpm kb review run --preset=my-company --mode=full

# Scope to specific path
pnpm kb review run --preset=my-company --scope="packages/auth/**"
```

## Preset Inheritance

You can extend from builtin presets:

- `default` - Balanced rules
- `typescript-strict` - Strict TypeScript
- `react` - React best practices
- `security` - Security-focused
- `kb-labs` - KB Labs monorepo rules
- `kb-labs-strict` - Maximum strictness

Example:

```json
{
  "id": "my-strict",
  "extends": "kb-labs-strict",
  "context": {
    "conventions": {
      "naming": "Even stricter than kb-labs-strict!"
    }
  }
}
```

## Directory Structure

```
.kb/
  review/
    analyzers/          # Custom LLM analyzers (.ts)
      pyramid-analyzer.ts
      custom-analyzer.ts
    presets/            # Custom presets (.json)
      my-preset.json
```

## Export BaseLLMAnalyzer

The `BaseLLMAnalyzer` class is available in `@kb-labs/review-contracts` for creating custom analyzers.

```typescript
import { BaseLLMAnalyzer } from '@kb-labs/review-contracts';
```

This ensures users can extend it without depending on internal packages.
