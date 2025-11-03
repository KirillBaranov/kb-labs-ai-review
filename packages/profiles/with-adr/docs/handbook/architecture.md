# Architecture Handbook

## Module boundaries
Features must not import each other directly. Use a shared port/adapter.

**Allowed**
- `feature-a` → `shared/ports/<adapter>.ts` → `feature-b/public-api.ts`

**Forbidden**
- `feature-a/*` → `feature-b/internal/*`

## Public vs Internal
- `public-api.ts` — everything importable from outside.
- `internal/*` — private; external imports are forbidden.

## Layers
- `src/shared/**` (1)
- `src/features/*/**` (2)
- `src/app/**` (3)

**Rule:** higher index may depend on lower, not vice versa.
