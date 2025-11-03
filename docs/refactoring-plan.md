# Рефакторинг kb-labs-ai-review: Полная модернизация и упрощение

## Упрощенный flow продукта

**Команды (только 2 команды, как в других продуктах):**

1. **`build-context`** - собирает контекст из профиля (handbook + rules + ADR) → сохраняет Markdown
   - Внешняя ручка для других продуктов
   - Может использоваться отдельно
   - Принимает `--profile` (optional)
   - Принимает `--out` (optional)

2. **`review`** - основной flow:
   - Читает diff
   - Вызывает `build-context` под капотом автоматически
   - Вызывает провайдера (local/mock/openai/claude)
   - Сохраняет JSON всегда
   - По флагам генерирует Markdown/HTML:
     - `--render-md` (default) - генерирует Markdown
     - `--render-html` - генерирует HTML
     - `--no-render` - только JSON, без Markdown/HTML
   - Принимает `--diff` (required)
   - Принимает `--profile` (optional)

**Упрощения:**
- ✅ Только 2 команды: `build-context` и `review`
- ✅ `review` сам вызывает `build-context` под капотом
- ✅ `render-md` и `render-html` удалены как отдельные команды - теперь только флаги для `review`
- ✅ Единый UX через `@kb-labs/shared-cli-ui` (box, keyValue, Loader, TimingTracker)
- ✅ Структура CLI как в других продуктах: `commands/` + `cli.manifest.ts`

**Что удаляется:**
- ❌ `init-profile` - делает core (удалить из манифеста и всех упоминаний)
- ❌ Отдельные команды `render-md` и `render-html` - удалить полностью, сделать флагами review
- ❌ Дублирование между `cli/` и `cmd/` - оставить только `commands/`
- ❌ Кастомная загрузка профилей - использовать loadBundle
- ❌ Сложная аналитика - упростить до событий через SDK
- ❌ Провайдеры привязанные к ai-review - сделать выносимыми в shared

## Цель рефакторинга

Превратить kb-labs-ai-review в **чистый рабочий продукт**:
- ✅ Простая структура (commands/ + cli.manifest.ts как в audit/analytics)
- ✅ Упрощенный flow (2 команды вместо 5)
- ✅ Единый UX через shared-cli-ui
- ✅ Профили через loadBundle (как в audit)
- ✅ Простая аналитика через SDK (как в audit)
- ✅ Провайдеры готовы к выносу в shared
- ✅ Async-first, платформенные модули
- ✅ Нет legacy кода

## План рефакторинга

### Фаза 1: Реструктуризация CLI (как в других продуктах)

**Структура как в audit/analytics:**
```
src/
  cli.manifest.ts    # Манифест с определением команд (только 2 команды)
  commands/          # Папка с командами
    build-context.ts # Команда build-context
    review.ts        # Команда review (с флагами render-md/render-html)
  index.ts           # Экспорт манифеста
  analytics/         # События аналитики (events.ts - простой файл)
  review/            # Бизнес-логика review (io.ts, providers.ts, review.ts)
  utils.ts           # Утилиты (cli-utils.ts переименовать)
```

**Действия:**
1. Создать `packages/cli/src/commands/` папку
2. Переместить и переделать команды:
   - `build-context.ts` → `commands/build-context.ts` (использует Command из @kb-labs/cli-commands)
   - `review.ts` → `commands/review.ts` (использует Command, включает логику render-md/render-html как флаги)
3. Удалить `packages/cli/src/cli/` полностью (включая render-md.ts и render-html.ts)
4. Удалить `packages/cli/src/cmd/` полностью (включая render-md.ts и render-html.ts)
5. Удалить из `cli.manifest.ts` - команды render-md, render-html, init-profile
6. Обновить `cli.manifest.ts` - только 2 команды: build-context и review
7. Обновить `index.ts` - экспортировать только манифест

**Формат команды:**
```typescript
import type { Command } from '@kb-labs/cli-commands';
import { box, keyValue, Loader, TimingTracker } from '@kb-labs/shared-cli-ui';

export const review: Command = {
  name: 'ai-review:review',
  category: 'ai-review',
  describe: 'Run code review against a unified diff',
  async run(ctx, argv, flags) {
    // Использует shared-cli-ui для UX
    // Вызывает build-context под капотом
    // По флагам --render-md/--render-html генерирует Markdown/HTML
  }
};
```

