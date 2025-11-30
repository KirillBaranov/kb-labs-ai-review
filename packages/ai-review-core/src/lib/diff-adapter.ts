/**
 * Adapter to convert @kb-labs/shared-diff ParsedDiff format
 * to ai-review's FileDiff[] format for engine compatibility
 */

import type { ParsedDiff } from '@kb-labs/shared-diff';
import type { FileDiff, Hunk } from './types';

/**
 * Convert ParsedDiff (shared format) to FileDiff[] (ai-review format)
 *
 * Shared format: { files: string[], addedByFile: Record<...>, hunksByFile: Record<...> }
 * ai-review format: FileDiff[] with { filePath, hunks: Hunk[] }
 */
export function parsedDiffToFileDiffs(parsed: ParsedDiff): FileDiff[] {
  const result: FileDiff[] = [];

  for (const filePath of parsed.files) {
    const hunks: Hunk[] = [];
    const hunksForFile = parsed.hunksByFile[filePath] || [];
    const addedByFile = parsed.addedByFile[filePath] || [];

    const addedLinesByLineNumber = new Map<number, string>();
    for (const added of addedByFile) {
      addedLinesByLineNumber.set(added.line, added.text);
    }

    for (const hunk of hunksForFile) {
      const aiReviewHunk: Hunk = {
        oldStart: hunk.oldStart,
        oldLines: hunk.oldLines ?? 0,
        newStart: hunk.newStart,
        newLines: hunk.newLines ?? 0,
        header: hunk.header || `@@ -${hunk.oldStart},${hunk.oldLines ?? 0} +${hunk.newStart},${hunk.newLines ?? 0} @@`,
        added: []
      };

      if (hunk.newLines === 0 || hunk.newLines === undefined) {
        const addedText = addedLinesByLineNumber.get(hunk.newStart);
        if (addedText !== undefined) {
          aiReviewHunk.added.push({
            line: hunk.newStart,
            text: addedText
          });
        }
      } else {
        const hunkEnd = hunk.newStart + hunk.newLines;
        for (let lineNum = hunk.newStart; lineNum < hunkEnd; lineNum++) {
          const addedText = addedLinesByLineNumber.get(lineNum);
          if (addedText !== undefined) {
            aiReviewHunk.added.push({
              line: lineNum,
              text: addedText
            });
          }
        }
      }

      hunks.push(aiReviewHunk);
    }

    result.push({
      filePath,
      hunks
    });
  }

  return result;
}

export function hunkLocator(h: Hunk): string {
  return `HUNK:@@ -${h.oldStart},${h.oldLines} +${h.newStart},${h.newLines} @@`;
}
