# AI Review - Quick Start Guide

## 1. Basic Usage

```bash
# Review all files (heuristic mode - fast, ESLint only)
pnpm kb review run --files="src/**/*.ts"

# Review with LLM (deep analysis)
pnpm kb review run --mode=llm --files="src/**/*.ts"

# Review staged files
pnpm kb review run --scope=staged

# Review changed files (vs main branch)
pnpm kb review run --scope=changed
```

## 2. Create Custom Preset

Edit `.kb/kb.config.json`:

```json
{
  "profiles": [{
    "id": "default",
    "products": {
      "review": {
        "defaultPreset": "my-rules",
        "presets": [{
          "id": "my-rules",
          "name": "My Custom Rules",
          "extends": "kb-labs",
          "llm": {
            "enabled": true,
            "analyzers": ["naming", "architecture", "security"]
          },
          "context": {
            "conventions": {
              "naming": "Your naming rules. Be specific. Give examples.",
              "architecture": "Your architecture patterns. Reference ADRs.",
              "security": "Your security requirements. List what to check."
            }
          }
        }]
      }
    }
  }]
}
```

## 3. Use Your Preset

```bash
# Clear cache after config changes
pnpm kb plugins clear-cache

# Use your preset
pnpm kb review run --preset=my-rules --mode=llm --files="src/**/*.ts"
```

## 4. Review Modes

| Mode | Speed | Engines | When to Use |
|------|-------|---------|-------------|
| `heuristic` | ⚡ Fast | ESLint only | CI/CD, quick feedback |
| `full` | 🐌 Medium | ESLint + static | Local dev, pre-commit |
| `llm` | 🐌🐌 Slow | ESLint + LLM | Pre-PR, deep review |

## 5. Preset Inheritance

Extend built-in presets:

- `default` - Basic rules
- `kb-labs` - KB Labs conventions (Pyramid Rule)
- `typescript-strict` - Strict TypeScript
- `node-backend` - Node.js backend
- `react-frontend` - React frontend

```json
{
  "id": "my-preset",
  "extends": "typescript-strict",
  "context": {
    "conventions": {
      "naming": "Additional rules on top of typescript-strict"
    }
  }
}
```

**Deep merge**: Child preset merges with parent (objects merged, arrays concatenated).

## 6. Writing Good Conventions

❌ **Bad** (vague):
```json
{
  "naming": "Use good names"
}
```

✅ **Good** (specific with examples):
```json
{
  "naming": "Interfaces start with I (IUserConfig, IPlugin). Classes use PascalCase. Functions use camelCase. Constants UPPER_SNAKE_CASE. Example: class UserService implements IUserService { ... }"
}
```

## 7. Example: Pyramid Rule Preset

```json
{
  "id": "kb-labs-pyramid",
  "extends": "kb-labs",
  "context": {
    "conventions": {
      "naming": "Pyramid Rule: @kb-labs/{repo}-{package}. Package names MUST match folder names. Interfaces prefixed with I. Examples: @kb-labs/core-runtime, @kb-labs/mind-engine.",
      "architecture": "V3 plugin system with strict separation. No circular dependencies. Plugin execution in sandbox.",
      "security": "No eval(). Validate all inputs. Sandbox fs access outside allowed paths."
    },
    "adrs": [
      "Pyramid Rule: Package naming @kb-labs/{repo}-{package}",
      "ADR-0046: LLM Router for tier selection"
    ]
  }
}
```

## 8. Troubleshooting

**Preset not loading?**
```bash
# 1. Clear cache
pnpm kb plugins clear-cache

# 2. Check config is in profiles[].products.review (not root!)
# 3. Validate JSON syntax
```

**LLM not running?**
```bash
# Use --mode=llm
pnpm kb review run --mode=llm --files="src/**/*.ts"

# Check preset has llm.enabled: true
```

**Command not found?**
```bash
# Rebuild review-cli
pnpm --filter @kb-labs/review-cli run build

# Clear cache
pnpm kb plugins clear-cache
```

## 9. CLI Flags Reference

```bash
--mode=<mode>           # heuristic|full|llm (default: heuristic)
--scope=<scope>         # all|changed|staged (default: changed)
--preset=<id>           # Preset ID from config
--files=<pattern>       # File glob pattern
--json                  # JSON output
```

## 10. Next Steps

- **Full Guide**: See [CUSTOM-PRESETS.md](./CUSTOM-PRESETS.md)
- **Examples**: See [Built-in Presets](./packages/review-core/src/presets/)
- **Custom Analyzers**: See [LLM Analyzers](./packages/review-llm/src/analyzers/)

---

**Pro Tip**: Start with `--mode=heuristic` for fast feedback, then use `--mode=llm` before creating PR.
