import { z } from 'zod';
import { apiContractSchema } from './api.schema.js';
import { artifactsContractMapSchema } from './artifacts.schema.js';
import { commandContractMapSchema } from './commands.schema.js';
import { workflowContractMapSchema } from './workflows.schema.js';
import { contractsSchemaId } from '../version.js';
import { AI_REVIEW_PLUGIN_ID } from '../types.js';

export const pluginContractsSchema = z
  .object({
    schema: z.literal(contractsSchemaId),
    pluginId: z.literal(AI_REVIEW_PLUGIN_ID),
    contractsVersion: z.string().min(1),
    artifacts: artifactsContractMapSchema,
    commands: commandContractMapSchema,
    workflows: workflowContractMapSchema,
    api: apiContractSchema.optional()
  })
  .strict();

export type PluginContractsSchema = z.infer<typeof pluginContractsSchema>;

export function parsePluginContracts(input: unknown) {
  return pluginContractsSchema.parse(input);
}

