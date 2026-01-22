/**
 * @module @kb-labs/review-heuristic/adapters/eslint-adapter
 * ESLint adapter for TypeScript/JavaScript analysis.
 *
 * Converts ESLint results to unified ReviewFinding format.
 */

import { ESLint } from 'eslint';
import { glob } from 'glob';
import type {
  ReviewFinding,
  FindingSeverity,
  FindingConfidence,
  FixTemplate,
} from '@kb-labs/review-contracts';

/**
 * ESLint adapter configuration.
 */
export interface ESLintAdapterConfig {
  /** ESLint config file path (optional) */
  configFile?: string;

  /** Inline ESLint config (optional, takes precedence over configFile) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inlineConfig?: any;

  /** File patterns to lint */
  patterns: string[];

  /** Working directory */
  cwd: string;

  /** Whether to include fixable issues */
  fix?: boolean;
}

/**
 * ESLint severity to ReviewFinding severity.
 */
function mapSeverity(eslintSeverity: number): FindingSeverity {
  if (eslintSeverity === 2) {
    return 'high'; // error
  }
  if (eslintSeverity === 1) {
    return 'medium'; // warning
  }
  return 'info'; // off
}

/**
 * ESLint adapter.
 *
 * Runs ESLint on specified files and converts results to ReviewFinding[].
 */
export class ESLintAdapter {
  private eslint: ESLint;

  constructor(private config: ESLintAdapterConfig) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eslintOptions: any = {
      cwd: config.cwd,
      fix: config.fix ?? false,
    };

    // Use inline config if provided, otherwise use config file
    if (config.inlineConfig) {
      eslintOptions.baseConfig = config.inlineConfig;
      eslintOptions.useEslintrc = false; // Don't load .eslintrc files
    } else if (config.configFile) {
      eslintOptions.overrideConfigFile = config.configFile;
    }

    this.eslint = new ESLint(eslintOptions);
  }

  /**
   * Run ESLint analysis.
   *
   * @returns Array of review findings
   */
  async analyze(): Promise<ReviewFinding[]> {
    // Resolve file patterns
    const files = await this.resolveFiles();

    if (files.length === 0) {
      return [];
    }

    // Run ESLint
    const results = await this.eslint.lintFiles(files);

    // Convert to ReviewFinding
    const findings: ReviewFinding[] = [];

    for (const result of results) {
      if (result.messages.length === 0) {
        continue;
      }

      for (const message of result.messages) {
        const finding = this.convertMessage(result.filePath, message);
        findings.push(finding);
      }
    }

    return findings;
  }

  /**
   * Resolve file patterns to actual file paths.
   */
  private async resolveFiles(): Promise<string[]> {
    const allFiles: string[] = [];

    for (const pattern of this.config.patterns) {
      const matches = await glob(pattern, {
        cwd: this.config.cwd,
        absolute: true,
        ignore: [
          '**/node_modules/**',
          '**/dist/**',
          '**/build/**',
          '**/.git/**',
          '**/.env',
          '**/.env.*',
          '**/.ssh/**',
          '**/credentials/**',
          '**/password/**',
          '**/*.pem',
          '**/*.key',
          '**/*.secret',
        ],
      });

      allFiles.push(...matches);
    }

    // Deduplicate and filter out security-sensitive patterns
    const uniqueFiles = [...new Set(allFiles)];

    // Additional safety filter to match platform security patterns
    const securityPatterns = [
      /node_modules/,
      /\.git\//,
      /\.env$/,
      /\.env\./,
      /\.ssh/,
      /\/etc\//,
      /\/usr\//,
      /\/var\//,
      /credentials/i,
      /password/i,
      /\.pem$/,
      /\.key$/,
      /\.secret$/,
    ];

    return uniqueFiles.filter(file => {
      return !securityPatterns.some(pattern => pattern.test(file));
    });
  }

  /**
   * Convert ESLint message to ReviewFinding.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private convertMessage(filePath: string, message: any): ReviewFinding {
    const severity = mapSeverity(message.severity);

    // ESLint confidence is always 'certain' (deterministic)
    const confidence: FindingConfidence = 'certain';

    // Generate fix template if available
    let fix: FixTemplate[] | undefined;
    if (message.fix) {
      fix = [
        {
          type: 'replace',
          replacement: message.fix.text,
          position: {
            line: message.line ?? 1,
            column: message.column ?? 1,
          },
        },
      ];
    }

    // Determine scope
    const scope = message.fix ? 'local' : 'global';

    return {
      id: this.generateId(filePath, message),
      ruleId: message.ruleId ?? 'eslint/unknown',
      type: 'code-quality',
      severity,
      confidence,
      file: filePath,
      line: message.line ?? 1,
      column: message.column ?? 1,
      endLine: message.endLine ?? message.line ?? 1,
      message: message.message,
      engine: 'eslint',
      source: 'heuristic',
      fix,
      scope,
      automated: !!message.fix,
    };
  }

  /**
   * Generate unique ID for finding.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private generateId(filePath: string, message: any): string {
    const parts = [
      'eslint',
      filePath,
      message.ruleId ?? 'unknown',
      message.line ?? '0',
      message.column ?? '0',
    ];

    return parts.join(':');
  }
}

/**
 * Quick helper to run ESLint analysis.
 *
 * @param patterns - File patterns to lint
 * @param cwd - Working directory
 * @param configFile - ESLint config file path (optional)
 * @param inlineConfig - Inline ESLint config (optional, takes precedence)
 * @returns Array of review findings
 */
export async function analyzeWithESLint(
  patterns: string[],
  cwd: string,
  configFile?: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inlineConfig?: any
): Promise<ReviewFinding[]> {
  const adapter = new ESLintAdapter({
    patterns,
    cwd,
    configFile,
    inlineConfig,
    fix: false,
  });

  return adapter.analyze();
}
