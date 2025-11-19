# Package Architecture Description: @kb-labs/ai-review-contracts

**Version**: 0.0.1
**Last Updated**: 2025-11-16

## Executive Summary

**@kb-labs/ai-review-contracts** provides public contracts for KB Labs AI Review. It describes the artifacts, command/workflow IDs, payload schemas, and helper parsers that other KB Labs surfaces consume.

## 1. Package Overview

### 1.1 Purpose & Scope

**Primary Purpose**: Provide public contracts for AI Review.

**Scope Boundaries**:
- **In Scope**: Contract manifest, schemas, types, helper parsers
- **Out of Scope**: Runtime implementation (in ai-review-plugin), core logic (in ai-review-core)

**Domain**: AI Review / Contracts

### 1.2 Key Responsibilities

1. **Contract Definition**: Define public contracts for AI Review
2. **Schema Validation**: Zod schemas for validation
3. **Type Safety**: TypeScript types derived from schemas
4. **Versioning**: SemVer-based contract versioning

## 2. High-Level Architecture

### 2.1 Architecture Diagram

```
AI Review Contracts
    │
    ├──► Contract Manifest (contract.ts)
    │   ├──► Artifacts
    │   ├──► Commands
    │   └──► Workflows
    │
    ├──► Zod Schemas (schema/)
    │   ├──► api.schema.ts
    │   ├──► artifacts.schema.ts
    │   ├──► commands.schema.ts
    │   ├──► contract.schema.ts
    │   └──► workflows.schema.ts
    │
    ├──► TypeScript Types (types.ts)
    │   └──► Types derived from schemas
    │
    └──► Helper Parsers (schema.ts)
        └──► parseAiReviewRun, parseAiReviewCommandOutput
```

### 2.2 Architectural Style

- **Style**: Contract Definition Pattern
- **Rationale**: Define contracts for AI Review system

## 3. Component Architecture

### 3.1 Component: Contract Manifest

- **Purpose**: Define contract manifest
- **Responsibilities**: Artifacts, commands, workflows metadata
- **Dependencies**: None

### 3.2 Component: Zod Schemas

- **Purpose**: Validation schemas
- **Responsibilities**: Define Zod schemas for validation
- **Dependencies**: zod

### 3.3 Component: TypeScript Types

- **Purpose**: Type definitions
- **Responsibilities**: Define TypeScript types
- **Dependencies**: schemas (z.infer)

### 3.4 Component: Helper Parsers

- **Purpose**: Parse contracts
- **Responsibilities**: Parse AI Review runs, command outputs
- **Dependencies**: zod

## 4. Data Flow

```
parseAiReviewRun(jsonPayload)
    │
    ├──► Validate with Zod
    ├──► Return typed AiReviewRun
    └──► return run
```

## 5. Design Patterns

- **Contract Definition Pattern**: Define contracts for AI Review system
- **Schema-First Pattern**: Schemas define types via z.infer

## 6. Performance Architecture

- **Time Complexity**: O(1) for type operations, O(n) for schema validation
- **Space Complexity**: O(1)
- **Bottlenecks**: Schema validation for large payloads

## 7. Security Architecture

- **Schema Validation**: Input validation via Zod schemas
- **Type Safety**: TypeScript type safety

---

**Last Updated**: 2025-11-16

