/**
 * Kage Forge Main Entry Point
 * @version 8.0.0
 */

// Provider exports
export { default as OpenAIProvider } from './backend/providers/openai-provider';
export { default as AnthropicProvider } from './backend/providers/anthropic-provider';
export { default as VertexAIProvider } from './backend/providers/vertex-provider';
export { default as GrokProvider } from './backend/providers/grok-provider';
export { default as Copilot365Provider } from './backend/providers/copilot-provider';

// Core system exports
export { default as ProviderRouter, CircuitState, ROUTER_CONFIG } from './backend/provider-router';
export { default as CacheEngine } from './backend/cache-engine';
export { default as TokenTracker } from './backend/token-tracker';

// Type exports
export * from './types';

// Re-export for Kage compatibility
export const KageForge = {
  OpenAIProvider: require('./backend/providers/openai-provider'),
  AnthropicProvider: require('./backend/providers/anthropic-provider'),
  VertexAIProvider: require('./backend/providers/vertex-provider'),
  GrokProvider: require('./backend/providers/grok-provider'),
  Copilot365Provider: require('./backend/providers/copilot-provider'),
  ProviderRouter: require('./backend/provider-router'),
  CacheEngine: require('./backend/cache-engine'),
  TokenTracker: require('./backend/token-tracker')
};

export default KageForge;
