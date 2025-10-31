// Re-export shared review types
export type {
  Severity,
  RuleItem,
  ReviewFinding,
  RulesJson,
  ReviewJson
} from '@kb-labs/shared-review-types'

export interface Hunk {
  oldStart: number
  oldLines: number
  newStart: number
  newLines: number
  /** Full header line, e.g. "@@ -10,7 +12,9 @@" */
  header: string
  /** Added lines with their NEW file line numbers */
  added: { line: number; text: string }[]
}

export interface FileDiff {
  /** Path from the `+++ b/<path>` line */
  filePath: string
  hunks: Hunk[]
}
