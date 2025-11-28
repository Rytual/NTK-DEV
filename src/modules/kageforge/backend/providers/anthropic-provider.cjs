/**
 * Anthropic Provider - Kage Forge 2025 Edition
 * Supports: Claude 4.5 Sonnet, Claude 4.5 Opus
 * Context: 200K tokens
 * Features: Messages API, Tool use, Thinking blocks, Vision, Prompt caching
 *
 * @module AnthropicProvider
 * @version 8.0.0
 */

const Anthropic = require('@anthropic-ai/sdk');
const { EventEmitter } = require('events');

/**
 * Anthropic Provider Configuration
 */
const ANTHROPIC_CONFIG = {
  models: {
    'claude-4.5-sonnet-20250514': {
      name: 'claude-4.5-sonnet-20250514',
      displayName: 'Claude 4.5 Sonnet',
      contextWindow: 200000,
      maxOutputTokens: 8192,
      supportsVision: true,
      supportsTools: true,
      supportsThinking: true,
      supportsCaching: true,
      supportsStreaming: true,
      pricing: {
        inputTokens: 0.000003,        // $3 per million input tokens
        outputTokens: 0.000015,       // $15 per million output tokens
        cachedInputTokens: 0.0000003, // $0.30 per million (90% discount)
        cachedCreationTokens: 0.00000375 // $3.75 per million (25% markup)
      },
      latency: 'low',
      capabilities: ['chat', 'vision', 'tools', 'thinking', 'caching', 'json']
    },
    'claude-4.5-opus-20250514': {
      name: 'claude-4.5-opus-20250514',
      displayName: 'Claude 4.5 Opus',
      contextWindow: 200000,
      maxOutputTokens: 16384,
      supportsVision: true,
      supportsTools: true,
      supportsThinking: true,
      supportsCaching: true,
      supportsStreaming: true,
      pricing: {
        inputTokens: 0.000015,         // $15 per million input tokens
        outputTokens: 0.000075,        // $75 per million output tokens
        cachedInputTokens: 0.0000015,  // $1.50 per million (90% discount)
        cachedCreationTokens: 0.00001875 // $18.75 per million (25% markup)
      },
      latency: 'medium',
      capabilities: ['chat', 'vision', 'tools', 'thinking', 'caching', 'json', 'advanced-reasoning']
    }
  },
  endpoints: {
    api: 'https://api.anthropic.com',
    messages: '/v1/messages'
  },
  retryConfig: {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2
  },
  timeouts: {
    standard: 60000,    // 1 minute
    thinking: 180000,   // 3 minutes for extended thinking
    vision: 90000       // 1.5 minutes for vision
  },
  headers: {
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true'
  }
};

/**
 * Anthropic Provider Class
 * Handles all interactions with Anthropic's Claude 4.5 models
 */
class AnthropicProvider extends EventEmitter {
  constructor(config = {}) {
    super();

    this.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
    this.baseURL = config.baseURL || ANTHROPIC_CONFIG.endpoints.api;
    this.defaultModel = config.defaultModel || 'claude-4.5-sonnet-20250514';
    this.timeout = config.timeout || ANTHROPIC_CONFIG.timeouts.standard;
    this.maxRetries = config.maxRetries || ANTHROPIC_CONFIG.retryConfig.maxRetries;

    // Initialize Anthropic client
    this.client = new Anthropic({
      apiKey: this.apiKey,
      baseURL: this.baseURL,
      timeout: this.timeout,
      maxRetries: this.maxRetries
    });

    // Statistics tracking
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTokensUsed: 0,
      totalCost: 0,
      averageLatency: 0,
      cacheHits: 0,
      cacheMisses: 0,
      cacheCreations: 0,
      requestsByModel: {},
      errorsByType: {}
    };

    // Request history
    this.requestHistory = [];
    this.maxHistorySize = config.maxHistorySize || 1000;

    // Cache management
    this.cacheEnabled = config.cacheEnabled ?? true;