**Обновление манифеста:**
```typescript
loader: async () => {
  const mod = await import('./commands/review');
  return { run: mod.review.run };
}
```

### Фаза 2: Упрощение команд и UX

**Команда review:**
- Принимает `--diff` (required)
- Принимает `--profile` (optional, default из bundle)
- Под капотом вызывает build-context автоматически
- Генерирует JSON всегда
- Флаги `--render-md` (default), `--render-html`, `--no-render`
- Использует `@kb-labs/shared-cli-ui` для UX (box, keyValue, Loader, TimingTracker)

**Команда build-context:**
- Отдельная команда для других продуктов
- Принимает `--profile` (optional)
- Принимает `--out` (optional, default из bundle config)
- Использует `@kb-labs/shared-cli-ui` для UX

**Удалить:**
- ❌ Отдельные команды `render-md` и `render-html` - удалить полностью
- ❌ `init-profile` - удалить везде
- ❌ Старый UX (colorette helpers) - заменить на shared-cli-ui

**Действия:**
1. В `commands/review.ts` - добавить логику build-context под капотом
2. В `commands/review.ts` - добавить флаги `--render-md`, `--render-html`, `--no-render`
3. В `commands/review.ts` - добавить логику рендеринга Markdown/HTML внутри команды
4. Удалить `render-md.ts` и `render-html.ts` полностью (из cli/ и cmd/)
5. Удалить из `cli.manifest.ts` - команды render-md и render-html
6. Заменить colorette helpers на shared-cli-ui (box, keyValue, Loader, TimingTracker)
7. Обновить все команды на использование shared-cli-ui для UX

### Фаза 3: Миграция профилей на loadBundle (критично)

**Текущая проблема**: Кастомная загрузка профилей через `profiles.ts`

**Решение**: Использовать loadBundle как в audit

**Как это работает в audit:**
```typescript
import { loadBundle } from '@kb-labs/core-bundle';

const bundle = await loadBundle({
  cwd: repoRoot,
  product: 'audit',
  profileKey: profileId || 'default'
});

// Конфигурация из bundle
const config = bundle.config as AuditConfig;
```

**Для ai-review:**
```typescript
import { loadBundle } from '@kb-labs/core-bundle';

const bundle = await loadBundle({
  cwd: repoRoot,
  product: 'aiReview',
  profileKey: profileId || 'default'
});

// Конфигурация из bundle
const config = bundle.config as AiReviewConfig;

// Артефакты через bundle
const rules = await bundle.artifacts.read('rules');
const boundaries = await bundle.artifacts.read('boundaries');
const handbookFiles = await bundle.artifacts.materialize('handbook');
const adrFiles = await bundle.artifacts.materialize('adr');
```

**Действия:**
1. Удалить `packages/cli/src/review/profiles.ts` - всю логику загрузки
2. Удалить `packages/cli/src/config/config.ts` и `config-loader.ts`
3. В `commands/review.ts`: заменить loadConfig + loadRules + loadBoundaries → loadBundle
4. В `commands/build-context.ts`: использовать bundle.artifacts для загрузки handbook/rules/adr
5. Вынести логику build-context в отдельный модуль или оставить в команде

### Фаза 4: Упрощение аналитики (как в audit)

**Текущая проблема**: Сложная аналитика в `packages/analytics/`

**Решение**: Упростить до простых событий через SDK

**Как это в audit:**
```typescript
import { runScope, type AnalyticsEventV1 } from '@kb-labs/analytics-sdk-node';
import { ANALYTICS_EVENTS, ANALYTICS_ACTOR } from '../analytics/events';

await runScope(
  { actor: ANALYTICS_ACTOR, ctx: { workspace: repoRoot } },
  async (emit) => {
    await emit({ type: ANALYTICS_EVENTS.COMMAND_STARTED, payload: {...} });
    // ... команда
    await emit({ type: ANALYTICS_EVENTS.COMMAND_FINISHED, payload: {...} });
  }
);
```

**Действия:**
1. Упростить `packages/analytics/` - оставить только определения событий или удалить полностью
2. Удалить сложную логику аналитики из CLI
3. В командах использовать только `runScope` + `emit`
4. События определить в `packages/cli/src/analytics/events.ts` (простой файл как в audit)

### Фаза 5: Подготовка провайдеров к выносу

**Цель**: Провайдеры можно вынести в shared без ломки ai-review

**Текущая проблема**: Провайдеры зависят от ai-review-core и сложно вынести

