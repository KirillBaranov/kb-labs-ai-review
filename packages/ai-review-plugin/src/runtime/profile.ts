import fs from 'node:fs';
import path from 'node:path';
import type { RulesJson } from '@kb-labs/shared-review-types';
import type { BoundariesConfig } from '@kb-labs/ai-review-core';

export async function resolveProfileRoot(
  repoRoot: string,
  profile: string,
  profilesDir?: string
): Promise<string> {
  if (profile.includes('/') || profile.startsWith('.') || path.isAbsolute(profile)) {
    const abs = path.isAbsolute(profile) ? profile : path.join(repoRoot, profile);
    if (!fs.existsSync(abs)) {
      throw new Error(`[profile] path not found: ${abs}`);
    }
    return abs;
  }

  if (profilesDir) {
    const base = path.isAbsolute(profilesDir) ? profilesDir : path.join(repoRoot, profilesDir);
    const candidate = path.join(base, profile);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  const candidates = [
    path.join(repoRoot, 'profiles', profile),
    path.join(repoRoot, 'packages', 'profiles', profile)
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  throw new Error(`[profile] not found: "${profile}" (tried: ${candidates.join(', ')})`);
}

export async function loadRules(
  repoRoot: string,
  profile: string,
  profilesDir?: string
): Promise<RulesJson | null> {
  const root = await resolveProfileRoot(repoRoot, profile, profilesDir);
  const rulesPath = path.join(root, 'docs', 'rules', 'rules.json');
  try {
    return JSON.parse(fs.readFileSync(rulesPath, 'utf8')) as RulesJson;
  } catch {
    console.warn(`[runtime] rules.json not found or invalid for profile=${profile} (expected at ${rulesPath})`);
    return null;
  }
}

export async function loadBoundaries(
  repoRoot: string,
  profile: string,
  profilesDir?: string
): Promise<BoundariesConfig | null> {
  const root = await resolveProfileRoot(repoRoot, profile, profilesDir);
  const boundariesPath = path.join(root, 'docs', 'rules', 'boundaries.json');
  try {
    return JSON.parse(fs.readFileSync(boundariesPath, 'utf8')) as BoundariesConfig;
  } catch {
    return null;
  }
}
