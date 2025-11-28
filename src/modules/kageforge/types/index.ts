/**
 * Kage Forge Type Definitions - 2025 Edition
 * Comprehensive TypeScript interfaces for all providers and core systems
 *
 * @module Types
 * @version 8.0.0
 */

// ============================================================================
// Base Types
// ============================================================================

export type Provider = 'openai' | 'anthropic' | 'vertex' | 'grok' | 'copilot';

export type ModelName =
  | 'gpt-5.1-instant'
  | 'gpt-5.1-thinking'
  | 'gpt-4o-2024-11-20'
  | 'claude-4.5-sonnet-20250514'
  | 'claude-4.5-opus-20250514'
  | 'gemini-3-pro'
  | 'gemini-2.5-flash-002'
  | 'grok-4.1-eq'
  | 'grok-4-thinking'
  | 'copilot-365-gpt4'
  | 'copilot-m365-hybrid';

export type MessageRole = 'system' | 'user' | 'assistant' | 'function' | 'tool';

export type FinishReason = 'stop' | 'length' | 'function_call' | 'tool_calls' | 'content_filter' | 'null';

export type CircuitState = 'closed' | 'open' | 'half_open';

export type RoutingStrategy = 'cost-based' | 'performance-based' | 'quality-based' | 'round-robin' | 'weighted';

// ============================================================================
// Provider Configuration Types
// ============================================================================

export interface ProviderConfig {
  apiKey?: string;
  enabled?: boolean;
  defaultModel?: string;
  timeout?: number;
  maxRetries?: number;
  maxHistorySize?: number;
}

export interface OpenAIConfig extends ProviderConfig {
  organization?: string;
  baseURL?: string;
}

export interface AnthropicConfig extends ProviderConfig {
  baseURL?: string;
  cacheEnabled?: boolean;
}

export interface VertexConfig extends ProviderConfig {
  projectId?: string;
  location?: string;
  groundingEnabled?: boolean;
  safetySettings?: Record<string, string>;
}

export interface GrokConfig extends ProviderConfig {
  baseURL?: string;
  realTimeDataEnabled?: boolean;
}

export interface CopilotConfig extends ProviderConfig {
  azureApiKey?: string;
  azureEndpoint?: string;
  azureDeployment?: string;
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
  cacheEnabled?: boolean;
  cacheTTL?: number;
}

// ============================================================================
// Model Configuration Types
// ============================================================================

export interface ModelPricing {
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens?: number;
  cachedCreationTokens?: number;
  thinkingTokens?: number;
  imageTokens?: number;
  videoTokens?: number;
  audioTokens?: number;
  m365QueryTokens?: number;
  semanticIndexTokens?: number;
}

export interface ModelConfig {
  name: string;
  displayName?: string;
  contextWindow: number;
  maxOutputTokens: number;
  supportsVision?: boolean;
  supportsAudio?: boolean;
  supportsVideo?: boolean;
  supportsFunctions?: boolean;
  supportsTools?: boolean;
  supportsThinking?: boolean;
  supportsCaching?: boolean;
  supportsStreaming?: boolean;
  supportsGrounding?: boolean;
  supportsCodeExecution?: boolean;
  supportsM365Grounding?: boolean;
  supportsSemanticIndex?: boolean;
  supportsRealTimeData?: boolean;
  pricing: ModelPricing;
  latency: 'ultra-low' | 'low' | 'medium' | 'extended';
  capabilities: string[];
}

// ============================================================================
// Message Types
// ============================================================================

export interface TextContent {
  type: 'text';
  text: string;
}

export interface ImageContent {
  type: 'image' | 'image_url';
  image_url?: {
    url: string;
    detail?: 'auto' | 'low' | 'high';
  };
  source?: {
    type: 'base64' | 'url';
    media_type: string;
    data: string;
  };
}

export interface VideoContent {
  type: 'video_url';
  video_url: {
    url: string;
    mime_type?: string;
  };
}

export interface AudioContent {
  type: 'audio_url';
  audio_url: {
    url: string;
    mime_type?: string;
  };
}

export type ContentPart = TextContent | ImageContent | VideoContent | AudioContent;

