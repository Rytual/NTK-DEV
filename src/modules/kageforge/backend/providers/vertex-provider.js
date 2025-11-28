/**
 * Vertex AI Provider - Kage Forge 2025 Edition
 * Supports: Gemini 3 Pro, Gemini 2.5 Flash
 * Context: 2M tokens (Gemini 3 Pro), 1M tokens (Gemini 2.5 Flash)
 * Features: Multi-modal, Function calling, Grounding, Code execution
 *
 * @module VertexAIProvider
 * @version 8.0.0
 */

const { VertexAI } = require('@google-cloud/vertexai');
const { EventEmitter } = require('events');

/**
 * Vertex AI Provider Configuration
 */
const VERTEX_CONFIG = {
  models: {
    'gemini-3-pro': {
      name: 'gemini-3-pro',
      displayName: 'Gemini 3 Pro',
      contextWindow: 2000000,  // 2M tokens
      maxOutputTokens: 32768,
      supportsVision: true,
      supportsAudio: true,
      supportsVideo: true,
      supportsFunctions: true,
      supportsGrounding: true,
      supportsCodeExecution: true,
      supportsStreaming: true,
      pricing: {
        inputTokens: 0.000002,      // $2 per million input tokens
        outputTokens: 0.00001,      // $10 per million output tokens
        imageTokens: 0.000003,      // $3 per image
        videoTokens: 0.000007,      // $7 per video per second
        audioTokens: 0.000002       // $2 per audio per second
      },
      latency: 'low',
      capabilities: ['chat', 'vision', 'audio', 'video', 'functions', 'grounding', 'code-execution', 'json']
    },
    'gemini-2.5-flash-002': {
      name: 'gemini-2.5-flash-002',
      displayName: 'Gemini 2.5 Flash',
      contextWindow: 1000000,  // 1M tokens
      maxOutputTokens: 8192,
      supportsVision: true,
      supportsAudio: true,
      supportsVideo: true,
      supportsFunctions: true,
      supportsGrounding: true,
      supportsStreaming: true,
      pricing: {
        inputTokens: 0.0000001,     // $0.10 per million input tokens
        outputTokens: 0.0000004,    // $0.40 per million output tokens
        imageTokens: 0.0000001,     // $0.10 per image
        videoTokens: 0.0000003,     // $0.30 per video per second
        audioTokens: 0.0000001      // $0.10 per audio per second
      },
      latency: 'ultra-low',
      capabilities: ['chat', 'vision', 'audio', 'video', 'functions', 'grounding', 'json']
    }
  },
  regions: {
    default: 'us-central1',
    supported: [
      'us-central1',
      'us-east1',
      'us-west1',
      'europe-west1',
      'europe-west4',
      'asia-southeast1',
      'asia-northeast1'
    ]
  },
  safetySettings: {
    HARM_CATEGORY_HATE_SPEECH: 'BLOCK_MEDIUM_AND_ABOVE',
    HARM_CATEGORY_DANGEROUS_CONTENT: 'BLOCK_MEDIUM_AND_ABOVE',
    HARM_CATEGORY_SEXUALLY_EXPLICIT: 'BLOCK_MEDIUM_AND_ABOVE',
    HARM_CATEGORY_HARASSMENT: 'BLOCK_MEDIUM_AND_ABOVE'
  },
  generationConfig: {
    temperature: 1.0,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    stopSequences: []
  },
  retryConfig: {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2
  },
  timeouts: {
    standard: 60000,    // 1 minute
    multimodal: 180000, // 3 minutes for video/audio
    grounding: 120000   // 2 minutes for grounded generation
  }
};

/**
 * Vertex AI Provider Class
 * Handles all interactions with Google's Gemini models via Vertex AI
 */
