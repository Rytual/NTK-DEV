/**
 * Type declarations for OpenAI Provider
 */

import { EventEmitter } from 'events';

export interface ProviderConfig {
  apiKey?: string;
  organization?: string;
  baseURL?: string;
  timeout?: number;
}

export interface CompletionOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  stop?: string[];
}

export interface CompletionResult {
  content: string;
  model: string;
  tokens: { input: number; output: number };
  finishReason: string;
}

export class OpenAIProvider extends EventEmitter {
  constructor(config?: ProviderConfig);

  complete(prompt: string, options?: CompletionOptions): Promise<CompletionResult>;
  healthCheck(): Promise<boolean>;
  getModels(): string[];
}

export default OpenAIProvider;
