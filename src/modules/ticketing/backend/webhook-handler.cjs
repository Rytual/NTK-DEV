/**
 * ConnectWise Webhook Handler
 * Express.js webhook receiver with signature verification
 *
 * Features:
 * - Express.js webhook receiver
 * - Signature verification (HMAC-SHA256)
 * - Event types: ticket.created, ticket.updated, ticket.deleted, note.added, timeentry.added
 * - Event parsing and validation
 * - Event routing to handlers
 * - Deduplication
 * - Event logging
 * - Replay protection
 * - Rate limiting
 * - EventEmitter for webhook events
 */

const { EventEmitter } = require('events');
const express = require('express');
const crypto = require('crypto');

/**
 * Webhook Handler Class
 */
class WebhookHandler extends EventEmitter {
  constructor(options = {}) {
    super();

    // Configuration
    this.config = {
      port: options.port || 3000,
      path: options.path || '/webhook/connectwise',
      secret: options.secret || null,
      verifySignature: options.verifySignature !== false,
      enableRateLimit: options.enableRateLimit !== false,
      rateLimit: options.rateLimit || 100, // requests per minute
      replayWindow: options.replayWindow || 300000, // 5 minutes
      logEvents: options.logEvents !== false,
      logPath: options.logPath || './logs/webhooks.log'
    };

    if (this.config.verifySignature && !this.config.secret) {
      throw new Error('Webhook secret is required when signature verification is enabled');
    }

    // Express app
    this.app = null;
    this.server = null;

    // Event handlers
    this.eventHandlers = new Map();

    // Event deduplication cache
    this.eventCache = new Map();

    // Rate limiting
    this.rateLimiter = {
      requests: [],
      maxRequests: this.config.rateLimit,
      windowMs: 60000 // 1 minute
    };

    // Statistics
    this.stats = {
      eventsReceived: 0,
      eventsProcessed: 0,
      eventsFailed: 0,
      signatureVerificationsFailed: 0,
      duplicateEvents: 0,
      rateLimitHits: 0,
      eventsByType: {}
    };

    this._log('Webhook Handler initialized', this.config);
  }

  /**
   * Log debug information
   */
  _log(message, data = null) {
    console.log(`[WebhookHandler] ${message}`, data || '');
    this.emit('log', { message, data, timestamp: Date.now() });
  }

  /**
   * Initialize webhook server
   */
  async initialize() {
    try {
      this._log('Initializing webhook server...');

      // Create Express app
      this.app = express();

      // Parse JSON body
      this.app.use(express.json());

      // Register webhook endpoint
      this.app.post(this.config.path, this._handleWebhook.bind(this));

      // Health check endpoint
      this.app.get('/health', (req, res) => {
        res.json({
          status: 'healthy',
          uptime: process.uptime(),
          stats: this.getStats()
        });
      });

      // Start server
      await new Promise((resolve, reject) => {
        this.server = this.app.listen(this.config.port, (err) => {
          if (err) {
            reject(err);
          } else {
            this._log(`Webhook server listening on port ${this.config.port}`);
            this.emit('initialized', { port: this.config.port });
            resolve();
          }
        });
      });

      return true;
    } catch (error) {
      this._log('Failed to initialize webhook server', error);
      this.emit('initializationError', error);
      throw error;
    }
  }

