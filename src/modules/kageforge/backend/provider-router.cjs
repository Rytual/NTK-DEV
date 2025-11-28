/**
 * Provider Router - Kage Forge 2025 Edition
 * Intelligent routing across OpenAI, Anthropic, Vertex AI, Grok, and Copilot 365
 * Features: Circuit breaker, Load balancing, Failover, 5 routing strategies
 *
 * @module ProviderRouter
 * @version 8.0.0
 */

const { EventEmitter } = require('events');
const OpenAIProvider = require('./providers/openai-provider.cjs');
const AnthropicProvider = require('./providers/anthropic-provider.cjs');
const VertexAIProvider = require('./providers/vertex-provider.cjs');
const GrokProvider = require('./providers/grok-provider.cjs');
const Copilot365Provider = require('./providers/copilot-provider.cjs');

/**
 * Router Configuration
 */
const ROUTER_CONFIG = {
  strategies: {
    COST_BASED: 'cost-based',
    PERFORMANCE_BASED: 'performance-based',
    QUALITY_BASED: 'quality-based',
    ROUND_ROBIN: 'round-robin',
    WEIGHTED: 'weighted'
  },
  circuitBreaker: {
    failureThreshold: 5,        // Number of failures before opening circuit
    successThreshold: 2,        // Number of successes needed to close circuit
    timeout: 60000,             // Circuit open duration (1 minute)
    halfOpenRequests: 3         // Max requests in half-open state
  },
  loadBalancing: {
    maxConcurrentRequests: 10,  // Per provider
    queueSize: 100,             // Max queued requests
    timeout: 120000             // Queue timeout (2 minutes)
  },
  retry: {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2
  },
  healthCheck: {
    interval: 60000,            // Health check every minute
    timeout: 10000              // Health check timeout
  },
  providerWeights: {
    openai: 1.0,
    anthropic: 1.0,
    vertex: 1.0,
    grok: 0.8,
    copilot: 0.9
  }
};

/**
 * Circuit Breaker States
 */
const CircuitState = {
  CLOSED: 'closed',      // Normal operation
  OPEN: 'open',          // Blocking requests
  HALF_OPEN: 'half_open' // Testing recovery
};

/**
 * Provider Router Class
 * Intelligently routes requests across multiple AI providers
 */
class ProviderRouter extends EventEmitter {
  constructor(config = {}) {
    super();

    this.strategy = config.strategy || ROUTER_CONFIG.strategies.COST_BASED;
    this.enableFailover = config.enableFailover ?? true;
    this.enableLoadBalancing = config.enableLoadBalancing ?? true;
    this.enableCircuitBreaker = config.enableCircuitBreaker ?? true;

    // Initialize providers
    this.providers = new Map();
    this.providerConfigs = config.providers || {};

    // Initialize available providers
    this.initializeProviders();

    // Circuit breaker state for each provider
    this.circuitBreakers = new Map();
    this.providers.forEach((_, name) => {
      this.circuitBreakers.set(name, {
        state: CircuitState.CLOSED,
        failures: 0,
        successes: 0,
        lastFailureTime: null,
        halfOpenRequests: 0
      });
    });

    // Load balancing state
    this.loadBalancers = new Map();
    this.providers.forEach((_, name) => {
      this.loadBalancers.set(name, {
        activeRequests: 0,
        queuedRequests: 0,
        maxConcurrent: ROUTER_CONFIG.loadBalancing.maxConcurrentRequests
      });
    });

    // Round-robin state
    this.roundRobinIndex = 0;

    // Statistics
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      routingDecisions: {},
      providerStats: {},
      failoverCount: 0,
      circuitBreakerTrips: 0
    };

    // Health monitoring
    if (config.enableHealthMonitoring ?? true) {
      this.startHealthMonitoring();
    }