export interface Message {
  role: MessageRole;
  content: string | ContentPart[];
  name?: string;
  function_call?: FunctionCall;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

// ============================================================================
// Function/Tool Types
// ============================================================================

export interface FunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface FunctionCall {
  name: string;
  arguments: string;
}

export interface Tool {
  type: 'function';
  function: FunctionDefinition;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolUse {
  id: string;
  name: string;
  input: Record<string, any>;
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface ChatCompletionOptions {
  model?: string;
  messages: Message[];
  temperature?: number;
  top_p?: number;
  top_k?: number;
  n?: number;
  stream?: boolean;
  stop?: string | string[];
  max_tokens?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  response_format?: {
    type: 'text' | 'json_object';
  };
  functions?: FunctionDefinition[];
  function_call?: 'auto' | 'none' | { name: string };
  tools?: Tool[];
  tool_choice?: 'auto' | 'none' | 'required' | { type: 'function'; function: { name: string } };
  seed?: number;
  user?: string;
  reasoning_effort?: 'low' | 'medium' | 'high';
  show_thinking?: boolean;
  thinking?: boolean;
  thinking_budget?: number;
  system?: string;
  enableCache?: boolean;
  stop_sequences?: string[];
  metadata?: Record<string, any>;
  grounding?: boolean;
  codeExecution?: boolean;
  m365Grounding?: boolean;
  m365Sources?: string[];
  includeRealTimeData?: boolean;
  codeCompletion?: boolean;
  provider?: Provider;
  estimatedTokens?: number;
  requiresVision?: boolean;
  requiresThinking?: boolean;
  requiresFunctions?: boolean;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  thinkingTokens?: number;
  totalTokens: number;
  cacheReadTokens?: number;
  cacheCreationTokens?: number;
  cachedTokens?: number;
  m365QueryTokens?: number;
  semanticIndexTokens?: number;
}

export interface ChatCompletionResult {
  id?: string;
  model: string;
  message?: {
    role: string;
    content: string;
    thinking?: string;
    function_call?: FunctionCall;
    tool_calls?: ToolCall[];
  };
  role?: string;
  content?: string;
  text?: string;
  thinking?: string;
  toolUses?: ToolUse[];
  functionCalls?: Array<{
    name: string;
    arguments: Record<string, any>;
  }>;
  finishReason?: FinishReason;
  stopReason?: string;
  stopSequence?: string;
  safetyRatings?: any[];
  citationMetadata?: any;
  groundingMetadata?: any;
  usage: TokenUsage;
  cost: number;
  latency: number;
  timestamp: number;
}

export interface StreamDelta {
  type: 'content' | 'thinking' | 'text' | 'function_call' | 'tool_call';
  content?: string;
  text?: string;
  thinking?: string;
  fullContent?: string;
  fullText?: string;
  fullThinking?: string;
  function_call?: Partial<FunctionCall>;
  tool_call?: Partial<ToolCall>;
}

// ============================================================================
// Provider Statistics Types
// ============================================================================

export interface ProviderStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokensUsed: number;
  totalCost: number;
  averageLatency: number;
  cacheHits?: number;
  cacheMisses?: number;
  cacheCreations?: number;
  multiModalRequests?: number;
  groundedRequests?: number;
  codeExecutionRequests?: number;
  realTimeDataRequests?: number;
  thinkingRequests?: number;
  m365GroundingRequests?: number;
  semanticIndexRequests?: number;
  codeCompletionRequests?: number;
  requestsByModel: Record<string, {
    count: number;
    tokens: number;
    cost: number;
    cacheHits?: number;
  }>;
  errorsByType: Record<string, number>;
  m365SourcesUsed?: Record<string, number>;
  successRate?: number;
  cacheHitRate?: number;
}

export interface ProviderInfo {
  name: string;
  version: string;
  models: Record<string, ModelConfig>;
  capabilities: string[];
  status: 'active' | 'inactive' | 'degraded';
  projectId?: string;
  location?: string;
  m365Enabled?: boolean;
  stats: ProviderStats;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  provider: string;
  model?: string;
  modelsAvailable?: number;
  project?: string;
  location?: string;
  error?: string;
  azure?: 'healthy' | 'unhealthy' | 'unknown';
  graph?: 'healthy' | 'unhealthy' | 'unknown';
  azureError?: string;
  graphError?: string;
  timestamp: number;
}

// ============================================================================
// Error Types
// ============================================================================

export interface ProviderError {
  provider: Provider;
  type: string;
  message: string;
  code?: string;
  status?: number;
  details?: any;
  retryable: boolean;
  timestamp: number;
}

// ============================================================================
// Router Types
// ============================================================================

export interface RouterConfig {
  strategy?: RoutingStrategy;
  enableFailover?: boolean;
  enableLoadBalancing?: boolean;
  enableCircuitBreaker?: boolean;
  enableHealthMonitoring?: boolean;
  providers?: Record<string, ProviderConfig>;
}

export interface CircuitBreakerState {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime: number | null;
  halfOpenRequests: number;
}

export interface LoadBalancerState {
  activeRequests: number;
  queuedRequests: number;
  maxConcurrent: number;
}

export interface RouterStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  routingDecisions: Record<string, number>;
  providerStats: Record<string, {
    successes: number;
    failures: number;
  }>;
  failoverCount: number;
  circuitBreakerTrips: number;
  successRate?: number;
  circuitStates?: Record<string, CircuitState>;
  loadBalancers?: Record<string, {
    activeRequests: number;
    maxConcurrent: number;
  }>;
}

// ============================================================================
// Cache Types
// ============================================================================

export interface CacheConfig {
  memory?: {
    maxSize?: number;
    maxAge?: number;
    updateAgeOnGet?: boolean;
    updateAgeOnHas?: boolean;
  };
  sqlite?: {
    path?: string;
    maxSize?: number;
    maxAge?: number;
  };
  redis?: {
    enabled?: boolean;
    host?: string;
    port?: number;
    maxAge?: number;
    keyPrefix?: string;
  };
  similarity?: {
    threshold?: number;
    algorithm?: 'cosine' | 'jaccard' | 'levenshtein';
    enabled?: boolean;
  };
  analytics?: {
    enabled?: boolean;
    trackPatterns?: boolean;
    windowSize?: number;
  };
  warmup?: {
    enabled?: boolean;
    queries?: string[];
  };
}

export interface CacheStats {
  totalRequests: number;
  memoryHits: number;
  memoryMisses: number;
  sqliteHits: number;
  sqliteMisses: number;
  redisHits: number;
  redisMisses: number;
  semanticHits: number;
  writes: number;
  evictions: number;
  hitRate: number;
  averageLatency: number;
  byProvider: Record<string, any>;
  layers: string[];
  memory: {
    size: number;
    maxSize: number;
  };
  sqlite: {
    entries: number;
    tokens: number;
    cost: number;
  };
  analytics?: {
    recentRequestsCount: number;
    popularKeysCount: number;
    patternsCount: number;
  };
}

export interface CacheAnalytics {
  recentRequests: Array<{
    key: string;
    prompt: string;
    layer: string;
    timestamp: number;
  }>;
  topKeys: Array<[string, number]>;
  topPatterns: Array<[string, number]>;
}

// ============================================================================
// Token Tracker Types
// ============================================================================

export interface TokenTrackerConfig {
  pricing?: Record<string, Record<string, ModelPricing>>;
  budgets?: {
    daily?: number | null;
    monthly?: number | null;
    perUser?: number | null;
    alertThreshold?: number;
  };
  database?: {
    path?: string;
    retentionDays?: number;
  };
  aggregation?: {
    enabled?: boolean;
    intervals?: string[];
  };
  alerts?: {
    enabled?: boolean;
    channels?: string[];
  };
}

export interface UsageData {
  provider: Provider;
  model: string;
  userId?: string | null;
  inputTokens?: number;
  outputTokens?: number;
  thinkingTokens?: number;
  cachedTokens?: number;
  totalTokens?: number;
  cost?: number;
  latency?: number;
  success?: boolean;
  cacheCreationTokens?: number;
  imageCount?: number;
  videoSeconds?: number;
  audioSeconds?: number;
  m365QueryTokens?: number;
}

export interface UsageStats {
  total: {
    tokens: number;
    cost: number;
    requests: number;
  };
  byProvider: Record<string, {
    tokens: number;
    cost: number;
    requests: number;
  }>;
  byModel: Record<string, {
    tokens: number;
    cost: number;
    requests: number;
  }>;
  byUser: Record<string, {
    tokens: number;
    cost: number;
    requests: number;
  }>;
  period: {
    start: number;
    end: number;
  };
}

export interface BudgetStatus {
  daily: {
    used: number;
    limit: number | null;
    remaining: number | null;
    percent: number;
    exceeded: boolean;
  };
  monthly: {
    used: number;
    limit: number | null;
    remaining: number | null;
    percent: number;
    exceeded: boolean;
  };
  perUser: Record<string, {
    used: number;
    limit: number | null;
    remaining: number | null;
    percent: number;
    exceeded: boolean;
  }>;
}

export interface Alert {
  type: 'budget_exceeded' | 'budget_warning' | 'user_budget_exceeded' | 'user_budget_warning';
  period?: 'daily' | 'monthly';
  userId?: string;
  used: number;
  limit: number;
  percent?: number;
}

export interface ProviderComparison {
  providers: Array<{
    name: string;
    tokens: number;
    cost: number;
    requests: number;
    averageCostPerRequest: number;
    averageTokensPerRequest: number;
  }>;
  totalCost: number;
  totalTokens: number;
  totalRequests: number;
}

// ============================================================================
// Event Types
// ============================================================================

export interface ProviderEvent {
  provider: Provider;
  type: string;
  data?: any;
  timestamp: number;
}

export interface RequestEvent {
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  thinkingTokens?: number;
  totalTokens?: number;
  cost?: number;
  latency?: number;
  finishReason?: FinishReason;
  error?: string;
  code?: string;
  timestamp: number;
}

export interface RoutingEvent {
  provider: Provider;
  strategy?: RoutingStrategy;
  attempt?: number;
  method?: string;
  from?: Provider;
  to?: Provider;
  error?: string;
  latency?: number;
  options?: any;
}

export interface CacheEvent {
  layer?: 'memory' | 'sqlite' | 'redis';
  key?: string;
  similarity?: number;
  latency?: number;
  evicted?: number;
  query?: string;
  queries?: number;
  operation?: string;
  error?: string;
}

// ============================================================================
// Kage Integration Types (Compatibility with Prompt 0/1 v3)
// ============================================================================

export interface KageConversation {
  id: string;
  messages: Message[];
  metadata?: Record<string, any>;
  timestamp: number;
}

export interface KageMemory {
  shortTerm: any[];
  longTerm: any[];
  context: Record<string, any>;
}

export interface KageAgent {
  id: string;
  name: string;
  role: string;
  provider: Provider;
  model: string;
  capabilities: string[];
}

export interface KageOrchestration {
  agents: KageAgent[];
  workflow: string;
  priority: number;
}

// ============================================================================
// React Component Props Types
// ============================================================================

export interface ProviderSelectorProps {
  providers: Provider[];
  selectedProvider: Provider;
  onSelect: (provider: Provider) => void;
  disabled?: boolean;
}

export interface ModelSelectorProps {
  provider: Provider;
  models: string[];
  selectedModel: string;
  onSelect: (model: string) => void;
  disabled?: boolean;
}

export interface UsageChartProps {
  data: UsageStats;
  timeRange: '1h' | '24h' | '7d' | '30d';
  type: 'tokens' | 'cost' | 'requests';
}

export interface BudgetDisplayProps {
  status: BudgetStatus;
  period: 'daily' | 'monthly';
}

export interface ProviderHealthProps {
  providers: Record<Provider, HealthStatus>;
  onRefresh: () => void;
}

// ============================================================================
// Utility Types
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>>
  & {
      [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
  }[Keys];

export type Nullable<T> = T | null;

export type AsyncReturnType<T extends (...args: any) => Promise<any>> =
  T extends (...args: any) => Promise<infer R> ? R : any;

// ============================================================================
// Export All
// ============================================================================

export default {
  // Types are exported above
};
