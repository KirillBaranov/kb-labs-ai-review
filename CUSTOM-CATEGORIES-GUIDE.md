# Custom Categories Guide

## Overview

AI Review supports **fully dynamic categories**. You can create your own categories without modifying any code - just create a directory and add rules!

## How It Works

Categories are defined by the directory structure in `.kb/ai-review/rules/`:

```
.kb/ai-review/rules/
  ├── naming/              ← Built-in category
  ├── architecture/        ← Built-in category
  ├── security/            ← Built-in category
  ├── consistency/         ← Built-in category
  └── your-category/       ← Your custom category!
      ├── rule-one.md
      └── rule-two.md
```

## Creating a Custom Category

### Step 1: Create Directory

```bash
mkdir -p .kb/ai-review/rules/your-category
```

### Step 2: Add Rules

Create `.md` files in your category directory:

**File:** `.kb/ai-review/rules/your-category/example-rule.md`

```markdown
# Example Rule

Description of your rule.

**Rules:**
1. Rule statement one
2. Rule statement two

**Examples:**

✅ Good:
[example]

❌ Bad:
[example]
```

### Step 3: Use in Preset

Add your category to `atomicRules` in your preset:

**File:** `.kb/ai-review/presets/my-preset.json`

```json
{
  "id": "my-preset",
  "name": "My Custom Preset",
  "atomicRules": {
    "your-category": {
      "include": ["example-rule"]
    }
  }
}
```

That's it! The system will automatically:
1. Load rules from `your-category/` directory
2. Compose them into `context.conventions.your-category`
3. Pass to LLM analyzers

## Real-World Examples

### Example 1: Documentation Category

**Use case:** Enforce documentation standards

```bash
mkdir -p .kb/ai-review/rules/documentation
```

**File:** `.kb/ai-review/rules/documentation/jsdoc-required.md`

```markdown
# JSDoc Required

All exported functions and classes MUST have JSDoc comments.

**Rules:**
1. Export functions: MUST have `@param` and `@returns`
2. Export classes: MUST have description
3. Public methods: MUST be documented

**Example:**

✅ Good:
/**
 * Validates user input
 * @param input - User input object
 * @returns Validated data or throws error
 */
export function validateInput(input: unknown) { }

❌ Bad:
export function validateInput(input: unknown) { }
```

**Preset:**
```json
{
  "atomicRules": {
    "documentation": {
      "include": ["jsdoc-required", "readme-required"]
    }
  }
}
```

### Example 2: API Design Category

**Use case:** Enforce REST API conventions

```bash
mkdir -p .kb/ai-review/rules/api-design
```

**Rules:**
- `restful-endpoints.md` - RESTful URL patterns
- `error-responses.md` - Standard error format
- `versioning.md` - API versioning strategy
- `rate-limiting.md` - Rate limit headers

**Preset:**
```json
{
  "atomicRules": {
    "api-design": {
      "include": ["restful-endpoints", "error-responses", "versioning"],
      "exclude": ["rate-limiting"]  // Not needed in this project
    }
  }
}
```

### Example 3: Database Category

**Use case:** Database best practices

```bash
mkdir -p .kb/ai-review/rules/database
```

**Rules:**
- `migrations.md` - Migration file structure
- `indexes.md` - Index naming and usage
- `transactions.md` - Transaction patterns
- `n-plus-one.md` - Avoid N+1 queries

**Preset:**
```json
{
  "atomicRules": {
    "database": {
      "include": ["migrations", "indexes", "transactions", "n-plus-one"]
    }
  }
}
```

### Example 4: React-Specific Category

**Use case:** React component conventions

```bash
mkdir -p .kb/ai-review/rules/react
```

**Rules:**
- `hooks-rules.md` - Custom hooks naming and usage
- `prop-types.md` - Prop type definitions
- `component-structure.md` - File and folder structure
- `state-management.md` - When to lift state

**Preset:**
```json
{
  "atomicRules": {
    "react": {
      "include": ["hooks-rules", "prop-types", "component-structure"]
    }
  }
}
```

### Example 5: Accessibility Category

**Use case:** A11y requirements

```bash
mkdir -p .kb/ai-review/rules/accessibility
```

**Rules:**
- `semantic-html.md` - Use semantic elements
- `aria-labels.md` - ARIA attributes
- `keyboard-nav.md` - Keyboard navigation
- `color-contrast.md` - WCAG contrast ratios

