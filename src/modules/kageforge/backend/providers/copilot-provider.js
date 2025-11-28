/**
 * Copilot 365 Provider - Kage Forge 2025 Edition
 * Supports: Copilot 365 GPT-4, Copilot M365 Hybrid
 * Context: M365 data grounding, 128K tokens
 * Features: M365 integration, Graph API, Code completions, Enterprise data
 *
 * @module Copilot365Provider
 * @version 8.0.0
 */

const { Client } = require('@microsoft/microsoft-graph-client');
const { ClientSecretCredential } = require('@azure/msal-node');
const OpenAI = require('openai').default;
const { EventEmitter } = require('events');

/**
 * Copilot 365 Provider Configuration
 */
const COPILOT_CONFIG = {
  models: {
    'copilot-365-gpt4': {
      name: 'copilot-365-gpt4',
      displayName: 'Copilot 365 GPT-4',
      contextWindow: 128000,
      maxOutputTokens: 16384,
      supportsVision: true,
      supportsFunctions: true,
      supportsStreaming: true,
      supportsM365Grounding: true,
      pricing: {
        inputTokens: 0.00001,    // $10 per million input tokens
        outputTokens: 0.00003,   // $30 per million output tokens
        m365QueryTokens: 0.00002 // $20 per million M365 query tokens
      },
      latency: 'low',
      capabilities: ['chat', 'vision', 'functions', 'm365-grounding', 'code', 'json']
    },
    'copilot-m365-hybrid': {
      name: 'copilot-m365-hybrid',
      displayName: 'Copilot M365 Hybrid',
      contextWindow: 128000,
      maxOutputTokens: 16384,
      supportsVision: true,
      supportsFunctions: true,
      supportsStreaming: true,
      supportsM365Grounding: true,
      supportsSemanticIndex: true,
      pricing: {
        inputTokens: 0.000012,   // $12 per million input tokens
        outputTokens: 0.000036,  // $36 per million output tokens
        m365QueryTokens: 0.000024, // $24 per million M365 query tokens
        semanticIndexTokens: 0.000015 // $15 per million semantic index tokens
      },
      latency: 'medium',
      capabilities: ['chat', 'vision', 'functions', 'm365-grounding', 'semantic-index', 'code', 'json', 'compliance']
    }
  },
  endpoints: {
    azure: 'https://YOUR_RESOURCE.openai.azure.com',
    graph: 'https://graph.microsoft.com/v1.0',
    chat: '/openai/deployments/YOUR_DEPLOYMENT/chat/completions'
  },
  m365Sources: {
    teams: 'Teams messages, chats, channels',
    outlook: 'Emails, calendar events, contacts',
    sharepoint: 'Documents, sites, lists',
    onedrive: 'Files, folders',
    onenote: 'Notes, notebooks',
    planner: 'Tasks, plans',
    todo: 'Tasks, lists'
  },
  retryConfig: {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2
  },
  timeouts: {
    standard: 60000,      // 1 minute
    m365Query: 90000,     // 1.5 minutes for M365 queries
    semanticIndex: 120000 // 2 minutes for semantic index
  },
  complianceConfig: {
    dataResidency: true,
    auditLogging: true,
    dlpEnabled: true,
    sensitivityLabels: true
  }
};

/**
 * Copilot 365 Provider Class
 * Handles interactions with Microsoft Copilot 365 and M365 services
 */
