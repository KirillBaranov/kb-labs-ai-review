/**
 * @module @kb-labs/review-llm/llm-lite/llm-lite-analyzer
 * LLM-Lite analyzer for efficient code review.
 *
 * Uses batch tools, diff-based context, and anti-hallucination verification.
 */

import type { ReviewFinding, InputFile, IDiffProvider } from '@kb-labs/review-contracts';
import { useLLM, useAnalytics } from '@kb-labs/sdk';
import {
  createToolExecutor,
  buildToolDefinitions,
  type RawFinding,
  type ToolCall,
} from './tool-executor.js';
import { createVerificationEngine, type VerificationResult } from './verification.js';
import { getCategoryValidator } from './category-validator.js';

/**
 * LLM-Lite review request
 */
export interface LLMLiteRequest {
  /** Working directory */
  cwd: string;
  /** Changed files with content */
  files: InputFile[];
  /** Task context (what the changes are trying to achieve) */
  taskContext?: string;
  /** Repository scope */
  repoScope?: string[];
  /** Diff provider (injected from review-core to avoid circular dependency) */
  diffProvider: IDiffProvider;
}

/**
 * LLM-Lite review result
 */
export interface LLMLiteResult {
  /** Verified findings */
  findings: ReviewFinding[];
  /** Metadata */
  metadata: {
    /** LLM calls made */
    llmCalls: number;
    /** Tool calls made */
    toolCalls: {
      get_diffs: number;
      get_file_chunks: number;
      report_findings: number;
    };
    /** Token usage */
    tokens: {
      input: number;
      output: number;
      total: number;
    };
    /** Estimated cost in USD */
    estimatedCost: number;
    /** Verification stats */
    verification: {
      rawFindings: number;
      verified: number;
      downgraded: number;
      discarded: number;
      hallucinationRate: number;
    };
    /** Timing */
    timing: {
      totalMs: number;
      llmMs: number;
      verifyMs: number;
    };
  };
}

/**
 * File summary for initial prompt
 */
interface FileSummary {
  path: string;
  additions: number;
  deletions: number;
  isNewFile: boolean;
}

/**
 * Turn limits
 */
const MIN_TURNS = 3;
const MAX_TURNS = 10;

/**
 * Calculate adaptive turn limit based on workload
 *
 * Formula:
 * - Base: 3 turns (get_diffs + analyze + report)
 * - +1 turn per 10 files (more files = more get_diffs calls needed)
 * - +1 turn per 500 lines changed (more changes = more context needed)
 * - Capped at 10 turns (cost control)
 */
function calculateMaxTurns(fileCount: number, totalChangedLines: number): number {
  const baseTurns = MIN_TURNS;
  const turnsForFiles = Math.ceil(fileCount / 10);
  const turnsForLines = Math.ceil(totalChangedLines / 500);
  return Math.min(MAX_TURNS, baseTurns + turnsForFiles + turnsForLines);
}

/**
 * Token costs (GPT-4 pricing approximation)
 */
const TOKEN_COSTS = {
  input: 0.00003, // $0.03 per 1K input tokens
  output: 0.00006, // $0.06 per 1K output tokens
};

/**
 * LLM-Lite Analyzer
 *
 * Efficient code review using:
 * - Batch tools (get_diffs, get_file_chunks, report_findings)
 * - Diff-based context (not full files)
 * - Anti-hallucination verification
 * - Dynamic categories from rules directory
 */
export class LLMLiteAnalyzer {
  private cwd: string;
  private files: InputFile[];
  private taskContext?: string;
  private repoScope?: string[];
  private diffProvider: IDiffProvider;

  constructor(request: LLMLiteRequest) {
    this.cwd = request.cwd;
    this.files = request.files;
    this.taskContext = request.taskContext;
    this.repoScope = request.repoScope;
    this.diffProvider = request.diffProvider;
  }

