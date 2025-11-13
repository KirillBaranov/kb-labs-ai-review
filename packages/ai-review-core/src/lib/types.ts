export type {
  Severity,
  RuleItem,
  ReviewFinding,
  RulesJson,
  ReviewJson
} from '@kb-labs/shared-review-types';

export interface Hunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  header: string;
  added: { line: number; text: string }[];
}

export interface FileDiff {
  filePath: string;
  hunks: Hunk[];
}
