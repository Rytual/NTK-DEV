/**
 * EventBus - Centralized event system for cross-module communication
 *
 * Enterprise Features:
 * - Module lifecycle events (switch, init, error)
 * - Error aggregation and logging
 * - Health check coordination
 * - Event history for debugging
 *
 * Usage:
 * const { eventBus, ErrorAggregator, HealthMonitor } = require('./eventBus.cjs');
 */

const EventEmitter = require('events');

// ============================================================================
// EVENT BUS - Central communication hub
// ============================================================================

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50); // Support many module listeners
    this.history = [];
    this.maxHistory = 1000;
  }

  /**
   * Emit event with history tracking
   */
  publish(event, data = {}) {
    const entry = {
      event,
      data,
      timestamp: new Date().toISOString()
    };

    // Store in history
    this.history.push(entry);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    // Emit to all listeners
    this.emit(event, data);
    this.emit('*', entry); // Wildcard for global listeners

    return entry;
  }

  /**
   * Subscribe to event
   */
  subscribe(event, handler) {
    this.on(event, handler);
    return () => this.off(event, handler);
  }

  /**
   * Get event history (for debugging)
   */
  getHistory(filter = null, limit = 100) {
    let events = this.history;

    if (filter) {
      events = events.filter(e => e.event.includes(filter));
    }

    return events.slice(-limit);
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.history = [];
  }
}

// Singleton instance
const eventBus = new EventBus();

// ============================================================================
// ERROR AGGREGATOR - Centralized error collection
// ============================================================================

class ErrorAggregator {
  constructor(bus) {
    this.bus = bus;
    this.errors = [];
    this.maxErrors = 500;
    this.errorCounts = {};

    // Subscribe to error events
    this.bus.subscribe('error', (data) => this.handleError(data));
    this.bus.subscribe('module:error', (data) => this.handleError(data));
  }

  /**
   * Log an error
   */
  logError(error) {
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      ...error,
      timestamp: error.timestamp || new Date().toISOString()
    };

    // Store error
    this.errors.push(entry);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Track error counts by type
    const key = `${error.module || 'unknown'}:${error.type || 'unknown'}`;
    this.errorCounts[key] = (this.errorCounts[key] || 0) + 1;

    // Publish to bus
    this.bus.publish('error:logged', entry);

    console.error(`[ErrorAggregator] ${entry.module}: ${entry.message}`);

    return entry;
  }

  /**
   * Handle error event
   */
  handleError(data) {
    this.logError(data);
  }

  /**
   * Get recent errors
   */
  getErrors(filter = {}, limit = 100) {
    let errors = this.errors;

    if (filter.module) {
      errors = errors.filter(e => e.module === filter.module);
    }
    if (filter.type) {
      errors = errors.filter(e => e.type === filter.type);
    }
    if (filter.since) {
      const since = new Date(filter.since).getTime();
      errors = errors.filter(e => new Date(e.timestamp).getTime() >= since);
    }

    return errors.slice(-limit);
  }

  /**
   * Get error statistics
   */
  getStats() {
    const now = Date.now();
    const hour = 60 * 60 * 1000;
    const day = 24 * hour;

    return {
      total: this.errors.length,
      lastHour: this.errors.filter(e => now - new Date(e.timestamp).getTime() < hour).length,
      lastDay: this.errors.filter(e => now - new Date(e.timestamp).getTime() < day).length,
      byModule: this.errorCounts
    };
  }

  /**
   * Clear errors
   */
  clearErrors() {
    this.errors = [];
    this.errorCounts = {};
  }
}

// Singleton instance
const errorAggregator = new ErrorAggregator(eventBus);

// ============================================================================
// HEALTH MONITOR - Module health tracking
// ============================================================================

class HealthMonitor {
  constructor(bus) {
    this.bus = bus;
    this.moduleHealth = {};
    this.checkInterval = null;
    this.healthCheckFns = {};

    // Subscribe to health events
    this.bus.subscribe('module:healthy', (data) => this.setHealth(data.module, 'healthy', data));
    this.bus.subscribe('module:unhealthy', (data) => this.setHealth(data.module, 'unhealthy', data));
    this.bus.subscribe('module:degraded', (data) => this.setHealth(data.module, 'degraded', data));
  }