    this.emit('initialized', {
      providers: Array.from(this.providers.keys()),
      strategy: this.strategy
    });
  }

  /**
   * Initialize providers based on configuration
   */
  initializeProviders() {
    // Initialize OpenAI
    if (this.providerConfigs.openai?.enabled !== false) {
      try {
        const openai = new OpenAIProvider(this.providerConfigs.openai || {});
        this.providers.set('openai', openai);
        this.emit('provider:initialized', { name: 'openai' });
      } catch (error) {
        this.emit('provider:init-failed', { name: 'openai', error: error.message });
      }
    }

    // Initialize Anthropic
    if (this.providerConfigs.anthropic?.enabled !== false) {
      try {
        const anthropic = new AnthropicProvider(this.providerConfigs.anthropic || {});
        this.providers.set('anthropic', anthropic);
        this.emit('provider:initialized', { name: 'anthropic' });
      } catch (error) {
        this.emit('provider:init-failed', { name: 'anthropic', error: error.message });
      }
    }

    // Initialize Vertex AI
    if (this.providerConfigs.vertex?.enabled !== false) {
      try {
        const vertex = new VertexAIProvider(this.providerConfigs.vertex || {});
        this.providers.set('vertex', vertex);
        this.emit('provider:initialized', { name: 'vertex' });
      } catch (error) {
        this.emit('provider:init-failed', { name: 'vertex', error: error.message });
      }
    }

    // Initialize Grok
    if (this.providerConfigs.grok?.enabled !== false) {
      try {
        const grok = new GrokProvider(this.providerConfigs.grok || {});
        this.providers.set('grok', grok);
        this.emit('provider:initialized', { name: 'grok' });
      } catch (error) {
        this.emit('provider:init-failed', { name: 'grok', error: error.message });
      }
    }

    // Initialize Copilot 365
    if (this.providerConfigs.copilot?.enabled !== false) {
      try {
        const copilot = new Copilot365Provider(this.providerConfigs.copilot || {});
        this.providers.set('copilot', copilot);
        this.emit('provider:initialized', { name: 'copilot' });
      } catch (error) {
        this.emit('provider:init-failed', { name: 'copilot', error: error.message });
      }
    }

    if (this.providers.size === 0) {
      throw new Error('No providers initialized. Check your configuration.');
    }
  }

  /**
   * Select provider based on routing strategy
   */
  selectProvider(options = {}) {
    const availableProviders = this.getAvailableProviders();

    if (availableProviders.length === 0) {
      throw new Error('No available providers. All circuits are open or providers are overloaded.');
    }

    // Manual provider selection
    if (options.provider) {
      if (this.providers.has(options.provider)) {
        if (this.isProviderAvailable(options.provider)) {
          return options.provider;
        }
        // Provider specified but unavailable, try failover
        if (this.enableFailover) {
          this.emit('failover:triggered', {
            requested: options.provider,
            reason: 'unavailable'
          });
          return this.selectProviderByStrategy(availableProviders, options);
        }
        throw new Error(`Provider ${options.provider} is unavailable and failover is disabled.`);
      }
      throw new Error(`Provider ${options.provider} not found.`);
    }

    // Strategy-based selection
    return this.selectProviderByStrategy(availableProviders, options);
  }

  /**
   * Select provider based on current strategy
   */
  selectProviderByStrategy(availableProviders, options) {
    let selectedProvider;

    switch (this.strategy) {
      case ROUTER_CONFIG.strategies.COST_BASED:
        selectedProvider = this.selectByCost(availableProviders, options);
        break;

      case ROUTER_CONFIG.strategies.PERFORMANCE_BASED:
        selectedProvider = this.selectByPerformance(availableProviders, options);
        break;

      case ROUTER_CONFIG.strategies.QUALITY_BASED:
        selectedProvider = this.selectByQuality(availableProviders, options);
        break;

      case ROUTER_CONFIG.strategies.ROUND_ROBIN:
        selectedProvider = this.selectRoundRobin(availableProviders);
        break;

      case ROUTER_CONFIG.strategies.WEIGHTED:
        selectedProvider = this.selectWeighted(availableProviders);
        break;

      default:
        selectedProvider = availableProviders[0];
    }

    // Track routing decision
    if (!this.stats.routingDecisions[selectedProvider]) {
      this.stats.routingDecisions[selectedProvider] = 0;
    }
    this.stats.routingDecisions[selectedProvider]++;

    this.emit('routing:decision', {
      provider: selectedProvider,
      strategy: this.strategy,
      options
    });

    return selectedProvider;
  }

  /**
   * Select provider by lowest cost
   */
  selectByCost(providers, options) {
    const estimatedTokens = options.estimatedTokens || 1000;

    let lowestCost = Infinity;
    let selectedProvider = providers[0];

    providers.forEach(providerName => {
      const provider = this.providers.get(providerName);
      const info = provider.getProviderInfo();
      const models = Object.values(info.models);

      models.forEach(model => {
        if (model.pricing) {
          const cost = (estimatedTokens * model.pricing.inputTokens) +
                      (estimatedTokens * model.pricing.outputTokens);

          if (cost < lowestCost) {
            lowestCost = cost;
            selectedProvider = providerName;
          }
        }
      });
    });

    return selectedProvider;
  }

  /**
   * Select provider by best performance (lowest latency)
   */
  selectByPerformance(providers, options) {
    let lowestLatency = Infinity;
    let selectedProvider = providers[0];

    providers.forEach(providerName => {
      const provider = this.providers.get(providerName);
      const stats = provider.getStats();

      if (stats.averageLatency < lowestLatency) {
        lowestLatency = stats.averageLatency;
        selectedProvider = providerName;
      }
    });

    return selectedProvider;
  }

  /**
   * Select provider by quality (success rate + capabilities)
   */
  selectByQuality(providers, options) {
    let bestScore = -Infinity;
    let selectedProvider = providers[0];

    providers.forEach(providerName => {
      const provider = this.providers.get(providerName);
      const stats = provider.getStats();
      const info = provider.getProviderInfo();

      // Calculate quality score
      let score = stats.successRate || 50;

      // Bonus for specific capabilities
      if (options.requiresVision && info.capabilities.includes('vision')) {
        score += 10;
      }
      if (options.requiresThinking && info.capabilities.includes('thinking')) {
        score += 10;
      }
      if (options.requiresFunctions && info.capabilities.includes('functions')) {
        score += 5;
      }

      if (score > bestScore) {
        bestScore = score;
        selectedProvider = providerName;
      }
    });

    return selectedProvider;
  }

  /**
   * Select provider using round-robin
   */
  selectRoundRobin(providers) {
    const provider = providers[this.roundRobinIndex % providers.length];
    this.roundRobinIndex++;
    return provider;
  }

  /**
   * Select provider using weighted distribution
   */
  selectWeighted(providers) {
    const weights = ROUTER_CONFIG.providerWeights;
    const totalWeight = providers.reduce((sum, p) => sum + (weights[p] || 1.0), 0);
    let random = Math.random() * totalWeight;

    for (const provider of providers) {
      const weight = weights[provider] || 1.0;
      random -= weight;
      if (random <= 0) {
        return provider;
      }
    }

    return providers[providers.length - 1];
  }

  /**
   * Get available providers (circuit not open, not overloaded)
   */
  getAvailableProviders() {
    const available = [];

    this.providers.forEach((provider, name) => {
      if (this.isProviderAvailable(name)) {
        available.push(name);
      }
    });

    return available;
  }

  /**
   * Check if provider is available
   */
  isProviderAvailable(providerName) {
    // Check circuit breaker
    if (this.enableCircuitBreaker) {
      const circuit = this.circuitBreakers.get(providerName);
      if (circuit.state === CircuitState.OPEN) {
        // Check if timeout has elapsed
        const now = Date.now();
        if (now - circuit.lastFailureTime >= ROUTER_CONFIG.circuitBreaker.timeout) {
          // Transition to half-open
          circuit.state = CircuitState.HALF_OPEN;
          circuit.halfOpenRequests = 0;
          this.emit('circuit:half-open', { provider: providerName });
        } else {
          return false;
        }
      }

      // Limit requests in half-open state
      if (circuit.state === CircuitState.HALF_OPEN) {
        if (circuit.halfOpenRequests >= ROUTER_CONFIG.circuitBreaker.halfOpenRequests) {
          return false;
        }
      }
    }

    // Check load balancing
    if (this.enableLoadBalancing) {
      const loadBalancer = this.loadBalancers.get(providerName);
      if (loadBalancer.activeRequests >= loadBalancer.maxConcurrent) {
        return false;
      }
    }

    return true;
  }

  /**
   * Execute request with selected provider
   */
  async executeRequest(providerName, method, options) {
    const provider = this.providers.get(providerName);
    const circuit = this.circuitBreakers.get(providerName);
    const loadBalancer = this.loadBalancers.get(providerName);

    // Track active request
    if (this.enableLoadBalancing) {
      loadBalancer.activeRequests++;
    }

    // Track half-open requests
    if (circuit.state === CircuitState.HALF_OPEN) {
      circuit.halfOpenRequests++;
    }

    try {
      // Execute provider method
      const result = await provider[method](options);

      // Record success
      this.recordSuccess(providerName);

      return result;

    } catch (error) {
      // Record failure
      this.recordFailure(providerName, error);

      throw error;

    } finally {
      // Release active request
      if (this.enableLoadBalancing) {
        loadBalancer.activeRequests--;
      }
    }
  }

  /**
   * Record successful request
   */
  recordSuccess(providerName) {
    const circuit = this.circuitBreakers.get(providerName);

    if (circuit.state === CircuitState.HALF_OPEN) {
      circuit.successes++;

      // Close circuit if threshold met
      if (circuit.successes >= ROUTER_CONFIG.circuitBreaker.successThreshold) {
        circuit.state = CircuitState.CLOSED;
        circuit.failures = 0;
        circuit.successes = 0;
        this.emit('circuit:closed', { provider: providerName });
      }
    } else if (circuit.state === CircuitState.CLOSED) {
      // Reset failure count on success
      circuit.failures = 0;
    }

    // Update stats
    if (!this.stats.providerStats[providerName]) {
      this.stats.providerStats[providerName] = {
        successes: 0,
        failures: 0
      };
    }
    this.stats.providerStats[providerName].successes++;
  }

  /**
   * Record failed request
   */
  recordFailure(providerName, error) {
    const circuit = this.circuitBreakers.get(providerName);

    circuit.failures++;
    circuit.lastFailureTime = Date.now();

    // Open circuit if threshold met
    if (circuit.failures >= ROUTER_CONFIG.circuitBreaker.failureThreshold) {
      if (circuit.state !== CircuitState.OPEN) {
        circuit.state = CircuitState.OPEN;
        this.stats.circuitBreakerTrips++;
        this.emit('circuit:opened', {
          provider: providerName,
          failures: circuit.failures
        });
      }
    }

    // Update stats
    if (!this.stats.providerStats[providerName]) {
      this.stats.providerStats[providerName] = {
        successes: 0,
        failures: 0
      };
    }
    this.stats.providerStats[providerName].failures++;
  }

  /**
   * Route request to appropriate provider
   */
  async route(method, options, onChunk) {
    this.stats.totalRequests++;

    const startTime = Date.now();
    let lastError = null;
    let attemptCount = 0;

    // Try primary provider
    let providerName = this.selectProvider(options);

    while (attemptCount < ROUTER_CONFIG.retry.maxRetries) {
      try {
        this.emit('request:attempt', {
          provider: providerName,
          attempt: attemptCount + 1,
          method
        });

        const result = await this.executeRequest(providerName, method, options, onChunk);

        this.stats.successfulRequests++;

        this.emit('request:success', {
          provider: providerName,
          latency: Date.now() - startTime
        });

        return result;

      } catch (error) {
        lastError = error;
        attemptCount++;

        this.emit('request:error', {
          provider: providerName,
          attempt: attemptCount,
          error: error.message
        });

        // Try failover if enabled and retries remain
        if (this.enableFailover && attemptCount < ROUTER_CONFIG.retry.maxRetries) {
          const availableProviders = this.getAvailableProviders().filter(p => p !== providerName);

          if (availableProviders.length > 0) {
            providerName = this.selectProviderByStrategy(availableProviders, options);
            this.stats.failoverCount++;

            this.emit('failover:executing', {
              from: providerName,
              to: providerName,
              attempt: attemptCount
            });

            // Exponential backoff
            const delay = Math.min(
              ROUTER_CONFIG.retry.initialDelayMs * Math.pow(ROUTER_CONFIG.retry.backoffMultiplier, attemptCount - 1),
              ROUTER_CONFIG.retry.maxDelayMs
            );
            await new Promise(resolve => setTimeout(resolve, delay));

            continue;
          }
        }

        break;
      }
    }

    // All attempts failed
    this.stats.failedRequests++;

    this.emit('request:failed', {
      attempts: attemptCount,
      error: lastError?.message
    });

    throw lastError || new Error('Request failed after all retry attempts');
  }

  /**
   * Create chat completion with routing
   */
  async createChatCompletion(options) {
    return this.route('createChatCompletion', options);
  }

  /**
   * Create streaming chat completion with routing
   */
  async createStreamingChatCompletion(options, onChunk) {
    return this.route('createStreamingChatCompletion', options, onChunk);
  }

  /**
   * Get provider by name
   */
  getProvider(name) {
    return this.providers.get(name);
  }

  /**
   * Get all provider names
   */
  getProviderNames() {
    return Array.from(this.providers.keys());
  }

  /**
   * Get router statistics
   */
  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.totalRequests > 0
        ? (this.stats.successfulRequests / this.stats.totalRequests) * 100
        : 0,
      circuitStates: Array.from(this.circuitBreakers.entries()).reduce((acc, [name, circuit]) => {
        acc[name] = circuit.state;
        return acc;
      }, {}),
      loadBalancers: Array.from(this.loadBalancers.entries()).reduce((acc, [name, lb]) => {
        acc[name] = {
          activeRequests: lb.activeRequests,
          maxConcurrent: lb.maxConcurrent
        };
        return acc;
      }, {})
    };
  }

  /**
   * Reset circuit breaker for a provider
   */
  resetCircuitBreaker(providerName) {
    if (this.circuitBreakers.has(providerName)) {
      const circuit = this.circuitBreakers.get(providerName);
      circuit.state = CircuitState.CLOSED;
      circuit.failures = 0;
      circuit.successes = 0;
      circuit.lastFailureTime = null;
      this.emit('circuit:reset', { provider: providerName });
    }
  }

  /**
   * Set routing strategy
   */
  setStrategy(strategy) {
    if (!Object.values(ROUTER_CONFIG.strategies).includes(strategy)) {
      throw new Error(`Invalid strategy: ${strategy}`);
    }
    this.strategy = strategy;
    this.emit('strategy:changed', { strategy });
  }

  /**
   * Health monitoring
   */
  async startHealthMonitoring() {
    this.healthMonitorInterval = setInterval(async () => {
      for (const [name, provider] of this.providers) {
        try {
          const health = await provider.checkHealth();
          this.emit('health:checked', {
            provider: name,
            status: health.status
          });
        } catch (error) {
          this.emit('health:check-failed', {
            provider: name,
            error: error.message
          });
        }
      }
    }, ROUTER_CONFIG.healthCheck.interval);
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring() {
    if (this.healthMonitorInterval) {
      clearInterval(this.healthMonitorInterval);
      this.healthMonitorInterval = null;
    }
  }

  /**
   * Cleanup and close all providers
   */
  async cleanup() {
    this.stopHealthMonitoring();

    for (const [name, provider] of this.providers) {
      try {
        await provider.cleanup();
        this.emit('provider:cleaned', { name });
      } catch (error) {
        this.emit('provider:cleanup-failed', {
          name,
          error: error.message
        });
      }
    }

    this.removeAllListeners();
    this.emit('cleanup:complete');
  }
}

module.exports = ProviderRouter;
module.exports.CircuitState = CircuitState;
module.exports.ROUTER_CONFIG = ROUTER_CONFIG;
