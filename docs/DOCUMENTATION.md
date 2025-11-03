# KB Labs AI Review Documentation Standard

> **This document is a project-specific copy of the KB Labs Documentation Standard.**  
> See [Main Documentation Standard](https://github.com/KirillBaranov/kb-labs/blob/main/docs/DOCUMENTATION.md) for the complete ecosystem standard.

This document defines the documentation standards for **KB Labs AI Review**. This project follows the [KB Labs Documentation Standard](https://github.com/KirillBaranov/kb-labs/blob/main/docs/DOCUMENTATION.md) with the following project-specific customizations:

## Project-Specific Customizations

KB Labs AI Review is an AI-powered code review framework with profile-based rules. Documentation should focus on:

- Profile-based review rules
- Provider integrations (OpenAI, Claude, Mock)
- Review rendering (JSON + Markdown)
- GitHub/GitLab integration
- Migration from legacy architecture

## Project Documentation Structure

```
docs/
├── DOCUMENTATION.md       # This standard (REQUIRED)
├── MIGRATION.md           # Migration guide from legacy
├── migration-plan-full.md # Full migration plan
├── migration-audit.md     # Migration audit
├── refactoring-plan.md    # Refactoring plan
└── adr/                    # Architecture Decision Records
    ├── 0000-template.md   # ADR template
    └── *.md                # ADR files
```

## Required Documentation

This project requires:

- [x] `README.md` in root with all required sections
- [x] `CONTRIBUTING.md` in root with development guidelines
- [x] `docs/DOCUMENTATION.md` (this file)
- [ ] `docs/adr/0000-template.md` (ADR template - should be created from main standard)
- [x] `LICENSE` in root

## Optional Documentation

This project has:

- [x] `docs/MIGRATION.md` - Migration guide
- [x] `docs/migration-plan-full.md` - Full migration plan
- [x] `docs/migration-audit.md` - Migration audit
- [x] `docs/refactoring-plan.md` - Refactoring plan

## ADR Requirements

All ADRs must follow the format defined in the [main standard](https://github.com/KirillBaranov/kb-labs/blob/main/docs/DOCUMENTATION.md#architecture-decision-records-adr) with:

- Required metadata: Date, Status, Deciders, Last Reviewed, Tags
- Minimum 1 tag, maximum 5 tags
- Tags from approved list
- See main standard `docs/templates/ADR.template.md` for template

## Cross-Linking

This project links to:

**Dependencies:**
- [@kb-labs/core](https://github.com/KirillBaranov/kb-labs-core) - Core utilities
- [@kb-labs/shared](https://github.com/KirillBaranov/kb-labs-shared) - Shared types
- [@kb-labs/cli](https://github.com/KirillBaranov/kb-labs-cli) - CLI commands

**Used By:**
- All KB Labs projects for code review
- CI/CD pipelines

**Ecosystem:**
- [KB Labs](https://github.com/KirillBaranov/kb-labs) - Main ecosystem repository

---

**Last Updated:** 2025-11-03  
**Standard Version:** 1.0 (following KB Labs ecosystem standard)  
**See Main Standard:** [KB Labs Documentation Standard](https://github.com/KirillBaranov/kb-labs/blob/main/docs/DOCUMENTATION.md)


