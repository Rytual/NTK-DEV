/**
 * Grok Provider - Kage Forge 2025 Edition
 * Supports: Grok 4.1 EQ, Grok 4 Thinking
 * Context: 128K tokens
 * Features: Enhanced Quality, Thinking mode, Real-time X data, OpenAI-compatible API
 *
 * @module GrokProvider
 * @version 8.0.0
 */

const OpenAI = require('openai').default;
const { EventEmitter } = require('events');

/**
 * Grok Provider Configuration
 */
const GROK_CONFIG = {
  models: {
    'grok-4.1-eq': {
      name: 'grok-4.1-eq',
      displayName: 'Grok 4.1 EQ',
      contextWindow: 128000,
      maxOutputTokens: 16384,
      supportsVision: true,
      supportsFunctions: true,
      supportsStreaming: true,
      supportsRealTimeData: true,
      pricing: {
        inputTokens: 0.000008,   // $8 per million input tokens
        outputTokens: 0.000024,  // $24 per million output tokens
        cachedInputTokens: 0.000004  // 50% discount
      },
      latency: 'low',
      capabilities: ['chat', 'eq-reasoning', 'realtime-x', 'functions', 'vision', 'json']
    },
    'grok-4-thinking': {
      name: 'grok-4-thinking',
      displayName: 'Grok 4 Thinking',
      contextWindow: 128000,
      maxOutputTokens: 32768,
      supportsVision: true,
      supportsFunctions: true,
      supportsStreaming: true,
      supportsThinking: true,
      supportsRealTimeData: true,
      pricing: {
        inputTokens: 0.00001,    // $10 per million input tokens
        outputTokens: 0.00003,   // $30 per million output tokens
        thinkingTokens: 0.000015, // $15 per million thinking tokens
        cachedInputTokens: 0.000005
      },
      latency: 'extended',
      capabilities: ['chat', 'thinking', 'reasoning', 'realtime-x', 'functions', 'vision', 'json']
    }
  },
  endpoints: {
    api: 'https://api.x.ai/v1',
    chat: '/chat/completions',
    embeddings: '/embeddings',
    models: '/models'
  },
  retryConfig: {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2
  },
  timeouts: {
    standard: 60000,    // 1 minute
    thinking: 120000,   // 2 minutes for thinking mode
    realtime: 45000     // 45 seconds for real-time data
  },
  realTimeDataConfig: {
    enabled: true,
    sources: ['x-platform', 'news', 'trending'],
    maxAge: 3600,  // 1 hour max age for real-time data
    priority: 'recent'
  }
};

/**
 * Grok Provider Class
 * Handles all interactions with xAI's Grok models
 */
class GrokProvider extends EventEmitter {
  constructor(config = {}) {
    super();

    this.apiKey = config.apiKey || process.env.XAI_API_KEY || process.env.GROK_API_KEY;
    this.baseURL = config.baseURL || GROK_CONFIG.endpoints.api;
    this.defaultModel = config.defaultModel || 'grok-4.1-eq';
    this.timeout = config.timeout || GROK_CONFIG.timeouts.standard;
    this.maxRetries = config.maxRetries || GROK_CONFIG.retryConfig.maxRetries;

    if (!this.apiKey) {
      throw new Error('Grok API key is required. Set XAI_API_KEY or GROK_API_KEY environment variable.');
    }

    // Initialize Grok client (OpenAI-compatible)
    this.client = new OpenAI({
      apiKey: this.apiKey,
      baseURL: this.baseURL,
      timeout: this.timeout,
      maxRetries: this.maxRetries
    });

    // Real-time data configuration
    this.realTimeDataEnabled = config.realTimeDataEnabled ?? GROK_CONFIG.realTimeDataConfig.enabled;

    // Statistics tracking
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTokensUsed: 0,
      totalCost: 0,
      averageLatency: 0,
      realTimeDataRequests: 0,
      thinkingRequests: 0,
      requestsByModel: {},
      errorsByType: {}
    };

    // Request history
    this.requestHistory = [];
    this.maxHistorySize = config.maxHistorySize || 1000;

