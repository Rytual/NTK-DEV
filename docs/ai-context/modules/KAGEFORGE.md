# KageForge Module - AI Context Documentation

## Module Overview

**KageForge** is an enterprise-grade multi-provider AI orchestration system. It intelligently routes requests across OpenAI, Anthropic, Vertex AI (Gemini), Grok, and Microsoft Copilot 365 with circuit breaker patterns, load balancing, failover, and comprehensive token tracking.

### Core Purpose
- Multi-provider AI request routing
- 5 routing strategies (cost, performance, quality, round-robin, weighted)
- Circuit breaker fault tolerance
- Token usage and cost tracking
- Multi-layer response caching

---

## File Structure

```
src/modules/kageforge/
├── backend/
│   ├── provider-router.cjs               # Main router (763 lines)
│   ├── token-tracker.cjs                 # Usage tracking (828 lines)
│   ├── cache-engine.cjs                  # Multi-layer cache (807 lines)
│   ├── providers/
│   │   ├── openai-provider.cjs           # OpenAI GPT integration
│   │   ├── anthropic-provider.cjs        # Claude integration
│   │   ├── vertex-provider.cjs           # Gemini integration
│   │   ├── grok-provider.cjs             # xAI Grok integration
│   │   └── copilot-provider.cjs          # Microsoft 365 Copilot
│   └── *.d.ts                            # TypeScript declarations
├── components/
│   └── App.tsx                           # Module UI
├── renderer/
│   └── index.tsx
└── types/
    └── index.ts
```

---

## Backend Components

### 1. ProviderRouter (provider-router.cjs)

**Purpose**: Intelligent request routing across AI providers.

**Key Class**: `ProviderRouter extends EventEmitter`

**Supported Providers**:
- OpenAI (GPT-5.1, GPT-4o)
- Anthropic (Claude 4.5 Sonnet, Opus)
- Vertex AI (Gemini 3 Pro, Gemini 2.5 Flash)
- Grok (Grok 4.1-eq, Grok 4 Thinking)
- Microsoft Copilot 365

**Routing Strategies**:
```javascript
const ROUTER_CONFIG = {
  strategies: {
    COST_BASED: 'cost-based',           // Select cheapest provider
    PERFORMANCE_BASED: 'performance-based', // Select fastest (lowest latency)
    QUALITY_BASED: 'quality-based',     // Select highest success rate
    ROUND_ROBIN: 'round-robin',         // Rotate through providers
    WEIGHTED: 'weighted'                // Weighted distribution
  }
};
```

**Circuit Breaker Configuration**:
```javascript
circuitBreaker: {
  failureThreshold: 5,        // Failures before opening
  successThreshold: 2,        // Successes to close
  timeout: 60000,             // Open duration (1 min)
  halfOpenRequests: 3         // Test requests in half-open
}
```

**Circuit States**:
- `CLOSED` - Normal operation
- `OPEN` - Blocking requests (provider down)
- `HALF_OPEN` - Testing recovery

**Load Balancing**:
```javascript
loadBalancing: {
  maxConcurrentRequests: 10,  // Per provider
  queueSize: 100,             // Max queued
  timeout: 120000             // Queue timeout (2 min)
}
```

**Retry Configuration**:
```javascript
retry: {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2       // Exponential backoff
}
```

**Core Methods**:

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `createChatCompletion(options)` | `{messages, model, ...}` | `Response` | Non-streaming completion |
| `createStreamingChatCompletion(options, onChunk)` | options, callback | `Response` | Streaming completion |
| `selectProvider(options)` | `{provider?, estimatedTokens, requiresVision, ...}` | `string` | Select provider by strategy |
| `setStrategy(strategy)` | strategy name | void | Change routing strategy |
| `resetCircuitBreaker(providerName)` | provider name | void | Reset circuit breaker |
| `getStats()` | none | `RouterStats` | Get routing statistics |

**Request Flow**:
```
Client Request
      ↓
Select Provider (strategy)
      ↓
Check Circuit Breaker
      ↓
Check Load Balancer
      ↓
Execute Request
      ↓
Record Success/Failure
      ↓
Update Circuit State
      ↓
(On failure) Failover to next provider
```

---

### 2. TokenTracker (token-tracker.cjs)

**Purpose**: Track token usage and costs across all providers.

**Key Class**: `TokenTracker extends EventEmitter`

**2025 Pricing Configuration**:
```javascript
pricing: {
  openai: {
    'gpt-5.1-instant': {
      inputTokens: 0.000005,
      outputTokens: 0.00002,
      cachedInputTokens: 0.0000025
    },
    'gpt-5.1-thinking': {
      inputTokens: 0.00001,
      outputTokens: 0.00004,
      thinkingTokens: 0.00002
    }
  },
  anthropic: {
    'claude-4.5-sonnet-20250514': {
      inputTokens: 0.000003,
      outputTokens: 0.000015,
      cachedInputTokens: 0.0000003
    }
  },
  // ... vertex, grok, copilot
}
```

