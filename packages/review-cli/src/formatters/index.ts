/**
 * @module @kb-labs/review-cli/formatters
 * Output formatters for code review results.
 */

import type { ReviewFinding, ReviewResult } from '@kb-labs/review-contracts';
import chalk from 'chalk';

/**
 * Format findings as text.
 */
export function formatFindings(findings: ReviewFinding[]): string {
  if (findings.length === 0) {
    return chalk.green('✓ No issues found!');
  }

  const lines: string[] = [];

  // Group by severity
  const byFile = new Map<string, ReviewFinding[]>();

  for (const finding of findings) {
    if (!byFile.has(finding.file)) {
      byFile.set(finding.file, []);
    }
    byFile.get(finding.file)!.push(finding);
  }

  // Format by file
  for (const [file, fileFindings] of byFile) {
    lines.push('');
    lines.push(chalk.bold.white(file));

    for (const finding of fileFindings) {
      const severity = formatSeverity(finding.severity);
      const location = chalk.dim(`${finding.line}:${finding.column ?? 0}`);
      const message = finding.message;
      const ruleId = chalk.dim(`[${finding.ruleId}]`);

      lines.push(`  ${location} ${severity} ${message} ${ruleId}`);

      // Show fix hint if available
      if (finding.fix && finding.automated) {
        lines.push(chalk.dim('    ⚡ Auto-fixable'));
      }
    }
  }

  return lines.join('\n');
}

/**
 * Format severity with color.
 */
function formatSeverity(severity: string): string {
  switch (severity) {
    case 'blocker':
      return chalk.bgRed.white(' BLOCKER ');
    case 'high':
      return chalk.red('error');
    case 'medium':
      return chalk.yellow('warning');
    case 'low':
      return chalk.blue('info');
    case 'info':
      return chalk.gray('hint');
    default:
      return severity;
  }
}

/**
 * Format summary statistics.
 */
export function formatSummary(result: ReviewResult): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(chalk.bold('Summary'));
  lines.push('─'.repeat(50));

  // Count by severity
  const counts = {
    blocker: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };

  for (const finding of result.findings) {
    counts[finding.severity]++;
  }

  // Format counts
  if (counts.blocker > 0) {
    lines.push(chalk.red(`  Blocker: ${counts.blocker}`));
  }
  if (counts.high > 0) {
    lines.push(chalk.red(`  High:    ${counts.high}`));
  }
  if (counts.medium > 0) {
    lines.push(chalk.yellow(`  Medium:  ${counts.medium}`));
  }
  if (counts.low > 0) {
    lines.push(chalk.blue(`  Low:     ${counts.low}`));
  }
  if (counts.info > 0) {
    lines.push(chalk.gray(`  Info:    ${counts.info}`));
  }

  lines.push('');
  lines.push(`  Total:   ${result.findings.length}`);
  lines.push(`  Files:   ${result.metadata.analyzedFiles}`);
  lines.push(`  Time:    ${result.metadata.durationMs}ms`);
  lines.push(`  Engines: ${result.metadata.engines.join(', ')}`);

  return lines.join('\n');
}