class Copilot365Provider extends EventEmitter {
  constructor(config = {}) {
    super();

    // Azure OpenAI configuration
    this.azureApiKey = config.azureApiKey || process.env.AZURE_OPENAI_API_KEY;
    this.azureEndpoint = config.azureEndpoint || process.env.AZURE_OPENAI_ENDPOINT || COPILOT_CONFIG.endpoints.azure;
    this.azureDeployment = config.azureDeployment || process.env.AZURE_OPENAI_DEPLOYMENT;

    // Microsoft Graph configuration
    this.tenantId = config.tenantId || process.env.MICROSOFT_TENANT_ID;
    this.clientId = config.clientId || process.env.MICROSOFT_CLIENT_ID;
    this.clientSecret = config.clientSecret || process.env.MICROSOFT_CLIENT_SECRET;

    this.defaultModel = config.defaultModel || 'copilot-365-gpt4';
    this.timeout = config.timeout || COPILOT_CONFIG.timeouts.standard;
    this.maxRetries = config.maxRetries || COPILOT_CONFIG.retryConfig.maxRetries;

    // Initialize Azure OpenAI client
    if (this.azureApiKey && this.azureEndpoint) {
      this.azureClient = new OpenAI({
        apiKey: this.azureApiKey,
        baseURL: this.azureEndpoint,
        defaultQuery: { 'api-version': '2024-08-01-preview' },
        timeout: this.timeout,
        maxRetries: this.maxRetries
      });
    }

    // Initialize Microsoft Graph client
    if (this.tenantId && this.clientId && this.clientSecret) {
      const credential = new ClientSecretCredential(
        this.tenantId,
        this.clientId,
        this.clientSecret
      );

      this.graphClient = Client.initWithMiddleware({
        authProvider: {
          getAccessToken: async () => {
            const tokenResponse = await credential.getToken('https://graph.microsoft.com/.default');
            return tokenResponse.token;
          }
        }
      });

      this.m365Enabled = true;
    } else {
      this.m365Enabled = false;
      this.emit('warning', {
        message: 'M365 credentials not provided. M365 grounding features will be disabled.'
      });
    }

    // Statistics tracking
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTokensUsed: 0,
      totalCost: 0,
      averageLatency: 0,
      m365GroundingRequests: 0,
      semanticIndexRequests: 0,
      codeCompletionRequests: 0,
      requestsByModel: {},
      errorsByType: {},
      m365SourcesUsed: {}
    };

    // Request history
    this.requestHistory = [];
    this.maxHistorySize = config.maxHistorySize || 1000;

    // M365 context cache
    this.m365ContextCache = new Map();
    this.cacheEnabled = config.cacheEnabled ?? true;
    this.cacheTTL = config.cacheTTL || 300000; // 5 minutes