**Решение**: Четкий интерфейс и минимальные зависимости

**Действия:**
1. В `packages/providers/types/` - четкий интерфейс провайдера
2. Провайдеры должны зависеть только от типов из `@kb-labs/shared-review-types`
3. В `packages/cli/src/review/providers.ts` - сделать registry через интерфейс
4. Убрать зависимости от `@kb-labs/ai-review-core` из провайдеров где возможно

**Структура провайдеров:**
```
packages/providers/
  types/        # Интерфейс ReviewProvider + ProviderReviewInput
  local/        # Зависит только от types
  mock/         # Зависит только от types  
  openai/       # Зависит только от types
  claude/       # Зависит только от types
```

**Интерфейс:**
```typescript
// packages/providers/types/src/index.ts
import type { ReviewJson } from '@kb-labs/shared-review-types';

export interface ProviderReviewInput {
  diffText: string
  profile: string
  rules?: RulesJson
  boundaries?: BoundariesConfig
}

export interface ReviewProvider {
  name: string
  review(input: ProviderReviewInput): Promise<ReviewJson>
}
```

**Registry в CLI:**
```typescript
// packages/cli/src/review/providers.ts
import type { ReviewProvider } from '@kb-labs/ai-review-provider-types';

const providers = new Map<string, ReviewProvider>();

export function registerProvider(name: string, provider: ReviewProvider) {
  providers.set(name, provider);
}

export function getProvider(name: string): ReviewProvider {
  return providers.get(name) || providers.get('local')!;
}
```

### Фаза 6: Миграция на платформенные модули

**Замена:**
1. `findRepoRoot()` → `@kb-labs/core.findRepoRoot()` (async) везде
2. `resolveRepoPath()` → `@kb-labs/core.toAbsolute()`
3. Все `const REPO_ROOT = findRepoRoot()` → async версии
4. `@kb-labs/core-sys` → `@kb-labs/core` (фасад)

**Файлы:**
- `packages/cli/src/utils.ts` (переименовать cli-utils.ts) - использовать @kb-labs/core
- Все команды - сделать async от корня
- `packages/cli/src/review/review.ts` - async + bundle

### Фаза 7: Очистка

**Удалить:**
1. `packages/ai-review/` - пустая папка
2. `packages/cli/src/config/` - заменено на bundle
3. `packages/cli/src/review/profiles.ts` - заменено на bundle
4. `packages/cli/src/cli/` - удалить полностью
5. `packages/cli/src/cmd/` - удалить полностью
6. Неиспользуемые файлы и утилиты

**Итоговая структура:**
```
packages/
  core/           # Парсинг diff, рендеринг findings
  cli/            # CLI команды
    commands/     # build-context, review (только 2 команды)
    review/       # io.ts, providers.ts, review.ts
    analytics/    # events.ts (простой файл)
    utils.ts      # Утилиты
  providers/      # Готовы к выносу (types, local, mock, openai, claude)
  analytics/      # Упрощенная аналитика (или удалить если не используется)
```

## Приоритеты выполнения

**Критично (делать первым):**
1. Фаза 1: Реструктуризация CLI (commands/ + cli.manifest.ts)
2. Фаза 2: Упрощение команд и UX (shared-cli-ui, упрощение flow)
3. Фаза 3: Миграция профилей на loadBundle (критично для работы)

**Важно (делать вторым):**
4. Фаза 4: Упрощение аналитики (события через SDK)
5. Фаза 5: Подготовка провайдеров (готовы к выносу)
6. Фаза 6: Миграция на платформенные модули (async, @kb-labs/core)

**Финализация:**
7. Фаза 7: Очистка (удаление неиспользуемого кода)

## Критерии готовности

- [ ] Структура CLI как в других продуктах (commands/ + cli.manifest.ts)
- [ ] Только 2 команды: build-context и review
- [ ] review вызывает build-context под капотом
- [ ] render-md/render-html - флаги для review (не отдельные команды)
- [ ] UX через shared-cli-ui (box, keyValue, Loader, TimingTracker)
- [ ] Все команды работают через bundle
- [ ] Профили загружаются через loadBundle
- [ ] Аналитика упрощена до событий (как в audit)
- [ ] Провайдеры готовы к выносу (зависят только от типов)
- [ ] Нет дублирования кода
- [ ] Async-first везде
- [ ] Type-check проходит
- [ ] Lint проходит (критические ошибки исправлены)