  /**
   * Run LLM-Lite analysis
   */
  async analyze(): Promise<LLMLiteResult> {
    const startTime = Date.now();
    const analytics = useAnalytics();

    // Track start
    analytics?.track('review:llm-lite:started', {
      fileCount: this.files.length,
      hasTaskContext: !!this.taskContext,
    });

    // Initialize
    const llm = useLLM({ tier: 'medium' });
    if (!llm) {
      throw new Error('LLM not available for llm-lite mode');
    }

    // Get category validator
    const categoryValidator = await getCategoryValidator(this.cwd);
    const validCategories = categoryValidator.getValidCategories();
    const categoryAliases = categoryValidator.getCategoryAliases();

    // Build file summaries for initial prompt
    const fileSummaries = this.buildFileSummaries();

    // Calculate adaptive turn limit based on workload
    const totalChangedLines = fileSummaries.reduce(
      (sum, f) => sum + f.additions + f.deletions,
      0
    );
    const maxTurns = calculateMaxTurns(this.files.length, totalChangedLines);

    // Create tool executor
    const changedFiles = this.files.map(f => f.path);
    const toolExecutor = createToolExecutor(this.cwd, changedFiles, this.diffProvider);

    // Build tools with dynamic categories
    const tools = buildToolDefinitions(validCategories);

    // Build initial prompt
    const systemPrompt = this.buildSystemPrompt(validCategories);
    const initialPrompt = this.buildInitialPrompt(fileSummaries);

    // Conversation loop
    // Note: Using 'user' role for tool results to avoid Anthropic tool_use/tool_result format issues
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      { role: 'user', content: initialPrompt },
    ];

    let llmCalls = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let llmTimeMs = 0;
    let rawFindings: RawFinding[] = [];

    const toolCallCounts = {
      get_diffs: 0,
      get_file_chunks: 0,
      report_findings: 0,
    };

    // Tool calling loop (adaptive based on workload)
    for (let turn = 0; turn < maxTurns; turn++) {
      const llmStart = Date.now();
      const isLastTurn = turn === maxTurns - 1;

      // On last turn, only offer report_findings to force conclusion
      const availableTools = isLastTurn
        ? tools.filter(t => t.name === 'report_findings')
        : tools;

      // Call LLM with tools
      const response = await llm.chatWithTools!(
        [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        {
          tools: availableTools.map(t => ({
            name: t.name,
            description: t.description,
            inputSchema: t.parameters,
          })),
        }
      );

      llmCalls++;
      llmTimeMs += Date.now() - llmStart;

      // Track token usage (if available)
      if (response.usage) {
        totalInputTokens += response.usage.promptTokens ?? 0;
        totalOutputTokens += response.usage.completionTokens ?? 0;
      }

      // Check for tool calls
      const toolCalls = response.toolCalls ?? [];

      if (toolCalls.length === 0) {
        // No more tool calls - done
        break;
      }

      // Add assistant message
      messages.push({
        role: 'assistant',
        content: response.content ?? '',
      });

      // Execute tool calls
      for (const toolCall of toolCalls) {
        const parsed: ToolCall = {
          name: toolCall.name,
          arguments: toolCall.input as Record<string, unknown>,
        };

        // Track tool call count
        if (parsed.name in toolCallCounts) {
          toolCallCounts[parsed.name as keyof typeof toolCallCounts]++;
        }

        // Execute
        const result = await toolExecutor.execute(parsed);

        // Add tool result to messages
        // Using 'user' role with formatted text to avoid Anthropic tool_use/tool_result format issues
        // This is the same approach used by agent-executor
        messages.push({
          role: 'user',
          content: `Tool result (${parsed.name}):\n${JSON.stringify(result.result, null, 2)}`,
        });

        // Check for report_findings (end condition)
        if (parsed.name === 'report_findings' && result.result) {
          const reportResult = result.result as { findings?: RawFinding[] };
          if (reportResult.findings) {
            rawFindings = reportResult.findings;
          }
        }
      }

      // If we got findings, we're done
      if (rawFindings.length > 0 || toolCallCounts.report_findings > 0) {
        break;
      }
    }

    // Verification phase
    const verifyStart = Date.now();

    const verificationEngine = createVerificationEngine(
      this.cwd,
      changedFiles,
      toolExecutor.getFetchedDiffs(),
      validCategories,
      categoryAliases
    );

    const verificationResult = await verificationEngine.verify(rawFindings);
    const verifyTimeMs = Date.now() - verifyStart;

    // Convert to ReviewFinding format
    const findings = this.convertToReviewFindings(verificationResult);

    // Calculate cost
    const estimatedCost =
      (totalInputTokens * TOKEN_COSTS.input) +
      (totalOutputTokens * TOKEN_COSTS.output);

    // Track completion
    analytics?.track('review:llm-lite:completed', {
      fileCount: this.files.length,
      findingsCount: findings.length,
      llmCalls,
      hallucinationRate: verificationResult.stats.hallucinationRate,
      estimatedCost,
    });

    return {
      findings,
      metadata: {
        llmCalls,
        toolCalls: toolCallCounts,
        tokens: {
          input: totalInputTokens,
          output: totalOutputTokens,
          total: totalInputTokens + totalOutputTokens,
        },
        estimatedCost,
        verification: {
          rawFindings: verificationResult.stats.total,
          verified: verificationResult.verified.length,
          downgraded: verificationResult.stats.downgraded,
          discarded: verificationResult.stats.discarded,
          hallucinationRate: verificationResult.stats.hallucinationRate,
        },
        timing: {
          totalMs: Date.now() - startTime,
          llmMs: llmTimeMs,
          verifyMs: verifyTimeMs,
        },
      },
    };
  }