  /**
   * Handle webhook request
   */
  async _handleWebhook(req, res) {
    const requestId = crypto.randomBytes(16).toString('hex');

    try {
      this._log(`Webhook received: ${requestId}`, {
        method: req.method,
        path: req.path,
        headers: req.headers
      });

      this.stats.eventsReceived++;

      // Rate limiting
      if (this.config.enableRateLimit) {
        const rateLimitCheck = this._checkRateLimit(req);
        if (!rateLimitCheck.allowed) {
          this.stats.rateLimitHits++;
          this._log('Rate limit exceeded', { requestId });

          return res.status(429).json({
            error: 'Rate limit exceeded',
            retryAfter: rateLimitCheck.retryAfter
          });
        }
      }

      // Verify signature
      if (this.config.verifySignature) {
        const signatureValid = this._verifySignature(req);

        if (!signatureValid) {
          this.stats.signatureVerificationsFailed++;
          this._log('Signature verification failed', { requestId });

          return res.status(401).json({
            error: 'Invalid signature'
          });
        }
      }

      // Parse event
      const event = this._parseEvent(req.body);

      if (!event) {
        this._log('Failed to parse event', { requestId, body: req.body });
        return res.status(400).json({
          error: 'Invalid event format'
        });
      }

      // Check for duplicate event
      if (this._isDuplicate(event)) {
        this.stats.duplicateEvents++;
        this._log('Duplicate event detected', { requestId, eventId: event.id });

        // Return success to avoid retries
        return res.status(200).json({
          status: 'duplicate',
          eventId: event.id
        });
      }

      // Add to cache
      this._addToCache(event);

      // Process event
      await this._processEvent(event);

      this.stats.eventsProcessed++;

      // Update event type statistics
      if (!this.stats.eventsByType[event.type]) {
        this.stats.eventsByType[event.type] = 0;
      }
      this.stats.eventsByType[event.type]++;

      this._log('Event processed successfully', { requestId, eventId: event.id, type: event.type });
      this.emit('eventProcessed', { event });

      // Return success response
      res.status(200).json({
        status: 'success',
        eventId: event.id
      });

    } catch (error) {
      this.stats.eventsFailed++;
      this._log('Failed to process webhook', { requestId, error: error.message });
      this.emit('webhookError', { requestId, error });

      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  /**
   * Verify webhook signature (HMAC-SHA256)
   */
  _verifySignature(req) {
    try {
      const signature = req.headers['x-connectwise-signature'];

      if (!signature) {
        this._log('No signature header found');
        return false;
      }

      // Calculate expected signature
      const payload = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', this.config.secret)
        .update(payload)
        .digest('hex');

      // Compare signatures (timing-safe comparison)
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );

    } catch (error) {
      this._log('Signature verification error', error);
      return false;
    }
  }

  /**
   * Check rate limit
   */
  _checkRateLimit(req) {
    const now = Date.now();

    // Remove old requests
    this.rateLimiter.requests = this.rateLimiter.requests.filter(
      timestamp => now - timestamp < this.rateLimiter.windowMs
    );

    // Check if limit exceeded
    if (this.rateLimiter.requests.length >= this.rateLimiter.maxRequests) {
      const oldestRequest = this.rateLimiter.requests[0];
      const retryAfter = Math.ceil((this.rateLimiter.windowMs - (now - oldestRequest)) / 1000);

      return {
        allowed: false,
        retryAfter: retryAfter
      };
    }

    // Add this request
    this.rateLimiter.requests.push(now);

    return {
      allowed: true
    };
  }

  /**
   * Parse webhook event
   */
  _parseEvent(body) {
    try {
      // ConnectWise webhook format
      const event = {
        id: body.ID || body.id || crypto.randomBytes(16).toString('hex'),
        type: body.Type || body.type,
        action: body.Action || body.action,
        entity: body.Entity || body.entity,
        entityId: body.MemberId || body.memberId || body.ID || body.id,
        data: body.Data || body.data || body,
        timestamp: body.Timestamp || body.timestamp || new Date().toISOString()
      };

      // Validate required fields
      if (!event.type) {
        return null;
      }

      return event;
    } catch (error) {
      this._log('Failed to parse event', error);
      return null;
    }
  }

  /**
   * Check if event is duplicate
   */
  _isDuplicate(event) {
    return this.eventCache.has(event.id);
  }

  /**
   * Add event to cache
   */
  _addToCache(event) {
    this.eventCache.set(event.id, {
      timestamp: Date.now(),
      type: event.type
    });

    // Clean old cache entries
    const now = Date.now();
    for (const [id, entry] of this.eventCache.entries()) {
      if (now - entry.timestamp > this.config.replayWindow) {
        this.eventCache.delete(id);
      }
    }
  }

  /**
   * Process webhook event
   */
  async _processEvent(event) {
    try {
      this._log('Processing event', event);

      // Emit generic event
      this.emit('event', event);

      // Emit specific event type
      this.emit(`event:${event.type}`, event);

      // Call registered handlers
      const handlers = this.eventHandlers.get(event.type);
      if (handlers && handlers.length > 0) {
        for (const handler of handlers) {
          try {
            await handler(event);
          } catch (error) {
            this._log(`Handler failed for event ${event.type}`, error);
            this.emit('handlerError', { event, error });
          }
        }
      }

      // Log event if enabled
      if (this.config.logEvents) {
        this._logEventToFile(event);
      }

    } catch (error) {
      this._log('Failed to process event', error);
      throw error;
    }
  }

  /**
   * Log event to file
   */
  _logEventToFile(event) {
    try {
      const fs = require('fs');
      const path = require('path');

      const logDir = path.dirname(this.config.logPath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      const logEntry = JSON.stringify({
        timestamp: new Date().toISOString(),
        event: event
      }) + '\n';

      fs.appendFileSync(this.config.logPath, logEntry);
    } catch (error) {
      this._log('Failed to log event to file', error);
    }
  }

  /**
   * Register event handler
   */
  on(eventType, handler) {
    if (typeof handler !== 'function') {
      throw new Error('Handler must be a function');
    }

    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }

    this.eventHandlers.get(eventType).push(handler);

    this._log(`Handler registered for event type: ${eventType}`);
  }

  /**
   * Unregister event handler
   */
  off(eventType, handler) {
    const handlers = this.eventHandlers.get(eventType);

    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
        this._log(`Handler unregistered for event type: ${eventType}`);
      }
    }
  }

  /**
   * Register ticket created handler
   */
  onTicketCreated(handler) {
    this.on('ticket.created', handler);
  }

  /**
   * Register ticket updated handler
   */
  onTicketUpdated(handler) {
    this.on('ticket.updated', handler);
  }

  /**
   * Register ticket deleted handler
   */
  onTicketDeleted(handler) {
    this.on('ticket.deleted', handler);
  }

  /**
   * Register note added handler
   */
  onNoteAdded(handler) {
    this.on('note.added', handler);
  }

  /**
   * Register time entry added handler
   */
  onTimeEntryAdded(handler) {
    this.on('timeentry.added', handler);
  }

  /**
   * Test webhook with sample event
   */
  async testWebhook(eventType = 'test') {
    try {
      const testEvent = {
        id: crypto.randomBytes(16).toString('hex'),
        type: eventType,
        action: 'test',
        entity: 'test',
        entityId: 0,
        data: {
          message: 'This is a test event'
        },
        timestamp: new Date().toISOString()
      };

      this._log('Testing webhook with sample event', testEvent);

      await this._processEvent(testEvent);

      return {
        success: true,
        event: testEvent
      };
    } catch (error) {
      this._log('Webhook test failed', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate webhook URL
   */
  getWebhookUrl(baseUrl = null) {
    const base = baseUrl || `http://localhost:${this.config.port}`;
    return `${base}${this.config.path}`;
  }

  /**
   * Generate signature for testing
   */
  generateSignature(payload) {
    if (!this.config.secret) {
      throw new Error('Webhook secret not configured');
    }

    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);

    return crypto
      .createHmac('sha256', this.config.secret)
      .update(payloadString)
      .digest('hex');
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      cacheSize: this.eventCache.size,
      handlers: Array.from(this.eventHandlers.entries()).map(([type, handlers]) => ({
        type,
        handlerCount: handlers.length
      })),
      rateLimit: {
        currentRequests: this.rateLimiter.requests.length,
        maxRequests: this.rateLimiter.maxRequests
      }
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      eventsReceived: 0,
      eventsProcessed: 0,
      eventsFailed: 0,
      signatureVerificationsFailed: 0,
      duplicateEvents: 0,
      rateLimitHits: 0,
      eventsByType: {}
    };

    this.emit('statsReset');
  }

  /**
   * Clear event cache
   */
  clearCache() {
    const size = this.eventCache.size;
    this.eventCache.clear();

    this._log(`Cache cleared: ${size} events removed`);
    this.emit('cacheCleared', { eventsRemoved: size });

    return size;
  }

  /**
   * Stop webhook server
   */
  async stop() {
    if (this.server) {
      await new Promise((resolve) => {
        this.server.close(() => {
          this._log('Webhook server stopped');
          this.emit('stopped');
          resolve();
        });
      });
    }
  }
}

module.exports = WebhookHandler;
