/**
 * Type declarations for Provider Router
 * These types allow renderer code to reference backend types without importing the actual CJS module
 */

import { EventEmitter } from 'events';

export interface RouterConfig {
  strategies: {
    COST_BASED: string;
    PERFORMANCE_BASED: string;
    QUALITY_BASED: string;
    ROUND_ROBIN: string;
    WEIGHTED: string;
  };
  circuitBreaker: {
    failureThreshold: number;
    successThreshold: number;
    timeout: number;
    halfOpenRequests: number;
  };
  loadBalancing: {
    maxConcurrentRequests: number;
    queueSize: number;
    timeout: number;
  };
  retry: {
    maxRetries: number;
    initialDelayMs: number;
    maxDelayMs: number;
    backoffMultiplier: number;
  };
  healthCheck: {
    interval: number;
    timeout: number;
  };
  providerWeights: {
    openai: number;
    anthropic: number;
    vertex: number;
    grok: number;
    copilot: number;
  };
}

export const ROUTER_CONFIG: RouterConfig;

export const CircuitState: {
  CLOSED: string;
  OPEN: string;
  HALF_OPEN: string;
};

export interface ProviderSettings {
  enabled: boolean;
  apiKey?: string;
  priority?: number;
}

export interface ProviderRouterConfig {
  strategy?: string;
  enableFailover?: boolean;
  enableLoadBalancing?: boolean;
  enableCircuitBreaker?: boolean;
  providers?: {
    openai?: ProviderSettings;
    anthropic?: ProviderSettings;
    vertex?: ProviderSettings;
    grok?: ProviderSettings;
    copilot?: ProviderSettings;
  };
}

export interface RouteOptions {
  model?: string;
  provider?: string;
  priority?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface RouteResult {
  response: string;
  provider: string;
  model: string;
  tokens: { input: number; output: number };
  latencyMs: number;
  cached: boolean;
}

export interface ChatCompletionOptions {
  messages: Array<{ role: string; content: string }>;
  max_tokens?: number;
  provider?: string;
  model?: string;
  temperature?: number;
}

export interface ChatCompletionResult {
  content?: string;
  text?: string;
  message?: { content: string };
  model: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  cost: number;
  latency: number;
}

export class ProviderRouter extends EventEmitter {
  constructor(config?: ProviderRouterConfig);

  route(prompt: string, options?: RouteOptions): Promise<RouteResult>;
  createChatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResult>;
  getProviderHealth(): Record<string, { healthy: boolean; latency: number }>;
  getStats(): Record<string, any>;
  shutdown(): Promise<void>;
}

export default ProviderRouter;
