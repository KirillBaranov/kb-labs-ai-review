import { describe, expect, it } from 'vitest';
import { localProvider } from '../src/local.js';
import type { BoundariesConfig } from '@kb-labs/ai-review-core';
import type { RulesJson } from '@kb-labs/shared-review-types';

function makeDiff(text: string, file = 'src/features/a/file.ts') {
  return [
    `diff --git a/${file} b/${file}`,
    `--- a/${file}`,
    `+++ b/${file}`,
    '@@ -1,0 +1,1 @@',
    `+${text}`,
    ''
  ].join('\n');
}

function makeRulesJson(partial?: Partial<RulesJson>): RulesJson {
  return {
    version: 1,
    domain: 'test',
    rules: [
      {
        id: 'arch.modular-boundaries',
        area: 'Architecture',
        severity: 'critical',
        description: 'No cross-feature internals',
        link: '',
        examples: {},
        scope: [],
        trigger: { type: 'pattern', signals: [] },
        status: 'active',
        version: 1
      },
      {
        id: 'style.no-todo-comment',
        area: 'DX',
        severity: 'minor',
        description: 'No TODOs inline',
        link: '',
        examples: {},
        scope: [],
        trigger: { type: 'pattern', signals: [] },
        status: 'active',
        version: 1
      }
    ],
    ...(partial ?? {})
  };
}

describe('@kb-labs/ai-review-providers/local', () => {
  it('exposes provider name', () => {
    expect(localProvider.name).toContain('local');
  });

  it('returns AiReviewRun shape with findings and summary', async () => {
    const diff = makeDiff('// TODO: fix');
    const run = await localProvider.review({
      diffText: diff,
      profile: 'any',
      rules: makeRulesJson(),
      boundaries: null
    });

    expect(run.version).toBe(1);
    expect(typeof run.runId).toBe('string');
    expect(Array.isArray(run.findings)).toBe(true);
    expect(run.summary?.findingsTotal).toBe(run.findings.length);
  });

  it('maps rule metadata from rules.json entries', async () => {
    const diff = makeDiff('// TODO: fix me please');
    const run = await localProvider.review({
      diffText: diff,
      profile: 'frontend',
      rules: makeRulesJson(),
      boundaries: null
    });

    const finding = run.findings.find(x => x.rule === 'style.no-todo-comment');
    expect(finding).toBeTruthy();
    expect(finding?.area).toBe('DX');
    expect(finding?.severity).toBe('minor');
    expect(finding?.file).toBe('src/features/a/file.ts');
    expect(finding?.locator).toBe('L1');
    expect(finding?.fingerprint).toMatch(/^[a-f0-9]{40}$/);
  });

  it('flags cross-feature internal imports via heuristic', async () => {
    const diff = makeDiff(`import x from 'feature-b/internal/utils'`);
    const run = await localProvider.review({
      diffText: diff,
      profile: 'frontend',
      rules: makeRulesJson(),
      boundaries: null
    });

    expect(run.findings.some(f => f.rule === 'arch.modular-boundaries')).toBe(true);
  });

  it('honours boundaries configuration when provided', async () => {
    const diff = makeDiff(`import x from '../b/internal/foo'`, 'src/features/a/index.ts');
    const boundaries: BoundariesConfig = {
      forbidden: [
        {
          rule: 'feature-to-feature-internal',
          from: { glob: 'src/features/a/**' },
          to: { glob: '**/internal/**' },
          explain: 'no cross feature'
        }
      ]
    };

    const run = await localProvider.review({
      diffText: diff,
      profile: 'frontend',
      rules: makeRulesJson({
        rules: [
          {
            id: 'boundaries.feature-to-feature-internal',
            area: 'Architecture',
            severity: 'major',
            description: '',
            link: '',
            examples: {},
            scope: [],
            trigger: { type: 'pattern', signals: [] },
            status: 'active',
            version: 1
          }
        ]
      }),
      boundaries
    });

    const hit = run.findings.find(x => x.rule === 'boundaries.feature-to-feature-internal');
    expect(hit).toBeTruthy();
    expect(hit?.why).toBe('no cross feature');
  });

  it('returns empty findings when diff has no violations', async () => {
    const diff = makeDiff('const ok = 42');
    const run = await localProvider.review({
      diffText: diff,
      profile: 'frontend',
      rules: makeRulesJson(),
      boundaries: null
    });
    expect(run.findings).toEqual([]);
  });
});
