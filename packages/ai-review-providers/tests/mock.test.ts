import { describe, expect, it } from 'vitest';
import { mockProvider } from '../src/mock';

describe('@kb-labs/ai-review-providers/mock', () => {
  it('produces deterministic findings for TODO markers', async () => {
    const diff = ['diff --git a/x.ts b/x.ts', '--- a/x.ts', '+++ b/x.ts', '@@ -0,0 +1,1 @@', '+// TODO fix', ''].join('\n');
    const run = await mockProvider.review({
      diffText: diff,
      profile: 'frontend'
    });

    const todoFinding = run.findings.find(f => f.rule === 'style.no-todo-comment');
    expect(todoFinding).toBeTruthy();
    expect(todoFinding?.severity).toBe('minor');
  });

  it('produces critical finding for internal imports', async () => {
    const diff = ['diff --git a/y.ts b/y.ts', '--- a/y.ts', '+++ b/y.ts', '@@ -0,0 +1,1 @@', "+import x from 'feature-b/internal/utils'", ''].join('\n');
    const run = await mockProvider.review({
      diffText: diff,
      profile: 'frontend'
    });

    const finding = run.findings.find(f => f.rule === 'arch.modular-boundaries');
    expect(finding).toBeTruthy();
    expect(finding?.severity).toBe('critical');
  });
});