**Budget Enforcement**:
```javascript
budgets: {
  daily: null,           // No limit by default
  monthly: null,
  perUser: null,
  alertThreshold: 0.8    // Alert at 80%
}
```

**Core Methods**:

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `trackUsage(data)` | `{provider, model, inputTokens, ...}` | void | Record usage |
| `calculateCost(provider, model, usage)` | provider, model, usage obj | `number` | Calculate cost |
| `getUsageStats(startTime, endTime)` | timestamps | `UsageStats` | Get period stats |
| `getBudgetStatus()` | none | `BudgetStatus` | Get budget status |
| `getProviderComparison(start, end)` | timestamps | `Comparison` | Compare providers |
| `exportUsageData(start, end, format)` | timestamps, 'json'\|'csv' | `string` | Export data |

**SQLite Schema**:
```sql
CREATE TABLE usage (
  id INTEGER PRIMARY KEY,
  timestamp INTEGER,
  provider TEXT,
  model TEXT,
  user_id TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  thinking_tokens INTEGER,
  cached_tokens INTEGER,
  total_tokens INTEGER,
  cost REAL,
  latency INTEGER,
  success BOOLEAN
);
```

---

### 3. CacheEngine (cache-engine.cjs)

**Purpose**: Multi-layer response caching with semantic similarity.

**Key Class**: `CacheEngine extends EventEmitter`

**Cache Layers**:
1. **Memory (LRU)**: Fast, limited size (500 items, 1hr TTL)
2. **SQLite**: Persistent, larger (10K items, 24hr TTL)
3. **Redis**: Distributed, optional (7 day TTL)

**Semantic Similarity**:
```javascript
similarity: {
  threshold: 0.85,           // Min similarity for hit
  algorithm: 'cosine',       // cosine, jaccard, levenshtein
  enabled: true
}
```

**Core Methods**:

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `get(prompt, provider, model, options)` | prompt, provider, model, opts | `Response \| null` | Multi-layer lookup |
| `set(prompt, provider, model, value, options)` | prompt, provider, model, value | void | Set in all layers |
| `findSimilar(prompt, provider, model)` | prompt, provider, model | `{value, similarity} \| null` | Semantic search |
| `getStats()` | none | `CacheStats` | Get cache statistics |
| `cleanupExpired()` | none | void | Evict expired entries |

**Cache Key Generation**:
```javascript
// Key = hash of normalized prompt + provider + model + options
generateKey(prompt, provider, model, options) {
  const data = {
    prompt: this.normalizePrompt(prompt),
    provider, model,
    temperature: options.temperature || 0.7,
    max_tokens: options.max_tokens || 2048
  };
  return sha256(JSON.stringify(data));
}
```

---

## IPC Channels

| Channel | Direction | Parameters | Returns |
|---------|-----------|------------|---------|
| `kageforge:chat` | Renderer → Main | `{messages, provider?, model?, stream?}` | `Response` |
| `kageforge:streamChat` | Renderer → Main | `{messages, ...}` + callback | Streaming chunks |
| `kageforge:getStats` | Renderer → Main | none | `RouterStats` |
| `kageforge:setStrategy` | Renderer → Main | `{strategy}` | void |
| `kageforge:getUsage` | Renderer → Main | `{startTime, endTime}` | `UsageStats` |
| `kageforge:getBudget` | Renderer → Main | none | `BudgetStatus` |
| `kageforge:getCacheStats` | Renderer → Main | none | `CacheStats` |

---

## Events

| Event | Data | Description |
|-------|------|-------------|
| `routing:decision` | `{provider, strategy}` | Provider selected |
| `request:success` | `{provider, latency}` | Request completed |
| `request:error` | `{provider, error}` | Request failed |
| `failover:triggered` | `{from, to, reason}` | Failover occurred |
| `circuit:opened` | `{provider, failures}` | Circuit breaker opened |
| `circuit:closed` | `{provider}` | Circuit breaker closed |
| `alert` | `{type, period, used, limit}` | Budget alert |
| `cache:hit` | `{layer, key, latency}` | Cache hit |
| `cache:miss` | `{key, latency}` | Cache miss |

---

## Integration Points

### With KageChat
- Powers all AI chat functionality
- Provides streaming responses
- Cost tracking per conversation

### With Academy
- AI-powered question explanations
- Adaptive learning suggestions

### With All Modules
- Any module can request AI assistance
- Centralized token/cost management

---

## Current State

### Implemented
- Full 5-provider router
- Circuit breaker with 3 states
- Load balancing
- Exponential backoff retry
- SQLite token tracking
- Multi-layer caching
- Semantic similarity matching
- Budget enforcement with alerts

### Requirements
1. API keys for desired providers
2. `better-sqlite3` for token tracking
3. `lru-cache` for memory cache
4. Optional: `ioredis` for Redis cache

---

## Improvement Opportunities

1. **Embeddings Support**: Vector similarity for cache
2. **Function Calling**: Unified function/tool interface
3. **Vision Support**: Multi-modal routing
4. **Fine-tuning**: Custom model management
5. **Cost Forecasting**: Predictive budget alerts
6. **A/B Testing**: Quality comparison experiments
