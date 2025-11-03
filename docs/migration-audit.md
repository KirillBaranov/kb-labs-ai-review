# AI Review Migration Audit

Этот документ содержит полный аудит кода для миграции kb-labs-ai-review на стандарты KB Labs.

## Фаза 0: Аудит зависимостей и кода для вынесения

### 1. Инвентарь локальных утилит

#### FS/Repo утилиты (`packages/cli/src/cli-utils.ts`)
- `findRepoRoot(start?: string): string` - синхронная, ищет по .git или pnpm-workspace.yaml
  - **Аналог в @kb-labs/core**: `@kb-labs/core-sys/repo.findRepoRoot(startDir?: string): Promise<string>` - асинхронная
  - **Действие**: Заменить на async версию из core
  
- `ensureDirForFile(p: string): void` - создает директорию для файла
  - **Аналог в @kb-labs/core**: Не найден (может быть в fs utils)
  - **Действие**: Проверить наличие в core-sys/fs или добавить
  
- `resolveRepoPath(repoRoot: string, p: string): string` - разрешает путь относительно repo root
  - **Аналог в @kb-labs/core**: `@kb-labs/core-sys/fs.toAbsolute(baseDir: string, maybeRelative?: string): string`
  - **Действие**: Заменить на toAbsolute из core
  
- `formatBytes(n: number): string` - форматирует размер в байтах
  - **Аналог в @kb-labs/shared**: Не найден
  - **Действие**: Оставить локально или вынести в shared-textops если нужно

#### Diff parsing утилиты (`packages/core/src/lib/diff.ts`)
- `parseUnifiedDiff(diff: string): FileDiff[]` - парсит unified diff
  - **Аналог в @kb-labs/shared**: `@kb-labs/shared-diff.parseUnifiedDiff(diff: string): ParsedDiff`
  - **Различия**: 
    - ai-review возвращает `FileDiff[]` с `{ filePath, hunks: Hunk[] }`
    - shared возвращает `ParsedDiff` с `{ files: string[], addedByFile, removedByFile, hunksByFile }`
  - **Действие**: Адаптировать код для использования shared версии
  
- `hunkLocator(h: Hunk): string` - генерирует строку локатора для hunk
  - **Аналог в @kb-labs/shared**: Не найден
  - **Действие**: Проверить нужен ли, возможно вынести в shared или оставить локально

#### Review типы (`packages/core/src/lib/types.ts`)
- `Severity` - тип: 'critical' | 'major' | 'minor' | 'info'
- `RuleItem` - интерфейс правила
- `ReviewFinding` - интерфейс finding
- `RulesJson` - интерфейс для rules.json
  - **Аналог в @kb-labs/shared**: Нужно проверить наличие review-types
  - **Действие**: Вынести типы в @kb-labs/shared/review-types или использовать существующие

#### Конфигурация (`packages/cli/src/config/config.ts`)
- `SentinelRc` - интерфейс конфигурации
- `ResolvedConfig` - интерфейс разрешенной конфигурации
- `loadConfig(cliOverrides?: SentinelRc): ResolvedConfig` - загрузчик конфигурации
  - **Аналог**: `@kb-labs/core-bundle.loadBundle()` - новый способ загрузки конфигурации
  - **Действие**: Полностью заменить на loadBundle

#### Logging
- Локальные helpers: `ok()`, `info()`, `warn()`, `fail()` в `packages/cli/src/cli-utils.ts`
  - **Аналог в @kb-labs/core**: `@kb-labs/core-sys/logging` с Logger интерфейсом
  - **Действие**: Заменить на Logger из core

### 2. Сопоставление с аналогами

#### ✅ Уже есть в @kb-labs/shared
- Diff parsing: `@kb-labs/shared-diff` - parseUnifiedDiff, listChangedFiles, addedLinesByFile, removedLinesByFile
- Textops: `@kb-labs/shared-textops` - token/byte limits, chunking helpers

#### ✅ Уже есть в @kb-labs/core
- Repo utils: `@kb-labs/core-sys/repo.findRepoRoot()` - async версия
- FS utils: `@kb-labs/core-sys/fs.toAbsolute()` - разрешение путей
- Logging: `@kb-labs/core-sys/logging` - Logger интерфейс
- Config: `@kb-labs/core-bundle.loadBundle()` - загрузка конфигурации

