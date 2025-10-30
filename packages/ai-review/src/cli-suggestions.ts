/**
 * AI Review CLI suggestions integration
 * Example of how to integrate with the shared CLI suggestions system
 */

import {
  MultiCLISuggestions,
  type CommandSuggestion
} from '@kb-labs/shared-cli-ui';
import { commands } from './cli.manifest.js';

/**
 * Generate AI Review-specific suggestions
 */
export function generateAIReviewSuggestions(
  warningCodes: Set<string>,
  context: any
): CommandSuggestion[] {
  const suggestions: CommandSuggestion[] = [];

  // AI Review-specific suggestions based on warning codes
  if (warningCodes.has('AI_MODEL_UNAVAILABLE')) {
    suggestions.push({
      id: 'AI_REVIEW_FALLBACK',
      command: 'kb ai-review analyze',
      args: ['--model', 'gpt-3.5-turbo'],
      description: 'Use fallback AI model',
      impact: 'safe',
      when: 'AI_MODEL_UNAVAILABLE',
      available: true
    });
  }

  if (warningCodes.has('AI_API_KEY_MISSING')) {
    suggestions.push({
      id: 'AI_REVIEW_SETUP',
      command: 'kb ai-review setup',
      args: [],
      description: 'Setup AI API keys',
      impact: 'safe',
      when: 'AI_API_KEY_MISSING',
      available: true
    });
  }

  if (warningCodes.has('AI_REVIEW_QUOTA_EXCEEDED')) {
    suggestions.push({
      id: 'AI_REVIEW_WAIT',
      command: 'kb ai-review analyze',
      args: ['--wait', '--retry'],
      description: 'Wait and retry analysis',
      impact: 'safe',
      when: 'AI_REVIEW_QUOTA_EXCEEDED',
      available: true
    });
  }

  return suggestions;
}

/**
 * Create an AI Review CLI suggestions manager
 */
export function createAIReviewCLISuggestions(): MultiCLISuggestions {
  const manager = new MultiCLISuggestions();

  // Register AI Review CLI package
  manager.registerPackage({
    name: 'ai-review',
    group: 'ai-review',
    commands,
    priority: 50
  });

  return manager;
}

/**
 * Get all available AI Review commands
 */
export function getAIReviewCommands(): string[] {
  return commands.map(cmd => cmd.id);
}
