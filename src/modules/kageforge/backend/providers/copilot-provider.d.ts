/**
 * Type declarations for Copilot 365 Provider
 */

import { EventEmitter } from 'events';

export interface ProviderConfig {
  clientId?: string;
  clientSecret?: string;
  tenantId?: string;
  timeout?: number;
}

export interface CompletionOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stop?: string[];
}

export interface CompletionResult {
  content: string;
  model: string;
  tokens: { input: number; output: number };
  finishReason: string;
}

export class Copilot365Provider extends EventEmitter {
  constructor(config?: ProviderConfig);

  complete(prompt: string, options?: CompletionOptions): Promise<CompletionResult>;
  healthCheck(): Promise<boolean>;
  getModels(): string[];
}

export default Copilot365Provider;
