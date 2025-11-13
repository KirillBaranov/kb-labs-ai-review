import type { PluginContracts } from './types.js';
import { AI_REVIEW_PLUGIN_ID } from './types.js';
import { contractsSchemaId, contractsVersion } from './version.js';

const COMMAND_SCHEMA_REF = '@kb-labs/ai-review-contracts/schema#AiReviewCommandInput';
const COMMAND_OUTPUT_SCHEMA_REF = '@kb-labs/ai-review-contracts/schema#AiReviewCommandOutput';
const RUN_SCHEMA_REF = '@kb-labs/ai-review-contracts/schema#AiReviewRun';

const ARTIFACT_CONTEXT = 'ai-review.context' as const;
const ARTIFACT_REVIEW_JSON = 'ai-review.review.json' as const;
const ARTIFACT_REVIEW_MD = 'ai-review.review.md' as const;
const ARTIFACT_REVIEW_MD_HUMAN = 'ai-review.review.human-md' as const;
const ARTIFACT_REVIEW_HTML = 'ai-review.review.html' as const;

const COMMAND_RUN = 'ai-review:run' as const;
const WORKFLOW_RUN = 'ai-review.workflow.run' as const;

export const pluginContractsManifest: PluginContracts = {
  schema: contractsSchemaId,
  pluginId: AI_REVIEW_PLUGIN_ID,
  contractsVersion,
  artifacts: {
    [ARTIFACT_CONTEXT]: {
      id: ARTIFACT_CONTEXT,
      kind: 'markdown',
      description: 'Grounding context (handbook, rules, ADR) used for the review run.',
      pathPattern: '.ai-review/context/**/*.md',
      mediaType: 'text/markdown'
    },
    [ARTIFACT_REVIEW_JSON]: {
      id: ARTIFACT_REVIEW_JSON,
      kind: 'json',
      description: 'Machine-readable AI review results.',
      pathPattern: '.ai-review/reviews/**/review.json',
      mediaType: 'application/json',
      schemaRef: RUN_SCHEMA_REF
    },
    [ARTIFACT_REVIEW_MD]: {
      id: ARTIFACT_REVIEW_MD,
      kind: 'markdown',
      description: 'Transport Markdown with embedded JSON payload.',
      pathPattern: '.ai-review/reviews/**/review.md',
      mediaType: 'text/markdown'
    },
    [ARTIFACT_REVIEW_MD_HUMAN]: {
      id: ARTIFACT_REVIEW_MD_HUMAN,
      kind: 'markdown',
      description: 'Human-readable Markdown summary grouped by severity.',
      pathPattern: '.ai-review/reviews/**/*.human.md',
      mediaType: 'text/markdown'
    },
    [ARTIFACT_REVIEW_HTML]: {
      id: ARTIFACT_REVIEW_HTML,
      kind: 'file',
      description: 'Rendered HTML report suitable for sharing.',
      pathPattern: '.ai-review/reviews/**/review.html',
      mediaType: 'text/html'
    }
  },
  commands: {
    [COMMAND_RUN]: {
      id: COMMAND_RUN,
      description: 'Run AI-powered code review for a unified diff.',
      input: {
        ref: COMMAND_SCHEMA_REF,
        format: 'zod'
      },
      output: {
        ref: COMMAND_OUTPUT_SCHEMA_REF,
        format: 'zod'
      },
      produces: [
        ARTIFACT_REVIEW_JSON,
        ARTIFACT_REVIEW_MD,
        ARTIFACT_REVIEW_MD_HUMAN,
        ARTIFACT_REVIEW_HTML,
        ARTIFACT_CONTEXT
      ],
      examples: [
        'kb ai-review run --diff changes.diff',
        'kb ai-review run --diff changes.diff --provider local',
        'kb ai-review run --diff changes.diff --profile frontend --fail-on major'
      ]
    }
  },
  workflows: {
    [WORKFLOW_RUN]: {
      id: WORKFLOW_RUN,
      description: 'Execute the ai-review run command and emit review artifacts.',
      produces: [
        ARTIFACT_REVIEW_JSON,
        ARTIFACT_REVIEW_MD,
        ARTIFACT_REVIEW_MD_HUMAN,
        ARTIFACT_REVIEW_HTML,
        ARTIFACT_CONTEXT
      ],
      steps: [
        {
          id: `${WORKFLOW_RUN}.step.execute`,
          commandId: COMMAND_RUN,
          produces: [
            ARTIFACT_REVIEW_JSON,
            ARTIFACT_REVIEW_MD,
            ARTIFACT_REVIEW_MD_HUMAN,
            ARTIFACT_REVIEW_HTML,
            ARTIFACT_CONTEXT
          ]
        }
      ]
    }
  }
};

