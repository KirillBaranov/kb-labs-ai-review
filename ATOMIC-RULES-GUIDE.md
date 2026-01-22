# AI Review - Atomic Rules Guide

## Overview

Atomic Rules allow you to create modular, reusable review rules that can be composed together into presets. This provides an ESLint-style UX for managing code review conventions.

## Key Concepts

### Atomic Rule
A single Markdown file (`.md`) containing one specific rule or convention. Rules are organized by category in `.kb/ai-review/rules/`.

### Rule Categories

**Categories are fully dynamic!** You can create any category you want by adding a directory.

Built-in categories:
- `naming/` - Naming conventions (Pyramid Rule, TypeScript conventions)
- `architecture/` - Architecture patterns (V3 plugin system, layering)
- `security/` - Security rules (no-eval, input validation)
- `testing/` - Testing conventions
- `performance/` - Performance guidelines
- `errorHandling/` - Error handling patterns
- `consistency/` - Project consistency (DevKit configs, package.json)

**Create your own:** Just add a directory like `.kb/ai-review/rules/your-category/` and reference it in presets!

See [Custom Categories Guide](./CUSTOM-CATEGORIES-GUIDE.md) for details.

### Preset Composition
Presets use `atomicRules` field to include/exclude specific rules, which are then composed into the LLM analyzer context.

## Directory Structure

```
.kb/
  ai-review/
    presets/
      kb-labs-full.json       # Preset definition
      custom-preset.json
    rules/
      naming/
        pyramid-rule.md       # Atomic rule file
        typescript-naming.md
      architecture/
        v3-plugin-system.md
      security/
        no-eval.md
        input-validation.md
```

## Creating Atomic Rules

### 1. Create Rule File

Create a Markdown file in the appropriate category directory:

**File:** `.kb/ai-review/rules/naming/pyramid-rule.md`

```markdown
# Pyramid Rule

Package naming MUST follow `@kb-labs/{repo}-{package}` pattern.

**Rules:**
1. Folder name MUST match package name exactly
2. Scoped packages use `@kb-labs/` prefix
3. Multi-word names use kebab-case

**Examples:**

✅ Good:
@kb-labs/core-runtime      → kb-labs-core/packages/core-runtime/
@kb-labs/mind-engine       → kb-labs-mind/packages/mind-engine/

❌ Bad:
@kb-labs/runtime          → Wrong! Should be core-runtime
@kb-labs/mindEngine       → Wrong! Should be mind-engine (kebab-case)

**Why this matters:**
- Consistent naming across monorepo
- Easy to locate packages
- Clear ownership (repo → package)
```

### 2. Rule File Best Practices

**Structure:**
1. **Title** - Clear, descriptive heading
2. **Summary** - One-line rule statement
3. **Rules** - Numbered list of specific rules
4. **Examples** - Good ✅ and Bad ❌ examples
5. **Rationale** - Why this rule exists (optional)

**Keep Rules:**
- **Focused** - One rule per file
- **Clear** - No ambiguity
- **Actionable** - Specific guidance, not vague advice
- **Self-contained** - Doesn't require reading other rules

## Using Atomic Rules in Presets

### Minimal Preset

**File:** `.kb/ai-review/presets/my-preset.json`

```json
{
  "id": "my-preset",
  "name": "My Custom Preset",
  "extends": "default",
  "atomicRules": {
    "naming": {
      "include": ["pyramid-rule", "typescript-naming"]
    },
    "security": {
      "include": ["no-eval", "input-validation"]
    }
  }
}
```

### Full Preset with Exclusions

```json
{
  "id": "kb-labs-full",
  "name": "KB Labs Universal Review",
  "extends": "kb-labs",
  "llm": {
    "enabled": true,
    "analyzers": ["naming", "architecture", "security"]
  },
  "atomicRules": {
    "naming": {
      "include": ["pyramid-rule", "typescript-naming"],
      "exclude": []
    },
    "architecture": {
      "include": ["v3-plugin-system", "adapter-pattern"],
      "exclude": ["legacy-patterns"]
    },
    "security": {
      "include": ["no-eval", "input-validation", "file-access"]
    }
  }
}
```

### How It Works

1. **Preset loads** → Reads `atomicRules` field
2. **For each category** (naming, architecture, etc.):
   - Loads `.md` files listed in `include` array
   - Skips files listed in `exclude` array
   - Concatenates content with `\n\n` separator
