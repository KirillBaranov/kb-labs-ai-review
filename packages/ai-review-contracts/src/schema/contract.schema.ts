import { z } from 'zod';
import { apiContractSchema } from './api.schema';
import { artifactsContractMapSchema } from './artifacts.schema';
import { commandContractMapSchema } from './commands.schema';
import { workflowContractMapSchema } from './workflows.schema';
import { contractsSchemaId } from '../version';
import { AI_REVIEW_PLUGIN_ID } from '../types';

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

