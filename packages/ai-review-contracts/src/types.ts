import type { ApiContract } from './types/api.js';
import type { PluginArtifactContract } from './types/artifacts.js';
import type { CommandContract } from './types/commands.js';
import type { WorkflowContract } from './types/workflows.js';
import type { ContractsSchemaId } from './version.js';

export const AI_REVIEW_PLUGIN_ID = '@kb-labs/ai-review' as const;

export type AiReviewArtifactId =
  | 'ai-review.context'
  | 'ai-review.review.json'
  | 'ai-review.review.md'
  | 'ai-review.review.human-md'
  | 'ai-review.review.html';

export type AiReviewCommandId = 'ai-review:run';

export type AiReviewWorkflowId = 'ai-review.workflow.run';

export type AiReviewArtifactContracts = Record<AiReviewArtifactId, PluginArtifactContract>;
export type AiReviewCommandContracts = Record<AiReviewCommandId, CommandContract>;
export type AiReviewWorkflowContracts = Record<AiReviewWorkflowId, WorkflowContract>;

export interface PluginContracts {
  schema: ContractsSchemaId;
  pluginId: string;
  contractsVersion: string;
  artifacts: AiReviewArtifactContracts;
  commands: AiReviewCommandContracts;
  workflows: AiReviewWorkflowContracts;
  api?: ApiContract;
}

export type { ApiContract, RestApiContract, RestRouteContract, SchemaReference } from './types/api.js';
export type { ArtifactKind, ArtifactContractsMap, PluginArtifactContract, ArtifactExample } from './types/artifacts.js';
export type { CommandContract, CommandContractsMap } from './types/commands.js';
export type { WorkflowContract, WorkflowContractsMap, WorkflowStepContract } from './types/workflows.js';