class VertexAIProvider extends EventEmitter {
  constructor(config = {}) {
    super();

    this.projectId = config.projectId || process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
    this.location = config.location || VERTEX_CONFIG.regions.default;
    this.defaultModel = config.defaultModel || 'gemini-3-pro';
    this.timeout = config.timeout || VERTEX_CONFIG.timeouts.standard;
    this.maxRetries = config.maxRetries || VERTEX_CONFIG.retryConfig.maxRetries;

    if (!this.projectId) {
      throw new Error('Google Cloud project ID is required. Set GOOGLE_CLOUD_PROJECT environment variable.');
    }

    // Initialize Vertex AI client
    this.client = new VertexAI({
      project: this.projectId,
      location: this.location
    });

    // Model instances cache
    this.modelInstances = new Map();

    // Statistics tracking
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTokensUsed: 0,
      totalCost: 0,
      averageLatency: 0,
      multiModalRequests: 0,
      groundedRequests: 0,
      codeExecutionRequests: 0,
      requestsByModel: {},
      errorsByType: {}
    };

    // Request history
    this.requestHistory = [];
    this.maxHistorySize = config.maxHistorySize || 1000;

    // Safety settings
    this.safetySettings = config.safetySettings || VERTEX_CONFIG.safetySettings;

    // Grounding configuration
    this.groundingEnabled = config.groundingEnabled ?? false;