  /**
   * Build file summaries for initial prompt
   */
  private buildFileSummaries(): FileSummary[] {
    return this.files.map(f => {
      const lines = f.content.split('\n');
      // Simple heuristic: new files have all additions
      // TODO: Get actual git stats
      return {
        path: f.path,
        additions: lines.length,
        deletions: 0,
        isNewFile: false,
      };
    });
  }

  /**
   * Build system prompt
   */
  private buildSystemPrompt(validCategories: string[]): string {
    const categoryList = validCategories.length > 0
      ? `\n\nValid categories (you MUST use only these):\n${validCategories.map(c => `- ${c}`).join('\n')}`
      : '';

    return `You are a code reviewer analyzing changes in a codebase.

Your goal is to find REAL issues in the code - not hypothetical problems.

## Instructions

1. First, use get_diffs() to fetch diffs for suspicious files
2. Analyze the actual changes in the diffs
3. If you need more context, use get_file_chunks() sparingly
4. Report all findings using report_findings()

## Important Rules

- Only report issues you actually see in the code
- Include specific line numbers FROM THE DIFFS
- Include code snippets to prove the issue exists
- Focus on: security, correctness, performance, maintainability
- Don't report style issues unless they affect readability significantly
${categoryList}

## Severity Guide

- blocker: Security vulnerability, data loss risk, crash
- high: Bug, incorrect behavior, performance issue
- medium: Code smell, potential issue, minor bug
- low: Suggestion, improvement opportunity
- info: Note, observation`;
  }

  /**
   * Build initial prompt with file list
   */
  private buildInitialPrompt(files: FileSummary[]): string {
    const fileList = files.map(f => {
      const stats = `+${f.additions}/-${f.deletions}`;
      const status = f.isNewFile ? 'new file' : 'modified';
      return `- ${f.path} (${stats}, ${status})`;
    }).join('\n');

    let prompt = `## Files Changed (${files.length} files)

${fileList}`;

    if (this.taskContext) {
      prompt += `\n\n## Task Context\n${this.taskContext}`;
    }

    if (this.repoScope?.length) {
      prompt += `\n\n## Repository Scope\n${this.repoScope.join(', ')}`;
    }

    prompt += `\n\n## Your Task

1. Review the file list and identify files most likely to have issues:
   - Security-sensitive files (auth, crypto, input handling)
   - Files with large changes (+50 lines)
   - New files (need thorough review)
   - Core business logic

2. Use get_diffs() to fetch diffs for suspicious files (max 15 per call)

3. Analyze the diffs for:
   - Security vulnerabilities
   - Logic errors and edge cases
   - Performance issues
   - Code quality problems

4. Report all findings using report_findings()

Focus on ACTUAL issues in the changed code, not hypothetical problems.`;

    return prompt;
  }

  /**
   * Convert verified findings to ReviewFinding format
   */
  private convertToReviewFindings(result: VerificationResult): ReviewFinding[] {
    return result.verified.map(v => {
      // Map verification action to confidence level
      const confidence = v.action === 'keep' ? 'certain' as const
        : v.action === 'downgrade' ? 'likely' as const
        : 'heuristic' as const;

      return {
        id: `llm-lite-${v.finding.file}-${v.finding.line}`,
        ruleId: `llm-lite:${v.finding.category}`,
        file: v.finding.file,
        line: v.finding.line,
        endLine: v.finding.endLine,
        column: 1,
        message: v.finding.message,
        severity: v.finding.severity as 'blocker' | 'high' | 'medium' | 'low' | 'info',
        confidence,
        type: v.finding.category,
        engine: 'llm-lite',
        source: 'llm',
        suggestion: v.finding.suggestion,
        snippet: v.finding.codeSnippet,
      };
    });
  }
}

/**
 * Run LLM-Lite analysis
 */
export async function runLLMLiteAnalysis(request: LLMLiteRequest): Promise<LLMLiteResult> {
  const analyzer = new LLMLiteAnalyzer(request);
  return analyzer.analyze();
}