    this.emit('initialized', { provider: 'grok', models: Object.keys(GROK_CONFIG.models) });
  }

  /**
   * Get provider information
   */
  getProviderInfo() {
    return {
      name: 'Grok (xAI)',
      version: '8.0.0',
      models: GROK_CONFIG.models,
      capabilities: ['chat', 'thinking', 'realtime-data', 'functions', 'vision', 'streaming'],
      status: 'active',
      stats: this.stats
    };
  }

  /**
   * Count tokens (approximation)
   */
  countTokens(text) {
    if (!text) return 0;
    // Approximation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Count tokens in messages array
   */
  countMessageTokens(messages) {
    let tokenCount = 0;

    messages.forEach(message => {
      tokenCount += 4; // Message overhead

      if (message.role) {
        tokenCount += this.countTokens(message.role);
      }

      if (message.content) {
        if (typeof message.content === 'string') {
          tokenCount += this.countTokens(message.content);
        } else if (Array.isArray(message.content)) {
          message.content.forEach(part => {
            if (part.type === 'text') {
              tokenCount += this.countTokens(part.text);
            } else if (part.type === 'image_url') {
              tokenCount += 85; // Base image cost
            }
          });
        }
      }

      if (message.function_call) {
        tokenCount += this.countTokens(message.function_call.name);
        tokenCount += this.countTokens(message.function_call.arguments);
      }

      if (message.tool_calls) {
        message.tool_calls.forEach(tool => {
          tokenCount += this.countTokens(tool.function.name);
          tokenCount += this.countTokens(tool.function.arguments);
        });
      }
    });

    tokenCount += 2; // Reply priming

    return tokenCount;
  }

  /**
   * Calculate cost for a request
   */
  calculateCost(model, inputTokens, outputTokens, thinkingTokens = 0, cached = false) {
    const modelConfig = GROK_CONFIG.models[model];
    if (!modelConfig) return 0;

    const pricing = modelConfig.pricing;
    let cost = 0;

    // Input tokens cost
    if (cached && pricing.cachedInputTokens) {
      cost += inputTokens * pricing.cachedInputTokens;
    } else {
      cost += inputTokens * pricing.inputTokens;
    }

    // Output tokens cost
    cost += outputTokens * pricing.outputTokens;

    // Thinking tokens cost
    if (thinkingTokens > 0 && pricing.thinkingTokens) {
      cost += thinkingTokens * pricing.thinkingTokens;
    }

    return cost;
  }

  /**
   * Validate model availability
   */
  validateModel(model) {
    if (!GROK_CONFIG.models[model]) {
      throw new Error(`Model ${model} is not supported. Available models: ${Object.keys(GROK_CONFIG.models).join(', ')}`);
    }
    return true;
  }

  /**
   * Prepare messages for API
   */
  prepareMessages(messages, options = {}) {
    const prepared = messages.map(msg => {
      const message = { role: msg.role };

      if (msg.content) {
        message.content = msg.content;
      }

      if (msg.name) {
        message.name = msg.name;
      }

      if (msg.function_call) {
        message.function_call = msg.function_call;
      }

      if (msg.tool_calls) {
        message.tool_calls = msg.tool_calls;
      }

      if (msg.tool_call_id) {
        message.tool_call_id = msg.tool_call_id;
      }

      return message;
    });

    // Add real-time data context if enabled
    if (this.realTimeDataEnabled && options.includeRealTimeData) {
      const systemMessage = {
        role: 'system',
        content: 'You have access to real-time data from X platform and current events. Use this information when relevant to provide the most up-to-date responses.'
      };
      prepared.unshift(systemMessage);
    }

    return prepared;
  }

  /**
   * Create chat completion
   */
  async createChatCompletion(options) {
    const startTime = Date.now();
    const model = options.model || this.defaultModel;

    this.validateModel(model);

    const modelConfig = GROK_CONFIG.models[model];
    const messages = this.prepareMessages(options.messages, {
      includeRealTimeData: options.includeRealTimeData ?? this.realTimeDataEnabled
    });

    // Count input tokens
    const inputTokens = this.countMessageTokens(messages);

    this.emit('request:start', {
      model,
      inputTokens,
      timestamp: startTime
    });

    try {
      // Build request parameters
      const requestParams = {
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        top_p: options.top_p ?? 1.0,
        n: options.n ?? 1,
        stream: options.stream ?? false,
        max_tokens: options.max_tokens || modelConfig.maxOutputTokens,
        presence_penalty: options.presence_penalty ?? 0,
        frequency_penalty: options.frequency_penalty ?? 0
      };

      // Add stop sequences
      if (options.stop) {
        requestParams.stop = options.stop;
      }

      // Add JSON mode
      if (options.response_format?.type === 'json_object') {
        requestParams.response_format = { type: 'json_object' };
      }

      // Add tools (function calling)
      if (options.tools) {
        requestParams.tools = options.tools;
        if (options.tool_choice) {
          requestParams.tool_choice = options.tool_choice;
        }
      }

      // Add thinking mode parameters
      if (model.includes('thinking')) {
        requestParams.reasoning_effort = options.reasoning_effort || 'medium';
        requestParams.show_thinking = options.show_thinking ?? true;
        this.stats.thinkingRequests++;
      }

      // Add seed for reproducibility
      if (options.seed !== undefined) {
        requestParams.seed = options.seed;
      }

      // Add user identifier
      if (options.user) {
        requestParams.user = options.user;
      }

      // Track real-time data usage
      if (options.includeRealTimeData ?? this.realTimeDataEnabled) {
        this.stats.realTimeDataRequests++;
      }

      // Make API request
      const response = await this.client.chat.completions.create(requestParams);

      const endTime = Date.now();
      const latency = endTime - startTime;

      // Extract response data
      const choice = response.choices[0];
      const outputTokens = response.usage?.completion_tokens || 0;
      const thinkingTokens = response.usage?.thinking_tokens || 0;
      const totalTokens = response.usage?.total_tokens || (inputTokens + outputTokens + thinkingTokens);

      // Calculate cost
      const cost = this.calculateCost(model, inputTokens, outputTokens, thinkingTokens);

      // Update statistics
      this.updateStats({
        model,
        success: true,
        inputTokens,
        outputTokens,
        thinkingTokens,
        totalTokens,
        cost,
        latency
      });

      // Emit completion event
      this.emit('request:complete', {
        model,
        inputTokens,
        outputTokens,
        thinkingTokens,
        totalTokens,
        cost,
        latency,
        finishReason: choice.finish_reason
      });

      // Build result
      const result = {
        id: response.id,
        model: response.model,
        message: choice.message,
        finishReason: choice.finish_reason,
        usage: {
          inputTokens,
          outputTokens,
          thinkingTokens,
          totalTokens
        },
        cost,
        latency,
        timestamp: endTime
      };

      // Add thinking process if available
      if (choice.message.thinking) {
        result.thinking = choice.message.thinking;
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
        code: error.code,
        type: error.type,
        latency
      });

      throw this.handleError(error);
    }
  }

  /**
   * Create streaming chat completion
   */
  async createStreamingChatCompletion(options, onChunk) {
    const startTime = Date.now();
    const model = options.model || this.defaultModel;

    this.validateModel(model);

    const modelConfig = GROK_CONFIG.models[model];
    const messages = this.prepareMessages(options.messages, {
      includeRealTimeData: options.includeRealTimeData ?? this.realTimeDataEnabled
    });

    // Count input tokens
    const inputTokens = this.countMessageTokens(messages);

    this.emit('stream:start', {
      model,
      inputTokens,
      timestamp: startTime
    });

    try {
      // Build request parameters
      const requestParams = {
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        top_p: options.top_p ?? 1.0,
        max_tokens: options.max_tokens || modelConfig.maxOutputTokens,
        stream: true,
        presence_penalty: options.presence_penalty ?? 0,
        frequency_penalty: options.frequency_penalty ?? 0
      };

      // Add optional parameters
      if (options.stop) requestParams.stop = options.stop;
      if (options.response_format) requestParams.response_format = options.response_format;
      if (options.tools) {
        requestParams.tools = options.tools;
        if (options.tool_choice) requestParams.tool_choice = options.tool_choice;
      }

      // Thinking mode parameters
      if (model.includes('thinking')) {
        requestParams.reasoning_effort = options.reasoning_effort || 'medium';
        requestParams.show_thinking = options.show_thinking ?? true;
        this.stats.thinkingRequests++;
      }

      // Track real-time data usage
      if (options.includeRealTimeData ?? this.realTimeDataEnabled) {
        this.stats.realTimeDataRequests++;
      }

      // Create stream
      const stream = await this.client.chat.completions.create(requestParams);

      let fullContent = '';
      let fullThinking = '';
      let functionCall = null;
      let toolCalls = [];
      let finishReason = null;

      // Process stream
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;

        if (!delta) continue;

        // Content delta
        if (delta.content) {
          fullContent += delta.content;

          this.emit('stream:delta', {
            type: 'content',
            content: delta.content,
            fullContent
          });

          if (onChunk) {
            onChunk({
              type: 'content',
              content: delta.content,
              fullContent
            });
          }
        }

        // Thinking delta
        if (delta.thinking) {
          fullThinking += delta.thinking;

          this.emit('stream:delta', {
            type: 'thinking',
            thinking: delta.thinking,
            fullThinking
          });

          if (onChunk) {
            onChunk({
              type: 'thinking',
              thinking: delta.thinking,
              fullThinking
            });
          }
        }

        // Function call delta
        if (delta.function_call) {
          if (!functionCall) {
            functionCall = { name: '', arguments: '' };
          }
          if (delta.function_call.name) {
            functionCall.name += delta.function_call.name;
          }
          if (delta.function_call.arguments) {
            functionCall.arguments += delta.function_call.arguments;
          }
        }

        // Tool calls delta
        if (delta.tool_calls) {
          delta.tool_calls.forEach(toolCall => {
            if (!toolCalls[toolCall.index]) {
              toolCalls[toolCall.index] = {
                id: toolCall.id || '',
                type: toolCall.type || 'function',
                function: { name: '', arguments: '' }
              };
            }

            if (toolCall.function?.name) {
              toolCalls[toolCall.index].function.name += toolCall.function.name;
            }
            if (toolCall.function?.arguments) {
              toolCalls[toolCall.index].function.arguments += toolCall.function.arguments;
            }
          });
        }

        // Finish reason
        if (chunk.choices[0]?.finish_reason) {
          finishReason = chunk.choices[0].finish_reason;
        }
      }

      const endTime = Date.now();
      const latency = endTime - startTime;

      // Count output tokens
      const outputTokens = this.countTokens(fullContent);
      const thinkingTokens = fullThinking ? this.countTokens(fullThinking) : 0;
      const totalTokens = inputTokens + outputTokens + thinkingTokens;

      // Calculate cost
      const cost = this.calculateCost(model, inputTokens, outputTokens, thinkingTokens);

      // Build final message
      const message = { role: 'assistant', content: fullContent };
      if (fullThinking) message.thinking = fullThinking;
      if (functionCall) message.function_call = functionCall;
      if (toolCalls.length > 0) message.tool_calls = toolCalls;

      // Update statistics
      this.updateStats({
        model,
        success: true,
        inputTokens,
        outputTokens,
        thinkingTokens,
        totalTokens,
        cost,
        latency
      });

      this.emit('stream:complete', {
        model,
        inputTokens,
        outputTokens,
        thinkingTokens,
        totalTokens,
        cost,
        latency,
        finishReason
      });

      const result = {
        message,
        finishReason,
        usage: {
          inputTokens,
          outputTokens,
          thinkingTokens,
          totalTokens
        },
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
   * Handle errors
   */
  handleError(error) {
    const errorType = error.type || error.code || 'unknown';

    // Update error statistics
    if (!this.stats.errorsByType[errorType]) {
      this.stats.errorsByType[errorType] = 0;
    }
    this.stats.errorsByType[errorType]++;

    // Create standardized error
    const standardError = {
      provider: 'grok',
      type: errorType,
      message: error.message,
      code: error.code,
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
    const retryableCodes = [
      'rate_limit_exceeded',
      'server_error',
      'timeout',
      'connection_error',
      'service_unavailable'
    ];

    const retryableStatuses = [429, 500, 502, 503, 504];

    return (
      retryableCodes.includes(error.code) ||
      retryableCodes.includes(error.type) ||
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
          cost: 0
        };
      }
      this.stats.requestsByModel[data.model].count++;
      this.stats.requestsByModel[data.model].tokens += data.totalTokens || 0;
      this.stats.requestsByModel[data.model].cost += data.cost || 0;
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
    return {
      ...this.stats,
      successRate: this.stats.totalRequests > 0
        ? (this.stats.successfulRequests / this.stats.totalRequests) * 100
        : 0
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
      realTimeDataRequests: 0,
      thinkingRequests: 0,
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
      const response = await this.client.chat.completions.create({
        model: this.defaultModel,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5
      });

      return {
        status: 'healthy',
        provider: 'grok',
        model: response.model,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        provider: 'grok',
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

module.exports = GrokProvider;