    this.emit('initialized', { provider: 'anthropic', models: Object.keys(ANTHROPIC_CONFIG.models) });
  }

  /**
   * Get provider information
   */
  getProviderInfo() {
    return {
      name: 'Anthropic',
      version: '8.0.0',
      models: ANTHROPIC_CONFIG.models,
      capabilities: ['chat', 'vision', 'tools', 'thinking', 'caching', 'streaming'],
      status: 'active',
      stats: this.stats
    };
  }

  /**
   * Count tokens (rough estimate for Anthropic)
   * Anthropic uses a different tokenizer, this is an approximation
   */
  countTokens(text) {
    if (!text) return 0;
    // Approximation: ~3.5 characters per token for English text
    return Math.ceil(text.length / 3.5);
  }

  /**
   * Count tokens in messages array
   */
  countMessageTokens(messages, system = '') {
    let tokenCount = 0;

    // System message tokens
    if (system) {
      tokenCount += this.countTokens(system);
      tokenCount += 10; // Overhead for system message
    }

    // Message tokens
    messages.forEach(message => {
      tokenCount += 4; // Message overhead

      if (message.role) {
        tokenCount += 1; // Role token
      }

      if (message.content) {
        if (typeof message.content === 'string') {
          tokenCount += this.countTokens(message.content);
        } else if (Array.isArray(message.content)) {
          message.content.forEach(block => {
            if (block.type === 'text') {
              tokenCount += this.countTokens(block.text);
            } else if (block.type === 'image') {
              // Image tokens estimation
              tokenCount += 1600; // Approximate tokens per image
            } else if (block.type === 'tool_use') {
              tokenCount += this.countTokens(block.name);
              tokenCount += this.countTokens(JSON.stringify(block.input));
            } else if (block.type === 'tool_result') {
              tokenCount += this.countTokens(block.content);
            }
          });
        }
      }
    });

    return tokenCount;
  }

  /**
   * Calculate cost for a request
   */
  calculateCost(model, usage) {
    const modelConfig = ANTHROPIC_CONFIG.models[model];
    if (!modelConfig) return 0;

    const pricing = modelConfig.pricing;
    let cost = 0;

    // Input tokens
    cost += (usage.input_tokens || 0) * pricing.inputTokens;

    // Output tokens
    cost += (usage.output_tokens || 0) * pricing.outputTokens;

    // Cached input tokens (cache read)
    if (usage.cache_read_input_tokens) {
      cost += usage.cache_read_input_tokens * pricing.cachedInputTokens;
    }

    // Cache creation tokens
    if (usage.cache_creation_input_tokens) {
      cost += usage.cache_creation_input_tokens * pricing.cachedCreationTokens;
    }

    return cost;
  }

  /**
   * Validate model availability
   */
  validateModel(model) {
    if (!ANTHROPIC_CONFIG.models[model]) {
      throw new Error(`Model ${model} is not supported. Available models: ${Object.keys(ANTHROPIC_CONFIG.models).join(', ')}`);
    }
    return true;
  }

  /**
   * Prepare messages for API
   */
  prepareMessages(messages) {
    return messages.map(msg => {
      const message = { role: msg.role };

      // Handle content
      if (msg.content) {
        if (typeof msg.content === 'string') {
          message.content = msg.content;
        } else if (Array.isArray(msg.content)) {
          message.content = msg.content;
        }
      }

      return message;
    });
  }

  /**
   * Prepare tools for API
   */
  prepareTools(tools) {
    if (!tools || !Array.isArray(tools)) return undefined;

    return tools.map(tool => {
      if (tool.type === 'function') {
        // Convert OpenAI-style function to Anthropic tool
        return {
          name: tool.function.name,
          description: tool.function.description,
          input_schema: tool.function.parameters || {
            type: 'object',
            properties: {},
            required: []
          }
        };
      }
      // Already in Anthropic format
      return tool;
    });
  }

  /**
   * Create message (chat completion)
   */
  async createMessage(options) {
    const startTime = Date.now();
    const model = options.model || this.defaultModel;

    this.validateModel(model);

    const modelConfig = ANTHROPIC_CONFIG.models[model];
    const messages = this.prepareMessages(options.messages);

    // Estimate input tokens
    const estimatedInputTokens = this.countMessageTokens(messages, options.system || '');

    this.emit('request:start', {
      model,
      estimatedInputTokens,
      timestamp: startTime
    });

    try {
      // Build request parameters
      const requestParams = {
        model,
        messages,
        max_tokens: options.max_tokens || modelConfig.maxOutputTokens,
        temperature: options.temperature ?? 1.0,
        top_p: options.top_p ?? 1.0,
        top_k: options.top_k,
        stream: options.stream ?? false
      };

      // Add system message
      if (options.system) {
        if (this.cacheEnabled && options.enableCache) {
          // Use prompt caching for system message
          requestParams.system = [
            {
              type: 'text',
              text: options.system,
              cache_control: { type: 'ephemeral' }
            }
          ];
        } else {
          requestParams.system = options.system;
        }
      }

      // Add stop sequences
      if (options.stop_sequences) {
        requestParams.stop_sequences = options.stop_sequences;
      }

      // Add tools
      if (options.tools) {
        requestParams.tools = this.prepareTools(options.tools);
      }

      // Add metadata
      if (options.metadata) {
        requestParams.metadata = options.metadata;
      }

      // Add thinking mode
      if (options.thinking) {
        requestParams.thinking = {
          type: 'enabled',
          budget_tokens: options.thinking_budget || 10000
        };
      }

      // Make API request
      const response = await this.client.messages.create(requestParams);

      const endTime = Date.now();
      const latency = endTime - startTime;

      // Extract usage information
      const usage = response.usage;
      const cost = this.calculateCost(model, usage);

      // Update cache statistics
      if (usage.cache_read_input_tokens > 0) {
        this.stats.cacheHits++;
      } else {
        this.stats.cacheMisses++;
      }
      if (usage.cache_creation_input_tokens > 0) {
        this.stats.cacheCreations++;
      }

      // Update statistics
      this.updateStats({
        model,
        success: true,
        inputTokens: usage.input_tokens,
        outputTokens: usage.output_tokens,
        totalTokens: usage.input_tokens + usage.output_tokens,
        cost,
        latency,
        cached: usage.cache_read_input_tokens > 0
      });

      // Emit completion event
      this.emit('request:complete', {
        model,
        usage,
        cost,
        latency,
        stopReason: response.stop_reason
      });

      // Extract content
      const content = this.extractContent(response.content);

      // Build result
      const result = {
        id: response.id,
        model: response.model,
        role: response.role,
        content,
        stopReason: response.stop_reason,
        stopSequence: response.stop_sequence,
        usage: {
          inputTokens: usage.input_tokens,
          outputTokens: usage.output_tokens,
          totalTokens: usage.input_tokens + usage.output_tokens,
          cacheReadTokens: usage.cache_read_input_tokens || 0,
          cacheCreationTokens: usage.cache_creation_input_tokens || 0
        },
        cost,
        latency,
        timestamp: endTime
      };

      // Add thinking if present
      const thinking = this.extractThinking(response.content);
      if (thinking) {
        result.thinking = thinking;
      }

      // Add tool uses if present
      const toolUses = this.extractToolUses(response.content);
      if (toolUses.length > 0) {
        result.toolUses = toolUses;
      }

      // Add to history
      this.addToHistory(result);

      return result;

    } catch (error) {
      const endTime = Date.now();
      const latency = endTime - startTime;

      this.updateStats({
        model,
        success: false,
        error: error.message,
        latency
      });

      this.emit('request:error', {
        model,
        error: error.message,
        type: error.type,
        latency
      });

      throw this.handleError(error);
    }
  }

  /**
   * Create streaming message
   */
  async createStreamingMessage(options, onChunk) {
    const startTime = Date.now();
    const model = options.model || this.defaultModel;

    this.validateModel(model);

    const modelConfig = ANTHROPIC_CONFIG.models[model];
    const messages = this.prepareMessages(options.messages);

    // Estimate input tokens
    const estimatedInputTokens = this.countMessageTokens(messages, options.system || '');

    this.emit('stream:start', {
      model,
      estimatedInputTokens,
      timestamp: startTime
    });

    try {
      // Build request parameters
      const requestParams = {
        model,
        messages,
        max_tokens: options.max_tokens || modelConfig.maxOutputTokens,
        temperature: options.temperature ?? 1.0,
        top_p: options.top_p ?? 1.0,
        stream: true
      };

      // Add system message
      if (options.system) {
        if (this.cacheEnabled && options.enableCache) {
          requestParams.system = [
            {
              type: 'text',
              text: options.system,
              cache_control: { type: 'ephemeral' }
            }
          ];
        } else {
          requestParams.system = options.system;
        }
      }

      // Add tools
      if (options.tools) {
        requestParams.tools = this.prepareTools(options.tools);
      }

      // Add thinking mode
      if (options.thinking) {
        requestParams.thinking = {
          type: 'enabled',
          budget_tokens: options.thinking_budget || 10000
        };
      }

      // Create stream
      const stream = await this.client.messages.stream(requestParams);

      let fullContent = '';
      let fullThinking = '';
      let toolUses = [];
      let currentToolUse = null;
      let stopReason = null;
      let usage = null;

      // Handle stream events
      stream.on('text', (text, snapshot) => {
        fullContent += text;

        this.emit('stream:delta', {
          type: 'text',
          text,
          fullContent
        });

        if (onChunk) {
          onChunk({
            type: 'text',
            text,
            fullContent
          });
        }
      });

      stream.on('contentBlock', (block) => {
        if (block.type === 'thinking') {
          fullThinking = block.thinking;
        } else if (block.type === 'tool_use') {
          currentToolUse = {
            id: block.id,
            name: block.name,
            input: {}
          };
        }
      });

      stream.on('contentBlockDelta', (delta) => {
        if (delta.type === 'thinking_delta') {
          fullThinking += delta.delta;

          this.emit('stream:delta', {
            type: 'thinking',
            thinking: delta.delta,
            fullThinking
          });

          if (onChunk) {
            onChunk({
              type: 'thinking',
              thinking: delta.delta,
              fullThinking
            });
          }
        } else if (delta.type === 'input_json_delta' && currentToolUse) {
          // Accumulate tool input
          Object.assign(currentToolUse.input, JSON.parse(delta.delta));
        }
      });

      stream.on('contentBlockStop', () => {
        if (currentToolUse) {
          toolUses.push(currentToolUse);
          currentToolUse = null;
        }
      });

      stream.on('messageStop', () => {
        stopReason = stream.finalMessage?.stop_reason;
        usage = stream.finalMessage?.usage;
      });

      // Wait for completion
      await stream.finalMessage();

      const endTime = Date.now();
      const latency = endTime - startTime;

      // Calculate cost
      const cost = usage ? this.calculateCost(model, usage) : 0;

      // Update cache statistics
      if (usage?.cache_read_input_tokens > 0) {
        this.stats.cacheHits++;
      } else {
        this.stats.cacheMisses++;
      }
      if (usage?.cache_creation_input_tokens > 0) {
        this.stats.cacheCreations++;
      }

      // Update statistics
      this.updateStats({
        model,
        success: true,
        inputTokens: usage?.input_tokens || 0,
        outputTokens: usage?.output_tokens || 0,
        totalTokens: (usage?.input_tokens || 0) + (usage?.output_tokens || 0),
        cost,
        latency,
        cached: usage?.cache_read_input_tokens > 0
      });

      this.emit('stream:complete', {
        model,
        usage,
        cost,
        latency,
        stopReason
      });

      const result = {
        role: 'assistant',
        content: fullContent,
        thinking: fullThinking || undefined,
        toolUses: toolUses.length > 0 ? toolUses : undefined,
        stopReason,
        usage: usage ? {
          inputTokens: usage.input_tokens,
          outputTokens: usage.output_tokens,
          totalTokens: usage.input_tokens + usage.output_tokens,
          cacheReadTokens: usage.cache_read_input_tokens || 0,
          cacheCreationTokens: usage.cache_creation_input_tokens || 0
        } : undefined,
        cost,
        latency,
        timestamp: endTime
      };

      this.addToHistory(result);

      return result;

    } catch (error) {
      const endTime = Date.now();
      const latency = endTime - startTime;

      this.updateStats({
        model,
        success: false,
        error: error.message,
        latency
      });

      this.emit('stream:error', {
        model,
        error: error.message,
        latency
      });

      throw this.handleError(error);
    }
  }

  /**
   * Extract text content from response
   */
  extractContent(contentBlocks) {
    if (!Array.isArray(contentBlocks)) return '';

    return contentBlocks
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('');
  }

  /**
   * Extract thinking from response
   */
  extractThinking(contentBlocks) {
    if (!Array.isArray(contentBlocks)) return null;

    const thinkingBlocks = contentBlocks.filter(block => block.type === 'thinking');
    if (thinkingBlocks.length === 0) return null;

    return thinkingBlocks.map(block => block.thinking).join('\n\n');
  }

  /**
   * Extract tool uses from response
   */
  extractToolUses(contentBlocks) {
    if (!Array.isArray(contentBlocks)) return [];

    return contentBlocks
      .filter(block => block.type === 'tool_use')
      .map(block => ({
        id: block.id,
        name: block.name,
        input: block.input
      }));
  }

  /**
   * Handle errors
   */
  handleError(error) {
    const errorType = error.type || error.error?.type || 'unknown';

    // Update error statistics
    if (!this.stats.errorsByType[errorType]) {
      this.stats.errorsByType[errorType] = 0;
    }
    this.stats.errorsByType[errorType]++;

    // Create standardized error
    const standardError = {
      provider: 'anthropic',
      type: errorType,
      message: error.message,
      status: error.status,
      retryable: this.isRetryableError(error),
      timestamp: Date.now()
    };

    return standardError;
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(error) {
    const retryableTypes = [
      'rate_limit_error',
      'overloaded_error',
      'api_error',
      'timeout_error'
    ];

    const retryableStatuses = [429, 500, 502, 503, 504];

    return (
      retryableTypes.includes(error.type) ||
      retryableTypes.includes(error.error?.type) ||
      retryableStatuses.includes(error.status)
    );
  }

  /**
   * Update statistics
   */
  updateStats(data) {
    this.stats.totalRequests++;

    if (data.success) {
      this.stats.successfulRequests++;
      this.stats.totalTokensUsed += data.totalTokens || 0;
      this.stats.totalCost += data.cost || 0;

      // Update average latency
      const totalLatency = this.stats.averageLatency * (this.stats.successfulRequests - 1) + data.latency;
      this.stats.averageLatency = totalLatency / this.stats.successfulRequests;

      // Update per-model stats
      if (!this.stats.requestsByModel[data.model]) {
        this.stats.requestsByModel[data.model] = {
          count: 0,
          tokens: 0,
          cost: 0,
          cacheHits: 0
        };
      }
      this.stats.requestsByModel[data.model].count++;
      this.stats.requestsByModel[data.model].tokens += data.totalTokens || 0;
      this.stats.requestsByModel[data.model].cost += data.cost || 0;
      if (data.cached) {
        this.stats.requestsByModel[data.model].cacheHits++;
      }
    } else {
      this.stats.failedRequests++;
    }
  }

  /**
   * Add to request history
   */
  addToHistory(result) {
    this.requestHistory.push(result);

    // Maintain max history size
    if (this.requestHistory.length > this.maxHistorySize) {
      this.requestHistory.shift();
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    const cacheHitRate = (this.stats.cacheHits + this.stats.cacheMisses) > 0
      ? (this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses)) * 100
      : 0;

    return {
      ...this.stats,
      successRate: this.stats.totalRequests > 0
        ? (this.stats.successfulRequests / this.stats.totalRequests) * 100
        : 0,
      cacheHitRate
    };
  }

  /**
   * Get request history
   */
  getHistory(limit = 100) {
    return this.requestHistory.slice(-limit);
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTokensUsed: 0,
      totalCost: 0,
      averageLatency: 0,
      cacheHits: 0,
      cacheMisses: 0,
      cacheCreations: 0,
      requestsByModel: {},
      errorsByType: {}
    };
    this.emit('stats:reset');
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.requestHistory = [];
    this.emit('history:cleared');
  }

  /**
   * Check health
   */
  async checkHealth() {
    try {
      // Make a minimal request to check API availability
      const response = await this.client.messages.create({
        model: this.defaultModel,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'ping' }]
      });

      return {
        status: 'healthy',
        provider: 'anthropic',
        model: response.model,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        provider: 'anthropic',
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Cleanup and close connections
   */
  async cleanup() {
    this.removeAllListeners();
    this.emit('cleanup:complete');
  }
}

module.exports = AnthropicProvider;
