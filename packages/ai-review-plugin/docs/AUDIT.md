# Package Architecture Audit: @kb-labs/ai-review-plugin

**Date**: 2025-11-16  
**Package Version**: 0.1.0

## 1. Package Purpose & Scope

CLI/REST/Studio plugin для AI Review: маршрутизация команд, REST и Studio поверх `ai-review-core`.

---

## 9. CLI Commands Audit

### 9.1 Product-level help

- `pnpm kb ai-review --help`:
  - продукт `ai-review` отображается;
  - доступна команда:
    - `ai-review:run` — Run AI Review against a unified diff and emit artifacts.

### 9.2 Статус команд (уровень help)

| Product     | Command IDs      | Status        | Notes                             |
|-------------|------------------|---------------|-----------------------------------|
| `ai-review` | `ai-review:run`  | **OK (help)** | Видна в `kb ai-review --help`     |

В этом проходе проверялась только доступность/отображение команд; поведение handler’ов не тестировалось.