    this.emit('initialized', {
      provider: 'copilot-365',
      models: Object.keys(COPILOT_CONFIG.models),
      m365Enabled: this.m365Enabled
    });
  }

  /**
   * Get provider information
   */
  getProviderInfo() {
    return {
      name: 'Microsoft Copilot 365',
      version: '8.0.0',
      models: COPILOT_CONFIG.models,
      capabilities: ['chat', 'vision', 'functions', 'm365-grounding', 'code', 'compliance', 'streaming'],
      status: 'active',
      m365Enabled: this.m365Enabled,
      stats: this.stats
    };
  }

  /**
   * Count tokens (approximation)
   */
  countTokens(text) {
    if (!text) return 0;
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
              tokenCount += 85;
            }
          });
        }
      }

      if (message.tool_calls) {
        message.tool_calls.forEach(tool => {
          tokenCount += this.countTokens(tool.function.name);
          tokenCount += this.countTokens(tool.function.arguments);
        });
      }
    });

    tokenCount += 2;

    return tokenCount;
  }

  /**
   * Calculate cost for a request
   */
  calculateCost(model, usage) {
    const modelConfig = COPILOT_CONFIG.models[model];
    if (!modelConfig) return 0;

    const pricing = modelConfig.pricing;
    let cost = 0;

    cost += (usage.inputTokens || 0) * pricing.inputTokens;
    cost += (usage.outputTokens || 0) * pricing.outputTokens;

    if (usage.m365QueryTokens) {
      cost += usage.m365QueryTokens * pricing.m365QueryTokens;
    }

    if (usage.semanticIndexTokens && pricing.semanticIndexTokens) {
      cost += usage.semanticIndexTokens * pricing.semanticIndexTokens;
    }

    return cost;
  }

  /**
   * Validate model availability
   */
  validateModel(model) {
    if (!COPILOT_CONFIG.models[model]) {
      throw new Error(`Model ${model} is not supported. Available models: ${Object.keys(COPILOT_CONFIG.models).join(', ')}`);
    }
    return true;
  }

  /**
   * Query M365 context from Graph API
   */
  async queryM365Context(query, sources = ['teams', 'outlook', 'sharepoint']) {
    if (!this.m365Enabled) {
      return null;
    }

    const cacheKey = `${query}-${sources.join(',')}`;

    // Check cache
    if (this.cacheEnabled && this.m365ContextCache.has(cacheKey)) {
      const cached = this.m365ContextCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTTL) {
        this.emit('m365:cache-hit', { query, sources });
        return cached.data;
      }
    }

    try {
      const contextData = {
        sources: [],
        timestamp: Date.now()
      };

      // Query Teams if included
      if (sources.includes('teams')) {
        try {
          const teamsMessages = await this.graphClient
            .api('/me/chats')
            .top(10)
            .get();

          contextData.sources.push({
            type: 'teams',
            data: teamsMessages.value
          });

          this.stats.m365SourcesUsed.teams = (this.stats.m365SourcesUsed.teams || 0) + 1;
        } catch (error) {
          this.emit('m365:query-error', { source: 'teams', error: error.message });
        }
      }

      // Query Outlook if included
      if (sources.includes('outlook')) {
        try {
          const emails = await this.graphClient
            .api('/me/messages')
            .top(10)
            .orderby('receivedDateTime DESC')
            .get();

          contextData.sources.push({
            type: 'outlook',
            data: emails.value
          });

          this.stats.m365SourcesUsed.outlook = (this.stats.m365SourcesUsed.outlook || 0) + 1;
        } catch (error) {
          this.emit('m365:query-error', { source: 'outlook', error: error.message });
        }
      }

      // Query SharePoint if included
      if (sources.includes('sharepoint')) {
        try {
          const sites = await this.graphClient
            .api('/sites')
            .search(query)
            .top(10)
            .get();

          contextData.sources.push({
            type: 'sharepoint',
            data: sites.value
          });

          this.stats.m365SourcesUsed.sharepoint = (this.stats.m365SourcesUsed.sharepoint || 0) + 1;
        } catch (error) {
          this.emit('m365:query-error', { source: 'sharepoint', error: error.message });
        }
      }

      // Query OneDrive if included
      if (sources.includes('onedrive')) {
        try {
          const files = await this.graphClient
            .api('/me/drive/root/search(q=\'{query}\')')
            .get();

          contextData.sources.push({
            type: 'onedrive',
            data: files.value
          });

          this.stats.m365SourcesUsed.onedrive = (this.stats.m365SourcesUsed.onedrive || 0) + 1;
        } catch (error) {
          this.emit('m365:query-error', { source: 'onedrive', error: error.message });
        }
      }

      // Cache the result
      if (this.cacheEnabled) {
        this.m365ContextCache.set(cacheKey, {
          data: contextData,
          timestamp: Date.now()
        });
      }

      this.emit('m365:context-retrieved', {
        query,
        sources,
        resultCount: contextData.sources.length
      });

      return contextData;

    } catch (error) {
      this.emit('m365:error', {
        query,
        sources,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Format M365 context for prompt
   */
  formatM365Context(contextData) {
    if (!contextData || !contextData.sources || contextData.sources.length === 0) {
      return '';
    }

    let formatted = '\n\n--- M365 Context ---\n';

    contextData.sources.forEach(source => {
      formatted += `\n[${source.type.toUpperCase()}]\n`;

      if (source.type === 'teams' && Array.isArray(source.data)) {
        source.data.forEach((chat, idx) => {
          formatted += `Chat ${idx + 1}: ${chat.topic || 'Untitled'}\n`;
        });
      } else if (source.type === 'outlook' && Array.isArray(source.data)) {
        source.data.forEach((email, idx) => {
          formatted += `Email ${idx + 1}: ${email.subject} (${email.from?.emailAddress?.name})\n`;
        });
      } else if (source.type === 'sharepoint' && Array.isArray(source.data)) {
        source.data.forEach((site, idx) => {
          formatted += `Site ${idx + 1}: ${site.displayName}\n`;
        });
      } else if (source.type === 'onedrive' && Array.isArray(source.data)) {
        source.data.forEach((file, idx) => {
          formatted += `File ${idx + 1}: ${file.name}\n`;
        });
      }
    });

    formatted += '\n--- End M365 Context ---\n\n';

    return formatted;
  }

  /**
   * Prepare messages with M365 context
   */
  async prepareMessages(messages, options = {}) {
    const prepared = [...messages];

    // Add M365 grounding if enabled
    if (options.m365Grounding && this.m365Enabled) {
      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage && lastUserMessage.role === 'user') {
        const query = typeof lastUserMessage.content === 'string'
          ? lastUserMessage.content
          : lastUserMessage.content[0]?.text || '';

        const contextData = await this.queryM365Context(
          query,
          options.m365Sources || ['teams', 'outlook', 'sharepoint']
        );

        if (contextData) {
          const contextText = this.formatM365Context(contextData);

          // Add context to system message or create new one
          const systemMessage = {
            role: 'system',
            content: `You are Microsoft Copilot with access to the user's M365 data. Use the following context from their Microsoft 365 environment when relevant:${contextText}Provide responses that leverage this context appropriately.`
          };

          prepared.unshift(systemMessage);

          this.stats.m365GroundingRequests++;
        }
      }
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

    if (!this.azureClient) {
      throw new Error('Azure OpenAI client not initialized. Provide Azure credentials.');
    }

    const modelConfig = COPILOT_CONFIG.models[model];

    // Prepare messages with M365 grounding
    const messages = await this.prepareMessages(options.messages, {
      m365Grounding: options.m365Grounding ?? false,
      m365Sources: options.m365Sources
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
        model: this.azureDeployment || model,
        messages,
        temperature: options.temperature ?? 0.7,
        top_p: options.top_p ?? 1.0,
        max_tokens: options.max_tokens || modelConfig.maxOutputTokens,
        stream: false
      };

      // Add optional parameters
      if (options.stop) requestParams.stop = options.stop;
      if (options.response_format) requestParams.response_format = options.response_format;
      if (options.tools) {
        requestParams.tools = options.tools;
        if (options.tool_choice) requestParams.tool_choice = options.tool_choice;
      }

      // Track code completion requests
      if (options.codeCompletion) {
        this.stats.codeCompletionRequests++;
      }

      // Make API request
      const response = await this.azureClient.chat.completions.create(requestParams);

      const endTime = Date.now();
      const latency = endTime - startTime;

      // Extract response data
      const choice = response.choices[0];
      const outputTokens = response.usage?.completion_tokens || 0;
      const totalTokens = response.usage?.total_tokens || (inputTokens + outputTokens);

      // Calculate cost
      const usage = {
        inputTokens,
        outputTokens,
        totalTokens,
        m365QueryTokens: options.m365Grounding ? Math.ceil(inputTokens * 0.1) : 0
      };
      const cost = this.calculateCost(model, usage);

      // Update statistics
      this.updateStats({
        model,
        success: true,
        inputTokens,
        outputTokens,
        totalTokens,
        cost,
        latency
      });

      // Emit completion event
      this.emit('request:complete', {
        model,
        usage,
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
        usage,
        cost,
        latency,
        timestamp: endTime
      };

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

    if (!this.azureClient) {
      throw new Error('Azure OpenAI client not initialized. Provide Azure credentials.');
    }

    const modelConfig = COPILOT_CONFIG.models[model];

    // Prepare messages with M365 grounding
    const messages = await this.prepareMessages(options.messages, {
      m365Grounding: options.m365Grounding ?? false,
      m365Sources: options.m365Sources
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
        model: this.azureDeployment || model,
        messages,
        temperature: options.temperature ?? 0.7,
        top_p: options.top_p ?? 1.0,
        max_tokens: options.max_tokens || modelConfig.maxOutputTokens,
        stream: true
      };

      // Add optional parameters
      if (options.stop) requestParams.stop = options.stop;
      if (options.response_format) requestParams.response_format = options.response_format;
      if (options.tools) {
        requestParams.tools = options.tools;
        if (options.tool_choice) requestParams.tool_choice = options.tool_choice;
      }

      // Create stream
      const stream = await this.azureClient.chat.completions.create(requestParams);

      let fullContent = '';
      let toolCalls = [];
      let finishReason = null;

      // Process stream
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;

        if (!delta) continue;

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

        if (chunk.choices[0]?.finish_reason) {
          finishReason = chunk.choices[0].finish_reason;
        }
      }

      const endTime = Date.now();
      const latency = endTime - startTime;

      // Count output tokens
      const outputTokens = this.countTokens(fullContent);
      const totalTokens = inputTokens + outputTokens;

      // Calculate cost
      const usage = {
        inputTokens,
        outputTokens,
        totalTokens,
        m365QueryTokens: options.m365Grounding ? Math.ceil(inputTokens * 0.1) : 0
      };
      const cost = this.calculateCost(model, usage);

      // Build final message
      const message = { role: 'assistant', content: fullContent };
      if (toolCalls.length > 0) message.tool_calls = toolCalls;

      // Update statistics
      this.updateStats({
        model,
        success: true,
        inputTokens,
        outputTokens,
        totalTokens,
        cost,
        latency
      });

      this.emit('stream:complete', {
        model,
        usage,
        cost,
        latency,
        finishReason
      });

      const result = {
        message,
        finishReason,
        usage,
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

    if (!this.stats.errorsByType[errorType]) {
      this.stats.errorsByType[errorType] = 0;
    }
    this.stats.errorsByType[errorType]++;

    const standardError = {
      provider: 'copilot-365',
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
    const retryableCodes = ['rate_limit_exceeded', 'server_error', 'timeout', 'service_unavailable'];
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

      const totalLatency = this.stats.averageLatency * (this.stats.successfulRequests - 1) + data.latency;
      this.stats.averageLatency = totalLatency / this.stats.successfulRequests;

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
      m365GroundingRequests: 0,
      semanticIndexRequests: 0,
      codeCompletionRequests: 0,
      requestsByModel: {},
      errorsByType: {},
      m365SourcesUsed: {}
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
   * Clear M365 context cache
   */
  clearM365Cache() {
    this.m365ContextCache.clear();
    this.emit('m365:cache-cleared');
  }

  /**
   * Check health
   */
  async checkHealth() {
    const health = {
      azure: 'unknown',
      graph: 'unknown',
      timestamp: Date.now()
    };

    // Check Azure OpenAI
    if (this.azureClient) {
      try {
        await this.azureClient.chat.completions.create({
          model: this.azureDeployment || this.defaultModel,
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 5
        });
        health.azure = 'healthy';
      } catch (error) {
        health.azure = 'unhealthy';
        health.azureError = error.message;
      }
    }

    // Check Microsoft Graph
    if (this.graphClient) {
      try {
        await this.graphClient.api('/me').get();
        health.graph = 'healthy';
      } catch (error) {
        health.graph = 'unhealthy';
        health.graphError = error.message;
      }
    }

    health.status = (health.azure === 'healthy' && health.graph === 'healthy') ? 'healthy' : 'degraded';

    return health;
  }

  /**
   * Cleanup and close connections
   */
  async cleanup() {
    this.clearM365Cache();
    this.removeAllListeners();
    this.emit('cleanup:complete');
  }
}

module.exports = Copilot365Provider;
