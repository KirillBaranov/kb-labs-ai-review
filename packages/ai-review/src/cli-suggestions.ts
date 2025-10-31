/**
 * AI Review CLI suggestions integration
 * TODO: Re-enable when shared-cli-ui is available
 */

// Temporarily disabled - depends on @kb-labs/shared-cli-ui which may not exist
/*
import {
  MultiCLISuggestions,
  type CommandSuggestion
} from '@kb-labs/shared-cli-ui';
import { commands } from '../cli/src/cli.manifest.js';

export function generateAIReviewSuggestions(
  warningCodes: Set<string>,
  context: any
): CommandSuggestion[] {
  const suggestions: CommandSuggestion[] = [];
  // Implementation when shared-cli-ui is available
  return suggestions;
}

export function createAIReviewCLISuggestions(): MultiCLISuggestions {
  const manager = new MultiCLISuggestions();
  manager.registerPackage({
    name: 'ai-review',
    group: 'ai-review',
    commands,
    priority: 50
  });
  return manager;
}

export function getAIReviewCommands(): string[] {
  return commands.map(cmd => cmd.id);
}
*/
