/**
 * Type declarations for Vertex AI Provider
 */

import { EventEmitter } from 'events';

export interface ProviderConfig {
  projectId?: string;
  location?: string;
  credentials?: any;
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

export class VertexAIProvider extends EventEmitter {
  constructor(config?: ProviderConfig);

  complete(prompt: string, options?: CompletionOptions): Promise<CompletionResult>;
  healthCheck(): Promise<boolean>;
  getModels(): string[];
}

export default VertexAIProvider;