#### ❌ Не найдено (нужно создать или проверить)
- `ensureDirForFile` - может быть в core-sys/fs или нужно добавить
- `hunkLocator` - специфичная утилита для ai-review, возможно оставить локально
- Review типы - нужно проверить есть ли в shared или создать

### 3. Места использования старых API

#### findRepoRoot используется в:
- `packages/cli/src/index.ts` (REPO_ROOT константа)
- `packages/cli/src/config/config.ts` (REPO_ROOT константа)
- `packages/cli/src/review/review.ts` (REPO_ROOT константа)
- `packages/cli/src/context.ts` (REPO_ROOT константа)
- `packages/cli/src/cmd/render-md.ts` (REPO_ROOT константа)
- `packages/cli/src/cmd/render-html.ts` (REPO_ROOT константа)
- `packages/cli/src/cmd/analytics.ts` (REPO константа)
- `packages/cli/src/__tests__/findRepoRoot.spec.ts` (тесты)

#### ensureDirForFile используется в:
- `packages/cli/src/review/io.ts`
- `packages/cli/src/context.ts`
- `packages/cli/src/cmd/render-md.ts`
- `packages/cli/src/cmd/render-html.ts`

#### resolveRepoPath используется в:
- `packages/cli/src/cli-utils.ts` (resolveAnalyticsOut)
- Тесты

#### parseUnifiedDiff (локальная) используется в:
- `packages/core/src/lib/engine.ts` - используется для анализа diff
- Нужно проверить все импорты из `@kb-labs/ai-review-core`

### 4. Инвентаризация флагов конфигурации

#### Флаги из SentinelRc (packages/cli/src/config/config.ts)

**Основные флаги:**
- `profile?: string` - имя профиля (default: 'frontend')
- `provider?: ProviderName` - провайдер (local|mock|openai|claude, default: 'local')
- `profilesDir?: string` - корень профилей (default: 'packages/profiles')

**CI и лимиты:**
- `failOn?: FailOn` - политика exit (major|critical, default: 'major')
- `maxComments?: number` - лимит findings

**Выходные пути (out):**
- `out.root?: string` - корень артефактов (default: '.sentinel')
- `out.contextDir?: string` - директория контекста (default: 'context')
- `out.reviewsDir?: string` - директория reviews (default: 'reviews')
- `out.analyticsDir?: string` - директория аналитики (default: 'analytics')
- `out.exportsDir?: string` - директория экспортов (default: 'exports')
- `out.mdName?: string` - имя md файла (default: 'review.md')
- `out.jsonName?: string` - имя json файла (default: 'review.json')

**Рендеринг (render):**
- `render.template?: string` - путь к шаблону
- `render.severityMap?: Record<string, string>` - маппинг severity

**Контекст (context):**
- `context.includeADR?: boolean` - включать ADR (default: true)
- `context.includeBoundaries?: boolean` - включать boundaries (default: true)
- `context.maxBytes?: number` - макс байт (default: 1_500_000)
- `context.maxApproxTokens?: number` - макс токены (default: 0)

**Аналитика (analytics):**
- `analytics.enabled?: boolean` - включена ли (default: false)
- `analytics.mode?: 'byRun' | 'byDay'` - режим файлов (default: 'byDay')
- `analytics.outDir?: string` - директория вывода
- `analytics.salt?: string` - соль для хеширования (default: 'sentinel')
- `analytics.privacy?: 'team' | 'detailed'` - уровень приватности (default: 'team')
- `analytics.plugins?: string[]` - список плагинов
- `analytics.pluginConfig?: Record<string, any>` - конфигурация плагинов

#### Определение места в схеме

**Должны быть в review.schema.json (products.review.config):**
- `provider` - выбор провайдера (product-level)
- `failOn` - политика exit (product-level)
- `maxComments` - лимит findings (product-level)
- `analytics` - настройки аналитики (product-level)
- `context` - настройки контекста (product-level)
- `render` - настройки рендера (product-level)
- `out` - настройки путей вывода (product-level)

**Только CLI опции (не в схеме профиля):**
- `profilesDir` - переопределение корня профилей (CLI only)
- `profile` - выбор профиля (CLI override для profileKey)

### 5. Структура профилей

#### Текущая структура (legacy)
```
packages/profiles/
  frontend/
    docs/
      rules/
        rules.json          # правила
        boundaries.json     # границы модулей
        schema.json         # схема правил
      handbook/
        architecture.md     # handbook файлы
        styling.md
        testing.md
      adr/                  # ADR файлы
  backend/...
  e2e/...
```