    this.emit('initialized', { provider: 'vertex', models: Object.keys(VERTEX_CONFIG.models) });
  }

  /**
   * Get provider information
   */
  getProviderInfo() {
    return {
      name: 'Vertex AI',
      version: '8.0.0',
      models: VERTEX_CONFIG.models,
      capabilities: ['chat', 'vision', 'audio', 'video', 'functions', 'grounding', 'code-execution', 'streaming'],
      status: 'active',
      projectId: this.projectId,
      location: this.location,
      stats: this.stats
    };
  }

  /**
   * Get or create model instance
   */
  getModelInstance(modelName) {
    if (!this.modelInstances.has(modelName)) {
      const model = this.client.getGenerativeModel({
        model: modelName
      });
      this.modelInstances.set(modelName, model);
    }
    return this.modelInstances.get(modelName);
  }

  /**
   * Count tokens (rough estimate for Gemini)
   */
  countTokens(text) {
    if (!text) return 0;
    // Approximation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Count tokens in messages
   */
  async countMessageTokens(model, contents) {
    try {
      const modelInstance = this.getModelInstance(model);
      const result = await modelInstance.countTokens({ contents });
      return result.totalTokens || 0;
    } catch (error) {
      this.emit('error', { type: 'token-counting', error });
      // Fallback to estimation
      let totalTokens = 0;
      contents.forEach(content => {
        if (content.role) totalTokens += 1;
        if (content.parts) {
          content.parts.forEach(part => {
            if (part.text) {
              totalTokens += this.countTokens(part.text);
            } else if (part.inlineData) {
              totalTokens += 100; // Estimate for images
            }
          });
        }
      });
      return totalTokens;
    }
  }

  /**
   * Calculate cost for a request
   */
  calculateCost(model, usage) {
    const modelConfig = VERTEX_CONFIG.models[model];
    if (!modelConfig) return 0;

    const pricing = modelConfig.pricing;
    let cost = 0;

    // Input tokens
    cost += (usage.inputTokens || 0) * pricing.inputTokens;

    // Output tokens
    cost += (usage.outputTokens || 0) * pricing.outputTokens;

    // Image tokens
    if (usage.imageCount) {
      cost += usage.imageCount * pricing.imageTokens;
    }

    // Video tokens (per second)
    if (usage.videoSeconds) {
      cost += usage.videoSeconds * pricing.videoTokens;
    }

    // Audio tokens (per second)
    if (usage.audioSeconds) {
      cost += usage.audioSeconds * pricing.audioTokens;
    }

    return cost;
  }

  /**
   * Validate model availability
   */
  validateModel(model) {
    if (!VERTEX_CONFIG.models[model]) {
      throw new Error(`Model ${model} is not supported. Available models: ${Object.keys(VERTEX_CONFIG.models).join(', ')}`);
    }
    return true;
  }

  /**
   * Prepare contents for API
   */
  prepareContents(messages) {
    const contents = [];

    messages.forEach(msg => {
      const content = {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: []
      };

      if (msg.content) {
        if (typeof msg.content === 'string') {
          content.parts.push({ text: msg.content });
        } else if (Array.isArray(msg.content)) {
          msg.content.forEach(part => {
            if (part.type === 'text') {
              content.parts.push({ text: part.text });
            } else if (part.type === 'image_url') {
              // Handle image URL
              const imageUrl = part.image_url.url;
              if (imageUrl.startsWith('data:')) {
                // Base64 encoded image
                const matches = imageUrl.match(/^data:(.+);base64,(.+)$/);
                if (matches) {
                  content.parts.push({
                    inlineData: {
                      mimeType: matches[1],
                      data: matches[2]
                    }
                  });
                }
              } else {
                // URL reference
                content.parts.push({
                  fileData: {
                    mimeType: 'image/jpeg',
                    fileUri: imageUrl
                  }
                });
              }
            } else if (part.type === 'video_url') {
              // Handle video URL
              content.parts.push({
                fileData: {
                  mimeType: part.video_url.mime_type || 'video/mp4',
                  fileUri: part.video_url.url
                }
              });
            } else if (part.type === 'audio_url') {
              // Handle audio URL
              content.parts.push({
                fileData: {
                  mimeType: part.audio_url.mime_type || 'audio/mp3',
                  fileUri: part.audio_url.url
                }
              });
            }
          });
        }
      }

      contents.push(content);
    });

    return contents;
  }

  /**
   * Prepare function declarations
   */
  prepareFunctionDeclarations(tools) {
    if (!tools || !Array.isArray(tools)) return undefined;

    return tools.map(tool => {
      if (tool.type === 'function') {
        return {
          name: tool.function.name,
          description: tool.function.description,
          parameters: tool.function.parameters || {
            type: 'object',
            properties: {},
            required: []
          }
        };
      }
      return tool;
    });
  }

  /**
   * Generate content
   */
  async generateContent(options) {
    const startTime = Date.now();
    const model = options.model || this.defaultModel;

    this.validateModel(model);

    const modelConfig = VERTEX_CONFIG.models[model];
    const modelInstance = this.getModelInstance(model);

    // Prepare contents
    const contents = this.prepareContents(options.messages);

    // Estimate input tokens
    const inputTokens = await this.countMessageTokens(model, contents);

    this.emit('request:start', {
      model,
      inputTokens,
      timestamp: startTime
    });

    try {
      // Build generation config
      const generationConfig = {
        temperature: options.temperature ?? VERTEX_CONFIG.generationConfig.temperature,
        topP: options.top_p ?? VERTEX_CONFIG.generationConfig.topP,
        topK: options.top_k ?? VERTEX_CONFIG.generationConfig.topK,
        maxOutputTokens: options.max_tokens || modelConfig.maxOutputTokens,
        stopSequences: options.stop_sequences || []
      };

      // Add response MIME type for JSON
      if (options.response_format?.type === 'json_object') {
        generationConfig.responseMimeType = 'application/json';
      }

      // Build request parameters
      const requestParams = {
        contents,
        generationConfig,
        safetySettings: Object.entries(this.safetySettings).map(([category, threshold]) => ({
          category,
          threshold
        }))
      };

      // Add system instruction
      if (options.system) {
        requestParams.systemInstruction = {
          parts: [{ text: options.system }]
        };
      }

      // Add tools (function declarations)
      if (options.tools) {
        const functionDeclarations = this.prepareFunctionDeclarations(options.tools);
        requestParams.tools = [{
          functionDeclarations
        }];
      }

      // Add grounding
      if (this.groundingEnabled || options.grounding) {
        requestParams.tools = requestParams.tools || [];
        requestParams.tools.push({
          googleSearchRetrieval: {
            dynamicRetrievalConfig: {
              mode: 'MODE_DYNAMIC',
              dynamicThreshold: 0.7
            }
          }
        });
        this.stats.groundedRequests++;
      }

      // Add code execution
      if (options.codeExecution) {
        requestParams.tools = requestParams.tools || [];
        requestParams.tools.push({
          codeExecution: {}
        });
        this.stats.codeExecutionRequests++;
      }

      // Make API request
      const result = await modelInstance.generateContent(requestParams);

      const endTime = Date.now();
      const latency = endTime - startTime;

      // Extract response
      const response = result.response;
      const candidate = response.candidates[0];

      // Count output tokens
      const outputTokens = response.usageMetadata?.candidatesTokenCount ||
                          this.countTokens(candidate.content.parts.map(p => p.text).join(''));

      const totalTokens = (response.usageMetadata?.totalTokenCount || (inputTokens + outputTokens));

      // Check for multi-modal content
      const hasMultiModal = contents.some(c =>
        c.parts.some(p => p.inlineData || p.fileData)
      );
      if (hasMultiModal) {
        this.stats.multiModalRequests++;
      }

      // Calculate cost
      const usage = {
        inputTokens: response.usageMetadata?.promptTokenCount || inputTokens,
        outputTokens,
        totalTokens
      };
      const cost = this.calculateCost(model, usage);

      // Update statistics
      this.updateStats({
        model,
        success: true,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        totalTokens: usage.totalTokens,
        cost,
        latency
      });

      // Emit completion event
      this.emit('request:complete', {
        model,
        usage,
        cost,
        latency,
        finishReason: candidate.finishReason
      });

      // Extract content
      const text = candidate.content.parts
        .filter(p => p.text)
        .map(p => p.text)
        .join('');

      // Extract function calls
      const functionCalls = candidate.content.parts
        .filter(p => p.functionCall)
        .map(p => ({
          name: p.functionCall.name,
          arguments: p.functionCall.args
        }));

      // Build result
      const resultData = {
        model,
        text,
        finishReason: candidate.finishReason,
        safetyRatings: candidate.safetyRatings,
        citationMetadata: candidate.citationMetadata,
        groundingMetadata: candidate.groundingMetadata,
        usage,
        cost,
        latency,
        timestamp: endTime
      };

      if (functionCalls.length > 0) {
        resultData.functionCalls = functionCalls;
      }

      // Add to history
      this.addToHistory(resultData);

      return resultData;

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
   * Generate streaming content
   */
  async generateStreamingContent(options, onChunk) {
    const startTime = Date.now();
    const model = options.model || this.defaultModel;

    this.validateModel(model);

    const modelConfig = VERTEX_CONFIG.models[model];
    const modelInstance = this.getModelInstance(model);

    // Prepare contents
    const contents = this.prepareContents(options.messages);

    // Estimate input tokens
    const inputTokens = await this.countMessageTokens(model, contents);

    this.emit('stream:start', {
      model,
      inputTokens,
      timestamp: startTime
    });

    try {
      // Build generation config
      const generationConfig = {
        temperature: options.temperature ?? VERTEX_CONFIG.generationConfig.temperature,
        topP: options.top_p ?? VERTEX_CONFIG.generationConfig.topP,
        topK: options.top_k ?? VERTEX_CONFIG.generationConfig.topK,
        maxOutputTokens: options.max_tokens || modelConfig.maxOutputTokens
      };

      if (options.response_format?.type === 'json_object') {
        generationConfig.responseMimeType = 'application/json';
      }

      // Build request parameters
      const requestParams = {
        contents,
        generationConfig,
        safetySettings: Object.entries(this.safetySettings).map(([category, threshold]) => ({
          category,
          threshold
        }))
      };

      // Add system instruction
      if (options.system) {
        requestParams.systemInstruction = {
          parts: [{ text: options.system }]
        };
      }

      // Add tools
      if (options.tools) {
        const functionDeclarations = this.prepareFunctionDeclarations(options.tools);
        requestParams.tools = [{
          functionDeclarations
        }];
      }

      // Add grounding
      if (this.groundingEnabled || options.grounding) {
        requestParams.tools = requestParams.tools || [];
        requestParams.tools.push({
          googleSearchRetrieval: {
            dynamicRetrievalConfig: {
              mode: 'MODE_DYNAMIC',
              dynamicThreshold: 0.7
            }
          }
        });
        this.stats.groundedRequests++;
      }

      // Generate streaming content
      const streamingResult = await modelInstance.generateContentStream(requestParams);

      let fullText = '';
      let functionCalls = [];
      let finishReason = null;
      let safetyRatings = null;

      // Process stream
      for await (const chunk of streamingResult.stream) {
        const candidate = chunk.candidates?.[0];
        if (!candidate) continue;

        // Extract text
        const text = candidate.content.parts
          .filter(p => p.text)
          .map(p => p.text)
          .join('');

        if (text) {
          fullText += text;

          this.emit('stream:delta', {
            type: 'text',
            text,
            fullText
          });

          if (onChunk) {
            onChunk({
              type: 'text',
              text,
              fullText
            });
          }
        }

        // Extract function calls
        const chunkFunctionCalls = candidate.content.parts
          .filter(p => p.functionCall)
          .map(p => ({
            name: p.functionCall.name,
            arguments: p.functionCall.args
          }));

        if (chunkFunctionCalls.length > 0) {
          functionCalls.push(...chunkFunctionCalls);
        }

        finishReason = candidate.finishReason;
        safetyRatings = candidate.safetyRatings;
      }

      const endTime = Date.now();
      const latency = endTime - startTime;

      // Get final response
      const response = await streamingResult.response;

      // Count output tokens
      const outputTokens = response.usageMetadata?.candidatesTokenCount ||
                          this.countTokens(fullText);

      const totalTokens = response.usageMetadata?.totalTokenCount || (inputTokens + outputTokens);

      // Calculate cost
      const usage = {
        inputTokens: response.usageMetadata?.promptTokenCount || inputTokens,
        outputTokens,
        totalTokens
      };
      const cost = this.calculateCost(model, usage);

      // Update statistics
      this.updateStats({
        model,
        success: true,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        totalTokens: usage.totalTokens,
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
        model,
        text: fullText,
        finishReason,
        safetyRatings,
        functionCalls: functionCalls.length > 0 ? functionCalls : undefined,
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
    const errorType = error.code || error.type || 'unknown';

    // Update error statistics
    if (!this.stats.errorsByType[errorType]) {
      this.stats.errorsByType[errorType] = 0;
    }
    this.stats.errorsByType[errorType]++;

    // Create standardized error
    const standardError = {
      provider: 'vertex',
      type: errorType,
      message: error.message,
      details: error.details,
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
      'RESOURCE_EXHAUSTED',
      'UNAVAILABLE',
      'DEADLINE_EXCEEDED',
      'INTERNAL',
      'UNKNOWN'
    ];

    return retryableCodes.includes(error.code);
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
      multiModalRequests: 0,
      groundedRequests: 0,
      codeExecutionRequests: 0,
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
      const modelInstance = this.getModelInstance(this.defaultModel);
      const result = await modelInstance.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'ping' }] }]
      });

      return {
        status: 'healthy',
        provider: 'vertex',
        project: this.projectId,
        location: this.location,
        model: this.defaultModel,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        provider: 'vertex',
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Cleanup and close connections
   */
  async cleanup() {
    this.modelInstances.clear();
    this.removeAllListeners();
    this.emit('cleanup:complete');
  }
}

module.exports = VertexAIProvider;
