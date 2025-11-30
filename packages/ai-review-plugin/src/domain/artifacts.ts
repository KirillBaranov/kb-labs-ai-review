import fs from 'node:fs/promises';
import path from 'node:path';
import { renderMarkdown } from '@kb-labs/ai-review-core';
import type { AiReviewRun, AiReviewArtifacts } from '@kb-labs/ai-review-contracts';
import { toReviewFindings } from './findings';

async function ensureDirForFile(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

function transportMarkdown(run: AiReviewRun): string {
  const json = JSON.stringify(run, null, 2);
  return [
    '<!-- AI_REVIEW:DUAL:JSON -->',
    '```json',
    json,
    '```',
    '<!-- AI_REVIEW:DUAL:JSON:END -->',
    ''
  ].join('\n');
}

function renderHtml(markdown: string, title: string): string {
  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const autoLink = (s: string) =>
    s.replace(/\bhttps?:\/\/[^\s)]+/g, url => `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(url)}</a>`);

  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const out: string[] = [];
  let inCode = false;
  let codeBuf: string[] = [];
  let listOpen = false;

  const flushList = () => {
    if (listOpen) {
      out.push('</ul>');
      listOpen = false;
    }
  };

  const openListIfNeeded = () => {
    if (!listOpen) {
      out.push('<ul>');
      listOpen = true;
    }
  };

  for (const line of lines) {
    const fence = line.match(/^```(.*)$/);
    if (fence) {
      if (!inCode) {
        inCode = true;
        codeBuf = [];
      } else {
        const codeHtml = `<pre><code>${escape(codeBuf.join('\n'))}</code></pre>`;
        out.push(codeHtml);
        inCode = false;
      }
      continue;
    }
    if (inCode) {
      codeBuf.push(line);
      continue;
    }

    if (/^---\s*$/.test(line)) {
      flushList();
      out.push('<hr/>');
      continue;
    }

    if (/^#\s+/.test(line)) {
      flushList();
      out.push(`<h1>${escape(line.replace(/^#\s+/, ''))}</h1>`);
      continue;
    }
    if (/^##\s+/.test(line)) {
      flushList();
      out.push(`<h2>${escape(line.replace(/^##\s+/, ''))}</h2>`);
      continue;
    }
    if (/^###\s+/.test(line)) {
      flushList();
      out.push(`<h3>${escape(line.replace(/^###\s+/, ''))}</h3>`);
      continue;
    }

    if (/^\s*-\s+/.test(line)) {
      openListIfNeeded();
      const text = line.replace(/^\s*-\s+/, '');
      const withInline = autoLink(escape(text)).replace(/`([^`]+)`/g, '<code>$1</code>');
      out.push(`<li>${withInline}</li>`);
      continue;
    }

    if (line.trim() === '') {
      flushList();
      out.push('<br/>');
      continue;
    }

    flushList();
    const withInline = autoLink(escape(line)).replace(/`([^`]+)`/g, '<code>$1</code>');
    out.push(`<p>${withInline}</p>`);
  }

  flushList();

  const escTitle = escape(title);
  return `<!doctype html>
<html lang="en">
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escTitle}</title>
<style>
  :root { color-scheme: light dark; }
  body {
    font: 14px/1.55 system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,'Helvetica Neue',Arial,sans-serif;
    max-width: 900px;
    margin: 32px auto;
    padding: 0 16px;
  }
  h1 { font-size: 22px; margin: .6em 0; }
  h2 { font-size: 18px; margin: 1.2em 0 .4em; }
  h3 { font-size: 16px; margin: 1em 0 .4em; }
  ul { margin: .3em 0 1em 1.2em; padding: 0; }
  li { margin: .25em 0; }
  a { text-decoration: underline; }
  code {
    font-family: ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;
    background: rgba(127,127,127,.12);
    padding: .1em .3em;
    border-radius: .25rem;
  }
  pre {
    background: rgba(127,127,127,.12);
    padding: 12px;
    border-radius: .5rem;
    overflow: auto;
  }
  hr { border: 0; height: 1px; background: linear-gradient(90deg,transparent,#ccc,transparent); margin: 1.2em 0; }
</style>
<body>
${out.join('\n')}
</body></html>`;
}

export async function writeReviewArtifacts(options: {
  run: AiReviewRun;
  reviewJsonPath: string;
  reviewMdPath: string;
  humanMarkdownPath?: string;
  htmlPath?: string;
  contextPath?: string;
}): Promise<AiReviewArtifacts> {
  const { run, reviewJsonPath, reviewMdPath, humanMarkdownPath, htmlPath, contextPath } = options;

  await ensureDirForFile(reviewJsonPath);
  await ensureDirForFile(reviewMdPath);
  if (humanMarkdownPath) {
    await ensureDirForFile(humanMarkdownPath);
  }
  if (htmlPath) {
    await ensureDirForFile(htmlPath);
  }

  await fs.writeFile(reviewJsonPath, JSON.stringify(run, null, 2), 'utf8');
  await fs.writeFile(reviewMdPath, transportMarkdown(run), 'utf8');

  const reviewFindings = toReviewFindings(run.findings);

  let humanPathResolved: string | undefined;
  let htmlPathResolved: string | undefined;

  if (humanMarkdownPath) {
    const markdown = renderMarkdown(reviewFindings);
    await fs.writeFile(humanMarkdownPath, markdown, 'utf8');
    humanPathResolved = humanMarkdownPath;
  }

  if (htmlPath) {
    const markdown = humanMarkdownPath
      ? await fs.readFile(humanMarkdownPath, 'utf8')
      : renderMarkdown(reviewFindings);
    const title = `KB Labs AI Review — ${run.profile}`;
    const html = renderHtml(markdown, title);
    await fs.writeFile(htmlPath, html, 'utf8');
    htmlPathResolved = htmlPath;
  }

  return {
    reviewJson: reviewJsonPath,
    reviewMd: reviewMdPath,
    reviewHumanMd: humanPathResolved,
    reviewHtml: htmlPathResolved,
    context: contextPath
  };
}
