import type { SchemaReference } from './api.js';

export interface CommandContract {
  id: string;
  description?: string;
  input?: SchemaReference;
  output?: SchemaReference;
  produces?: string[];
  consumes?: string[];
  examples?: string[];
}

export type CommandContractsMap = Record<string, CommandContract>;