  /**
   * Register a health check function for a module
   */
  registerCheck(module, checkFn) {
    this.healthCheckFns[module] = checkFn;
    this.moduleHealth[module] = {
      status: 'unknown',
      lastCheck: null,
      lastHealthy: null,
      consecutiveFailures: 0
    };
  }

  /**
   * Set module health status
   */
  setHealth(module, status, data = {}) {
    const prev = this.moduleHealth[module]?.status;

    this.moduleHealth[module] = {
      status,
      lastCheck: new Date().toISOString(),
      lastHealthy: status === 'healthy' ? new Date().toISOString() : this.moduleHealth[module]?.lastHealthy,
      consecutiveFailures: status === 'healthy' ? 0 : (this.moduleHealth[module]?.consecutiveFailures || 0) + 1,
      ...data
    };

    // Publish status change
    if (prev !== status) {
      this.bus.publish('health:changed', {
        module,
        previousStatus: prev,
        currentStatus: status,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Run health checks for all registered modules
   */
  async runChecks() {
    const results = {};

    for (const [module, checkFn] of Object.entries(this.healthCheckFns)) {
      try {
        const result = await checkFn();
        results[module] = result;
        this.setHealth(module, result.healthy ? 'healthy' : 'unhealthy', result);
      } catch (error) {
        results[module] = { healthy: false, error: error.message };
        this.setHealth(module, 'unhealthy', { error: error.message });
      }
    }

    return results;
  }

  /**
   * Start periodic health checks
   */
  startMonitoring(intervalMs = 30000) {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(() => {
      this.runChecks().catch(console.error);
    }, intervalMs);

    // Run initial check
    this.runChecks().catch(console.error);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Get health status for all modules
   */
  getStatus() {
    return {
      modules: this.moduleHealth,
      summary: {
        healthy: Object.values(this.moduleHealth).filter(m => m.status === 'healthy').length,
        unhealthy: Object.values(this.moduleHealth).filter(m => m.status === 'unhealthy').length,
        degraded: Object.values(this.moduleHealth).filter(m => m.status === 'degraded').length,
        unknown: Object.values(this.moduleHealth).filter(m => m.status === 'unknown').length
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check if system is healthy overall
   */
  isSystemHealthy() {
    const unhealthyCount = Object.values(this.moduleHealth)
      .filter(m => m.status === 'unhealthy').length;
    return unhealthyCount === 0;
  }
}

// Singleton instance
const healthMonitor = new HealthMonitor(eventBus);

// ============================================================================
// MODULE LIFECYCLE MANAGER
// ============================================================================

class ModuleLifecycle {
  constructor(bus) {
    this.bus = bus;
    this.activeModule = null;
    this.moduleStates = {};
  }

  /**
   * Register module initialization
   */
  registerModule(module, state = 'initialized') {
    this.moduleStates[module] = {
      state,
      initializedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };

    this.bus.publish('module:registered', { module, state });
  }

  /**
   * Switch active module (for KageChat context)
   */
  switchModule(module, context = {}) {
    const previous = this.activeModule;
    this.activeModule = module;

    if (this.moduleStates[module]) {
      this.moduleStates[module].lastActivity = new Date().toISOString();
    }

    this.bus.publish('module:switched', {
      previous,
      current: module,
      context,
      timestamp: new Date().toISOString()
    });

    return { previous, current: module };
  }

  /**
   * Get active module
   */
  getActiveModule() {
    return this.activeModule;
  }

  /**
   * Get all module states
   */
  getModuleStates() {
    return this.moduleStates;
  }
}

// Singleton instance
const moduleLifecycle = new ModuleLifecycle(eventBus);

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  eventBus,
  errorAggregator,
  healthMonitor,
  moduleLifecycle,
  EventBus,
  ErrorAggregator,
  HealthMonitor,
  ModuleLifecycle
};
