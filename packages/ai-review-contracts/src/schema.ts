import { z } from 'zod';

export const AiReviewSeveritySchema = z.enum(['critical', 'major', 'minor', 'info']);
export type AiReviewSeverity = z.infer<typeof AiReviewSeveritySchema>;

export const AiReviewRiskLevelSchema = z.enum(['low', 'medium', 'high']);
export type AiReviewRiskLevel = z.infer<typeof AiReviewRiskLevelSchema>;

export const AiReviewFindingSchema = z
  .object({
    rule: z.string().min(1, 'rule id is required'),
    severity: AiReviewSeveritySchema,
    area: z.string().min(1).optional(),
    file: z.string().min(1).optional(),
    locator: z.string().min(1).optional(),
    finding: z.array(z.string().min(1)).nonempty(),
    why: z.string().min(1).optional(),
    suggestion: z.string().min(1).optional(),
    fingerprint: z.string().min(1).optional(),
    signals: z.record(z.unknown()).optional()
  })
  .strict();
export type AiReviewFinding = z.infer<typeof AiReviewFindingSchema>;

export const AiReviewRiskScoreSchema = z
  .object({
    score: z.number().min(0).max(100),
    level: AiReviewRiskLevelSchema,
    detail: z
      .object({
        weights: z.record(AiReviewSeveritySchema, z.number())
      })
      .optional()
  })
  .strict();
export type AiReviewRiskScore = z.infer<typeof AiReviewRiskScoreSchema>;

export const AiReviewFindingsBySeveritySchema = z
  .object({
    critical: z.number().int().min(0),
    major: z.number().int().min(0),
    minor: z.number().int().min(0),
    info: z.number().int().min(0)
  })
  .strict();
export type AiReviewFindingsBySeverity = z.infer<typeof AiReviewFindingsBySeveritySchema>;

export const AiReviewSummarySchema = z
  .object({
    findingsTotal: z.number().int().min(0),
    findingsBySeverity: AiReviewFindingsBySeveritySchema,
    topSeverity: AiReviewSeveritySchema.nullable().optional(),
    risk: AiReviewRiskScoreSchema.optional()
  })
  .strict();
export type AiReviewSummary = z.infer<typeof AiReviewSummarySchema>;

export const AiReviewArtifactsSchema = z
  .object({
    context: z.string().min(1).optional(),
    reviewJson: z.string().min(1),
    reviewMd: z.string().min(1),
    reviewHumanMd: z.string().min(1).optional(),
    reviewHtml: z.string().min(1).optional()
  })
  .strict();
export type AiReviewArtifacts = z.infer<typeof AiReviewArtifactsSchema>;

export const AiReviewConfigSchema = z
  .object({
    failOn: z.enum(['none', 'major', 'critical']).optional(),
    maxComments: z.number().int().min(0).optional()
  })
  .strict();
export type AiReviewConfig = z.infer<typeof AiReviewConfigSchema>;

export const AiReviewContextInfoSchema = z
  .object({
    profile: z.string().min(1).optional(),
    handbookSections: z.number().int().min(0).optional(),
    adrIncluded: z.boolean().optional(),
    boundariesIncluded: z.boolean().optional()
  })
  .strict();
export type AiReviewContextInfo = z.infer<typeof AiReviewContextInfoSchema>;

export const AiReviewRunSchema = z
  .object({
    version: z.number().int().min(1).default(1),
    runId: z.string().min(1),
    provider: z.string().min(1),
    profile: z.string().min(1),
    startedAt: z.string().datetime().optional(),
    finishedAt: z.string().datetime().optional(),
    findings: z.array(AiReviewFindingSchema),
    summary: AiReviewSummarySchema.optional(),
    artifacts: AiReviewArtifactsSchema.optional(),
    config: AiReviewConfigSchema.optional(),
    context: AiReviewContextInfoSchema.optional(),
    metadata: z.record(z.string(), z.unknown()).optional()
  })
  .strict();
export type AiReviewRun = z.infer<typeof AiReviewRunSchema>;

export const AiReviewCommandInputSchema = z
  .object({
    diff: z.string().min(1, 'diff path is required'),
    profile: z.string().min(1).optional(),
    provider: z.string().min(1).optional(),
    failOn: z.enum(['none', 'major', 'critical']).optional(),
    maxComments: z.number().int().min(0).optional(),
    profilesDir: z.string().min(1).optional(),
    render: z
      .object({
        humanMarkdown: z.boolean().optional(),
        html: z.boolean().optional()
      })
      .optional(),
    context: z
      .object({
        includeAdr: z.boolean().optional(),
        includeBoundaries: z.boolean().optional(),
        maxBytes: z.number().int().min(0).optional(),
        maxApproxTokens: z.number().int().min(0).optional()
      })
      .optional(),
    analytics: z
      .object({
        enabled: z.boolean().optional(),
        channel: z.string().min(1).optional()
      })
      .optional()
  })
  .strict();
export type AiReviewCommandInput = z.infer<typeof AiReviewCommandInputSchema>;

export const AiReviewCommandOutputSchema = z
  .object({
    run: AiReviewRunSchema,
    exitCode: z.number().int(),
    artifacts: AiReviewArtifactsSchema
  })
  .strict();
export type AiReviewCommandOutput = z.infer<typeof AiReviewCommandOutputSchema>;

export function parseAiReviewRun(value: unknown): AiReviewRun {
  return AiReviewRunSchema.parse(value);
}

export function parseAiReviewCommandOutput(value: unknown): AiReviewCommandOutput {
  return AiReviewCommandOutputSchema.parse(value);
}

