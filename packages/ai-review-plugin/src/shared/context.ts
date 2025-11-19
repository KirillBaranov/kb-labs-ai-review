import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

import { resolveProfileRoot } from '../domain/profile.js';

export interface BuildContextOptions {
  profile: string;
  repoRoot: string;
  profilesDir?: string;
  includeAdr?: boolean;
  includeBoundaries?: boolean;
  prettyJson?: number;
  maxBytes?: number;
  maxApproxTokens?: number;
}

export interface ContextBuildResult {
  markdown: string;
  bytes: number;
  approxTokens: number;
  baseHash: string;
  finalHash: string;
  sections: {
    handbook: number;
    adr: number;
    hasBoundaries: boolean;
  };
}

type FileBlob = { path: string; content: string; bytes: number };

function normalizeText(s: string): string {
  if (s.length && s.charCodeAt(0) === 0xfeff) {
    s = s.slice(1);
  }
  s = s.replace(/\r\n?/g, '\n');
  s = s.split('\n').map(line => line.replace(/[ \t]+$/g, '')).join('\n');
  return s;
}

function sha1(buf: string | Buffer) {
  return crypto.createHash('sha1').update(buf).digest('hex');
}

function safeRead(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

function approxTokens(s: string): number {
  return s.split(/\s+/g).filter(Boolean).length;
}

function listMarkdown(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs
    .readdirSync(dir)
    .filter(f => f.toLowerCase().endsWith('.md'))
    .map(f => path.join(dir, f))
    .sort((a, b) => a.localeCompare(b));
}

function listADR(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs
    .readdirSync(dir)
    .filter(f => /\.md$/i.test(f))
    .map(f => path.join(dir, f))
    .sort((a, b) => a.localeCompare(b));
}

function readBlobs(files: string[]): FileBlob[] {
  const out: FileBlob[] = [];
  for (const p of files) {
    const raw = safeRead(p);
    if (!raw) {
      continue;
    }
    const content = normalizeText(raw);
    out.push({ path: p, content, bytes: Buffer.byteLength(content, 'utf8') });
  }
  return out;
}

function rel(p: string, rootHint: string, repoRoot: string) {
  const try1 = path.relative(rootHint, p);
  return try1 && !try1.startsWith('..') ? try1 : path.relative(repoRoot, p);
}

function buildTOC(blobs: FileBlob[], baseLabel: string, rootHint: string, repoRoot: string): string {
  if (blobs.length === 0) {
    return '';
  }
  const items = blobs.map(b => `- ${rel(b.path, rootHint, repoRoot)}`).join('\n');
  return [`### ${baseLabel} TOC`, '', items, ''].join('\n');
}

export async function buildContextDocument(options: BuildContextOptions): Promise<ContextBuildResult> {
  const {
    profile,
    repoRoot,
    profilesDir,
    includeAdr = true,
    includeBoundaries = true,
    prettyJson = 2,
    maxBytes = 1_500_000,
    maxApproxTokens
  } = options;

  const profilesRoot = await resolveProfileRoot(repoRoot, profile, profilesDir);
  const profileDocs = path.join(profilesRoot, 'docs');

  const hbDir = path.join(profileDocs, 'handbook');
  const rulesPath = path.join(profileDocs, 'rules', 'rules.json');
  const boundariesPath = path.join(profileDocs, 'rules', 'boundaries.json');
  const adrDir = path.join(profileDocs, 'adr');

  const hbBlobs = readBlobs(listMarkdown(hbDir));
  const rulesRaw = safeRead(rulesPath);
  if (!rulesRaw) {
    throw new Error(`rules.json not found: ${rulesPath}`);
  }
  let rulesPretty = rulesRaw;
  try {
    rulesPretty = JSON.stringify(JSON.parse(rulesRaw), null, prettyJson);
  } catch {
    // keep raw
  }

  let boundariesPretty = '';
  if (includeBoundaries) {
    const boundariesRaw = safeRead(boundariesPath);
    if (boundariesRaw) {
      try {
        boundariesPretty = JSON.stringify(JSON.parse(boundariesRaw), null, prettyJson);
      } catch {
        boundariesPretty = boundariesRaw;
      }
    }
  }

  const adrBlobs = includeAdr ? readBlobs(listADR(adrDir)) : [];

  const ts = new Date().toISOString();
  const meta = {
    profile,
    profilesDir: profilesRoot,
    generatedAt: ts,
    handbookFiles: hbBlobs.map(b => b.path),
    rulesFile: rulesPath,
    boundariesFile: includeBoundaries && fs.existsSync(boundariesPath) ? boundariesPath : null,
    adrFiles: adrBlobs.map(b => b.path)
  };
  const metaPretty = JSON.stringify(meta, null, 2);

  const parts: string[] = [];
  parts.push('---');
  parts.push('title: KB Labs AI Review Context');
  parts.push(`profile: ${profile}`);
  parts.push(`generatedAt: ${ts}`);
  parts.push(`hashSeed: ${sha1(JSON.stringify(meta))}`);
  parts.push('---');
  parts.push('');

  parts.push('<!-- AI_REVIEW:SECTION:SUMMARY -->');
  parts.push('# KB Labs AI Review — Context');
  parts.push('');
  parts.push('This document is the single source of truth for the current review run.');
  parts.push('');
  parts.push('## Metadata');
  parts.push('```json');
  parts.push(metaPretty);
  parts.push('```');
  parts.push('<!-- AI_REVIEW:SECTION:SUMMARY:END -->');
  parts.push('');

  parts.push('<!-- AI_REVIEW:SECTION:HANDBOOK -->');
  parts.push('# Handbook');
  parts.push('');
  parts.push(buildTOC(hbBlobs, 'Handbook', profilesRoot, repoRoot));
  for (const blob of hbBlobs) {
    parts.push(`## ${path.basename(blob.path)}`);
    parts.push('');
    parts.push(blob.content);
    parts.push('');
    parts.push('---');
    parts.push('');
  }
  parts.push('<!-- AI_REVIEW:SECTION:HANDBOOK:END -->');
  parts.push('');

  parts.push('<!-- AI_REVIEW:SECTION:RULES -->');
  parts.push('# Rules');
  parts.push('');
  parts.push('> Source: `profiles/<profile>/docs/rules/rules.json`');
  parts.push('```json');
  parts.push(rulesPretty);
  parts.push('```');
  if (boundariesPretty) {
    parts.push('');
    parts.push('## Boundaries');
    parts.push('> Source: `profiles/<profile>/docs/rules/boundaries.json`');
    parts.push('```json');
    parts.push(boundariesPretty);
    parts.push('```');
  }
  parts.push('<!-- AI_REVIEW:SECTION:RULES:END -->');
  parts.push('');

  if (includeAdr && adrBlobs.length > 0) {
    parts.push('<!-- AI_REVIEW:SECTION:ADR -->');
    parts.push('# ADR');
    parts.push('');
    parts.push(buildTOC(adrBlobs, 'ADR', profilesRoot, repoRoot));
    for (const blob of adrBlobs) {
      parts.push(`## ${path.basename(blob.path)}`);
      parts.push('');
      parts.push(blob.content);
      parts.push('');
      parts.push('---');
      parts.push('');
    }
    parts.push('<!-- AI_REVIEW:SECTION:ADR:END -->');
    parts.push('');
  }

  let output = parts.join('\n');
  const baseHash = sha1(output);

  if (maxApproxTokens) {
    const tokens = approxTokens(output);
    if (tokens > maxApproxTokens) {
      output = output.replace(
        /\n?<!-- AI_REVIEW:SECTION:ADR -->[\s\S]*?<!-- AI_REVIEW:SECTION:ADR:END -->/m,
        '\n<!-- AI_REVIEW:SECTION:ADR -->\n# ADR\n\n*Omitted due to context size constraints.*\n<!-- AI_REVIEW:SECTION:ADR:END -->\n'
      );
    }
  }

  if (Buffer.byteLength(output, 'utf8') > maxBytes) {
    output = output
      .replace(
        /<!-- AI_REVIEW:SECTION:HANDBOOK -->[\s\S]*?<!-- AI_REVIEW:SECTION:HANDBOOK:END -->/m,
        '<!-- AI_REVIEW:SECTION:HANDBOOK -->\n# Handbook\n\n*Omitted due to size limit.*\n<!-- AI_REVIEW:SECTION:HANDBOOK:END -->\n'
      )
      .replace(
        /<!-- AI_REVIEW:SECTION:ADR -->[\s\S]*?<!-- AI_REVIEW:SECTION:ADR:END -->/m,
        '<!-- AI_REVIEW:SECTION:ADR -->\n# ADR\n\n*Omitted due to size limit.*\n<!-- AI_REVIEW:SECTION:ADR:END -->\n'
      );
  }

  const finalHash = sha1(output);

  output += '\n---\n## Checksums\n```json\n';
  output += JSON.stringify({ baseHash, finalHash }, null, 2) + '\n';
  output += '```\n';

  const result: ContextBuildResult = {
    markdown: output,
    bytes: Buffer.byteLength(output, 'utf8'),
    approxTokens: approxTokens(output),
    baseHash,
    finalHash,
    sections: {
      handbook: hbBlobs.length,
      adr: adrBlobs.length,
      hasBoundaries: Boolean(boundariesPretty)
    }
  };

  return result;
}
