import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { executeReview } from '../src/runtime/review-service.js';

const PROFILE = 'frontend';

async function createTempRepo() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-review-'));
  const profileRoot = path.join(root, 'packages', 'profiles', PROFILE);
  await fs.mkdir(path.join(profileRoot, 'docs', 'handbook'), { recursive: true });
  await fs.mkdir(path.join(profileRoot, 'docs', 'rules'), { recursive: true });
  await fs.mkdir(path.join(profileRoot, 'docs', 'adr'), { recursive: true });

  await fs.writeFile(
    path.join(profileRoot, 'docs', 'handbook', 'INTRO.md'),
    '# Intro\nWelcome to the profile.'
  );

  await fs.writeFile(
    path.join(profileRoot, 'docs', 'rules', 'rules.json'),
    JSON.stringify(
      {
        version: 1,
        domain: 'test',
        rules: [
          {
            id: 'style.no-todo-comment',
            area: 'DX',
            severity: 'minor',
            description: 'No TODO comments',
            link: '',
            examples: {},
            scope: [],
            trigger: { type: 'pattern', signals: [] },
            status: 'active',
            version: 1
          }
        ]
      },
      null,
      2
    )
  );

  await fs.writeFile(path.join(profileRoot, 'docs', 'rules', 'boundaries.json'), JSON.stringify({ forbidden: [] }, null, 2));

  const diffPath = path.join(root, 'changes.diff');
  await fs.writeFile(
    diffPath,
    [
      'diff --git a/src/app.ts b/src/app.ts',
      '--- a/src/app.ts',
      '+++ b/src/app.ts',
      '@@ -0,0 +1,1 @@',
      '+// TODO: refactor',
      ''
    ].join('\n')
  );

  return { root, diffPath };
}

describe('executeReview', () => {
  let repo: { root: string; diffPath: string };

  beforeEach(async () => {
    repo = await createTempRepo();
  });

  afterEach(async () => {
    await fs.rm(repo.root, { recursive: true, force: true });
  });

  it('runs local provider, writes artifacts, and returns command output', async () => {
    const output = await executeReview({
      diffPath: repo.diffPath,
      repoRoot: repo.root,
      profile: PROFILE,
      render: { humanMarkdown: true, html: false }
    });

    expect(output.run.findings.length).toBeGreaterThan(0);
    expect(output.artifacts.reviewJson).toBeTruthy();
    const json = JSON.parse(await fs.readFile(output.artifacts.reviewJson, 'utf8'));
    expect(json.findings.length).toBeGreaterThan(0);
    expect(output.artifacts.context).toBeTruthy();
    expect(await fs.stat(output.artifacts.context!)).toBeTruthy();
    const summary = output.run.summary;
    expect(summary?.findingsTotal).toBeGreaterThan(0);
    expect(await fs.stat(output.artifacts.reviewMd)).toBeTruthy();
  });
});