**Preset:**
```json
{
  "atomicRules": {
    "accessibility": {
      "include": ["semantic-html", "aria-labels", "keyboard-nav"]
    }
  }
}
```

## Built-in Categories

KB Labs provides these categories out of the box:

| Category | Description | Example Rules |
|----------|-------------|---------------|
| `naming` | Naming conventions | pyramid-rule, typescript-naming |
| `architecture` | Architecture patterns | v3-plugin-system, adapter-pattern |
| `security` | Security rules | no-eval, input-validation |
| `testing` | Testing conventions | unit-tests, integration-tests |
| `performance` | Performance guidelines | caching, lazy-loading |
| `errorHandling` | Error handling patterns | async-try-catch, typed-errors |
| `consistency` | Project consistency | devkit-configs, package-json-structure |

## Category Naming Conventions

**DO ✅:**
- Use kebab-case: `api-design`, `error-handling`
- Be descriptive: `database` not `db`
- Use singular or plural consistently: `test` vs `tests`

**DON'T ❌:**
- Use camelCase: `apiDesign`
- Use spaces: `api design`
- Use generic names: `rules`, `conventions`

## Preset Composition

Categories compose naturally with inheritance:

```json
{
  "id": "base-preset",
  "atomicRules": {
    "naming": { "include": ["pyramid-rule"] },
    "security": { "include": ["no-eval"] }
  }
}
```

```json
{
  "id": "extended-preset",
  "extends": "base-preset",
  "atomicRules": {
    "naming": {
      "include": ["typescript-naming"]  // Adds to base
    },
    "custom-category": {
      "include": ["custom-rule"]  // New category
    }
  }
}
```

Result:
- `naming`: pyramid-rule + typescript-naming
- `security`: no-eval
- `custom-category`: custom-rule

## Excluding Rules

Use `exclude` to disable specific rules from parent presets:

```json
{
  "id": "strict-preset",
  "atomicRules": {
    "testing": {
      "include": ["unit-tests", "integration-tests", "e2e-tests"]
    }
  }
}
```

```json
{
  "id": "quick-preset",
  "extends": "strict-preset",
  "atomicRules": {
    "testing": {
      "exclude": ["e2e-tests"]  // Skip slow tests
    }
  }
}
```

## Tips and Best Practices

### 1. Start Small
Create one category with 1-2 rules, test it, then expand.

### 2. Share Categories
Categories are just directories - share them across projects:
```bash
# Copy from another project
cp -r ../other-project/.kb/ai-review/rules/api-design .kb/ai-review/rules/
```

### 3. Version Control
Commit categories to git - they're documentation!

### 4. Document Rationale
Always explain "why" in your rules, not just "what"

### 5. Use Examples
LLM needs concrete examples to understand rules

### 6. Test Rules
Run review on real code to validate rules work

### 7. Iterate
Refine rules based on false positives/negatives

## Troubleshooting

### Category not loading?
1. Check directory exists: `.kb/ai-review/rules/your-category/`
2. Verify rule files end with `.md`
3. Ensure `atomicRules` includes the category name
4. Clear cache: `pnpm kb plugins clear-cache`

### Rules not being applied?
1. Check rule is in `include` array
2. Verify not in `exclude` array
3. Rebuild: `pnpm --filter @kb-labs/review-core run build`
4. Run with `--mode=llm` to test LLM analyzers

### LLM ignoring rules?
1. Make rules more specific (add examples)
2. Check rule file has content
3. Test with simple violation first
4. Verify category matches analyzer category

## Advanced: Cross-Language Categories

You can create language-specific categories:

```
.kb/ai-review/rules/
  ├── python/
  │   ├── pep8.md
  │   └── type-hints.md
  ├── rust/
  │   ├── ownership.md
  │   └── error-handling.md
  └── go/
      ├── goroutines.md
      └── error-handling.md
```

Then create language-specific presets:

```json
{
  "id": "python-strict",
  "atomicRules": {
    "python": { "include": ["pep8", "type-hints"] },
    "security": { "include": ["input-validation"] }
  }
}
```

## See Also

- [Atomic Rules Guide](./ATOMIC-RULES-GUIDE.md) - Rule authoring guide
- [Custom Presets Guide](./CUSTOM-PRESETS.md) - Preset composition
- [README](./README.md) - Main documentation
