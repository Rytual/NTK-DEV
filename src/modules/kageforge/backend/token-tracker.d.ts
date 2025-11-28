/**
 * Type declarations for Token Tracker
 */

import { EventEmitter } from 'events';

export interface TokenTrackerConfig {
  budgets?: {
    daily?: number;
    monthly?: number;
    alertThreshold?: number;
  };
}

export interface TokenUsage {
  input: number;
  output: number;
  total: number;
  cost: number;
}

export interface ProviderUsage {
  provider: string;
  model: string;
  tokens: TokenUsage;
  requests: number;
  timestamp: Date;
}

export interface UsageStats {
  totalTokens: number;
  totalCost: number;
  byProvider: Record<string, TokenUsage>;
  byModel: Record<string, TokenUsage>;
  history: ProviderUsage[];
}

export interface TrackUsageOptions {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  latency: number;
  success: boolean;
}

export interface BudgetStatus {
  daily: { used: number; limit: number; remaining: number };
  monthly: { used: number; limit: number; remaining: number };
  alertTriggered: boolean;
}

export class TokenTracker extends EventEmitter {
  constructor(config?: TokenTrackerConfig);

  trackUsage(options: TrackUsageOptions): void;
  getStats(): UsageStats;
  getCurrentStats(): UsageStats;
  getBudgetStatus(): BudgetStatus;
  getUsageByProvider(provider: string): TokenUsage | null;
  getUsageByModel(model: string): TokenUsage | null;
  reset(): void;
}

export default TokenTracker;