3. **Composed text** → Injected into `context.conventions[category]`
4. **LLM analyzers** → Use conventions to check code

## Configuration in kb.config.json

**Location:** `profiles[].products.review`

```json
{
  "profiles": [
    {
      "id": "default",
      "products": {
        "review": {
          "defaultPreset": "kb-labs-full",
          "presetsDir": "ai-review/presets",
          "presets": [
            "ai-review/presets/kb-labs-full.json",
            "ai-review/presets/custom-preset.json"
          ]
        }
      }
    }
  ]
}
```

## Running Review

```bash
# Use default preset
pnpm kb review run

# Use specific preset
pnpm kb review run --preset=kb-labs-full

# Heuristic mode (ESLint only, fast)
pnpm kb review run --preset=kb-labs-full --mode=heuristic

# LLM mode (uses atomic rules from preset)
pnpm kb review run --preset=kb-labs-full --mode=llm

# Full mode (heuristic + LLM)
pnpm kb review run --preset=kb-labs-full --mode=full
```

## Example Atomic Rules

### Naming: Pyramid Rule

**File:** `.kb/ai-review/rules/naming/pyramid-rule.md`

See full content in previous example.

### Security: No Eval

**File:** `.kb/ai-review/rules/security/no-eval.md`

```markdown
# No Eval Rule

NEVER use `eval()`, `Function()`, or `vm.runInNewContext()`.

**Rules:**
1. Never use `eval()` or `new Function()`
2. Never use `vm.runInNewContext()`
3. Use safe alternatives (JSON.parse, Zod schemas)

**Examples:**

✅ Good:
const data = JSON.parse(jsonString);

❌ Bad:
eval(userInput);
new Function(userInput)();
```

## Benefits

### Modularity
- Each rule is self-contained
- Easy to add/remove rules
- Share rules across presets

### Maintainability
- Update rule once, affects all presets
- Clear separation of concerns
- Easy to review changes

### Flexibility
- Mix and match rules per preset
- Exclude rules without deleting them
- Override with inline conventions

### Discoverability
- All rules in one place (`.kb/ai-review/rules/`)
- Organized by category
- Easy to browse and understand

## Best Practices

### DO ✅
- Keep rules atomic (one rule = one file)
- Use clear, descriptive filenames
- Include examples for every rule
- Add rationale for non-obvious rules
- Test rules with real code

### DON'T ❌
- Mix multiple unrelated rules in one file
- Use vague language ("should be good", "try to avoid")
- Skip examples (LLM needs concrete guidance)
- Create overly complex rules (split them!)
- Forget to include in preset's `atomicRules`

## Troubleshooting

### Rule not loading?
1. Check filename matches exactly (case-sensitive!)
2. Verify file is in correct category directory
3. Ensure `atomicRules[category].include` lists the rule
4. Clear cache: `pnpm kb plugins clear-cache`
5. Rebuild: `pnpm --filter @kb-labs/review-core run build`

### LLM not following rule?
1. Make rule more specific (add examples)
2. Check rule is in correct category (naming vs architecture)
3. Ensure LLM analyzer for that category is enabled
4. Test with `--mode=llm` to see LLM-only results

### Conflicting rules?
- Use `exclude` array to disable specific rules
- Later rules override earlier ones
- Inline conventions in preset override atomic rules

## Future Enhancements

Potential improvements (not yet implemented):

- **Rule metadata** - Author, date, ADR references
- **Rule versioning** - Track rule changes over time
- **Rule dependencies** - Rules that depend on other rules
- **Rule templates** - Scaffolding for creating new rules
- **Rule validation** - Check rule syntax on save
- **Rule metrics** - Track which rules catch most issues

## Contributing

When adding new atomic rules:

1. Create rule file in appropriate category
2. Follow structure: Title → Summary → Rules → Examples → Rationale
3. Test rule with real code
4. Update this guide if adding new category
5. Consider adding to builtin presets

## See Also

- [Custom Presets Guide](./CUSTOM-PRESETS.md) - General preset customization
- [KB Labs Naming Conventions](../.kb/devkit/rules/naming.md) - DevKit naming rules
- [ESLint Rules](https://eslint.org/docs/rules/) - Similar modular rule concept