#### Новая структура (через @kb-labs/core)
Профили должны быть в формате:
- Файл профиля: `profiles/<name>.json` или `packages/profiles/<name>/profile.json`
- Структура по стандарту @kb-labs/profile-schemas:
  ```json
  {
    "name": "frontend",
    "kind": "review",
    "scope": "repo",
    "version": "1.0.0",
    "products": {
      "review": {
        "enabled": true,
        "config": {
          "provider": "local",
          "failOn": "major",
          "maxComments": 7,
          ...
        }
      }
    },
    "sources": {
      "rules": ["docs/rules/rules.json"],
      "handbook": ["docs/handbook/**/*.md"],
      "adr": ["docs/adr/**/*.md"]
    },
    "boundaries": {...}
  }
  ```

### 6. Проверка DevKit sync

- ✅ `scripts/devkit-sync.mjs` существует
- ✅ `kb-labs.config.json` создан
- ⚠️ Drift-check показывает изменения в CI (профили валидации)
  - Это нормально для начала миграции

## Выводы по аудиту

### ✅ Уже соответствует стандартам
- ESLint: уже использует `@kb-labs/devkit/eslint/node.js`
- Vitest: уже использует `@kb-labs/devkit/vitest/node.js`
- Tsup: все пакеты уже используют `@kb-labs/devkit/tsup/node.js`
- DevKit sync: настроен и работает

### ⚠️ Требует обновления
- TypeScript: обновлен с `base.json` на `node.json`
- Конфигурация: нужна замена на loadBundle
- FS/Repo utils: нужна замена на @kb-labs/core-sys
- Diff parsing: нужна адаптация к shared версии
- Review типы: нужно вынести в @kb-labs/shared/review-types

### ❌ Требует создания/вынесения
- Review типы в shared (Severity, ReviewFinding, RuleItem, RulesJson)
- FS utils (ensureDirForFile) - проверить наличие в core или добавить
- hunkLocator - возможно оставить локально или вынести

## Следующие шаги

1. ✅ Создать `kb-labs.config.json` - **ГОТОВО**
2. ✅ Задокументировать аудит - **ГОТОВО**
3. ✅ Обновить tsconfig.base.json - **ГОТОВО**
4. ✅ Начать Фазу 2: Вынос переиспользуемого кода в shared/core - **ВЫПОЛНЕНО**

## Выполненный рефакторинг (2025-01)

### Фаза 1: Очистка артефактов и конфигурации ✅

- ✅ Удалены все артефакты сборки `tsup.config.bundled_*.mjs` (176 файлов)
- ✅ Обновлен `.gitignore` для игнорирования подобных артефактов
- ✅ Унифицирован `.gitignore` по стандартам KB Labs

### Фаза 2: Миграция legacy утилит на платформенные модули ✅

- ✅ `resolveRepoPath()` → `@kb-labs/core-sys.toAbsolute()`
- ✅ Добавлен `findRepoRootAsync()` использующий `@kb-labs/core-sys.findRepoRoot()` (async версия)
- ✅ `findRepoRoot()` оставлен для обратной совместимости (sync версия с @deprecated)
- ✅ `ensureDirForFile()` оставлена как локальная утилита (синхронная, простая)

### Фаза 3: Унификация структуры пакетов ✅

- ✅ Все пакеты получили `author`, `license`, `repository.directory`
- ✅ Унифицированы скрипты: добавлены `lint`, `lint:fix`, обновлены `test`
- ✅ Обновлены devDependencies: `@kb-labs/devkit`, `vitest@^3`, `tsup@^8`, `typescript@^5`
- ✅ Пакеты приведены к единообразию с `kb-labs-audit` и `kb-labs-analytics`

### Отложено на будущее

- ⏳ Миграция конфигурации на `@kb-labs/core-bundle.loadBundle()` - требует расширения схемы профилей
- ℹ️ Логирование оставлено как есть - простые UI helpers (`ok`, `info`, `warn`, `fail`) не требуют замены на инфраструктурный Logger

### Статус миграции

- ✅ Репозиторий очищен от артефактов сборки
- ✅ Legacy утилиты заменены на платформенные модули (частично)
- ✅ Структура пакетов соответствует стандартам других продуктов
- ✅ Все тесты компилируются и проходят проверку типов

