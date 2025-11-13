import { describe, expect, it } from 'vitest';
import { analyzeDiff } from '../src/lib/engine.js';

function makeDiff(text: string): string {
  return [
    'diff --git a/src/a.ts b/src/a.ts',
    '--- a/src/a.ts',
    '+++ b/src/a.ts',
    '@@ -0,0 +1,1 @@',
    `+${text}`,
    ''
  ].join('\n');
}

describe('analyzeDiff', () => {
  it('detects TODO comments', () => {
    const diff = makeDiff('// TODO: refactor');
    const findings = analyzeDiff({ diffText: diff, rulesJson: null, boundaries: null });

    expect(findings.some(f => f.rule === 'style.no-todo-comment')).toBe(true);
  });
});
