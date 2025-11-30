import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { runAiReviewWorkflow } from '../src/application/workflow';

const PROFILE = 'frontend';

async function createTempRepo() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-review-workflow-'));
  const profileRoot = path.join(root, 'packages', 'profiles', PROFILE);
  await fs.mkdir(path.join(profileRoot, 'docs', 'handbook'), { recursive: true });
  await fs.mkdir(path.join(profileRoot, 'docs', 'rules'), { recursive: true });

  await fs.writeFile(path.join(profileRoot, 'docs', 'handbook', 'INTRO.md'), '# Intro\n');
  await fs.writeFile(
    path.join(profileRoot, 'docs', 'rules', 'rules.json'),
    JSON.stringify({ version: 1, domain: 'test', rules: [] }, null, 2)
  );
  await fs.writeFile(path.join(profileRoot, 'docs', 'rules', 'boundaries.json'), JSON.stringify({ forbidden: [] }, null, 2));

  const diffPath = path.join(root, 'changes.diff');
  await fs.writeFile(
    diffPath,
    ['diff --git a/src/a.ts b/src/a.ts', '--- a/src/a.ts', '+++ b/src/a.ts', '@@ -0,0 +1,1 @@', '+// TODO: fix', ''].join('\n')
  );

  return { root, diffPath };
}

describe('runAiReviewWorkflow', () => {
  let repo: { root: string; diffPath: string };

  beforeEach(async () => {
    repo = await createTempRepo();
  });

  afterEach(async () => {
    await fs.rm(repo.root, { recursive: true, force: true });
  });

  it('produces artifacts and returns workflow result', async () => {
    const result = await runAiReviewWorkflow({
      diffPath: repo.diffPath,
      repoRoot: repo.root,
      profile: PROFILE
    });

    expect(result.output.exitCode).toBe(0);
    expect(result.producedArtifacts.length).toBeGreaterThan(0);
  });
});
