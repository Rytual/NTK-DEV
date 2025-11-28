/**
 * Token Tracker - Kage Forge 2025 Edition
 * Per-provider token counting and cost calculation with 2025 pricing
 * Features: Budget enforcement, Usage analytics, Provider comparison, Billing integration
 *
 * @module TokenTracker
 * @version 8.0.0
 */

const { EventEmitter } = require('events');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

/**
 * Token Tracker Configuration with 2025 Pricing
 */
const TRACKER_CONFIG = {
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
        thinkingTokens: 0.00002,
        cachedInputTokens: 0.000005
      },
      'gpt-4o-2024-11-20': {
        inputTokens: 0.0000025,
        outputTokens: 0.00001,
        cachedInputTokens: 0.00000125
      }
    },
    anthropic: {
      'claude-4.5-sonnet-20250514': {
        inputTokens: 0.000003,
        outputTokens: 0.000015,
        cachedInputTokens: 0.0000003,
        cachedCreationTokens: 0.00000375
      },
      'claude-4.5-opus-20250514': {
        inputTokens: 0.000015,
        outputTokens: 0.000075,
        cachedInputTokens: 0.0000015,
        cachedCreationTokens: 0.00001875
      }
    },
    vertex: {
      'gemini-3-pro': {
        inputTokens: 0.000002,
        outputTokens: 0.00001,
        imageTokens: 0.000003,
        videoTokens: 0.000007,
        audioTokens: 0.000002
      },
      'gemini-2.5-flash-002': {
        inputTokens: 0.0000001,
        outputTokens: 0.0000004,
        imageTokens: 0.0000001,
        videoTokens: 0.0000003,
        audioTokens: 0.0000001
      }
    },
    grok: {
      'grok-4.1-eq': {
        inputTokens: 0.000008,
        outputTokens: 0.000024,
        cachedInputTokens: 0.000004
      },
      'grok-4-thinking': {
        inputTokens: 0.00001,
        outputTokens: 0.00003,
        thinkingTokens: 0.000015,
        cachedInputTokens: 0.000005
      }
    },
    copilot: {
      'copilot-365-gpt4': {
        inputTokens: 0.00001,
        outputTokens: 0.00003,
        m365QueryTokens: 0.00002
      },
      'copilot-m365-hybrid': {
        inputTokens: 0.000012,
        outputTokens: 0.000036,
        m365QueryTokens: 0.000024,
        semanticIndexTokens: 0.000015
      }
    }
  },
  budgets: {
    daily: null,           // No daily limit by default
    monthly: null,         // No monthly limit by default
    perUser: null,         // No per-user limit by default
    alertThreshold: 0.8    // Alert at 80% of budget
  },
  database: {
    path: path.join(process.cwd(), 'token-tracker.db'),
    retentionDays: 90      // Keep 90 days of history
  },
  aggregation: {
    enabled: true,
    intervals: ['hourly', 'daily', 'weekly', 'monthly']
  },
  alerts: {
    enabled: true,
    channels: ['email', 'webhook', 'console']
  }
};

/**
 * Token Tracker Class
 * Tracks token usage and costs across all providers
 */
class TokenTracker extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      ...TRACKER_CONFIG,
      ...config,
      pricing: { ...TRACKER_CONFIG.pricing, ...(config.pricing || {}) },
      budgets: { ...TRACKER_CONFIG.budgets, ...(config.budgets || {}) },
      database: { ...TRACKER_CONFIG.database, ...(config.database || {}) }
    };

    // Initialize database
    this.initializeDatabase();

    // Current period statistics
    this.currentStats = {
      total: {
        tokens: 0,
        cost: 0,
        requests: 0
      },
      byProvider: {},
      byModel: {},
      byUser: {}
    };

    // Budget tracking
    this.budgetStatus = {
      daily: { used: 0, limit: this.config.budgets.daily, exceeded: false },
      monthly: { used: 0, limit: this.config.budgets.monthly, exceeded: false },
      perUser: {}
    };

    // Load current period stats
    this.loadCurrentPeriodStats();

    this.emit('initialized', {
      budgets: this.config.budgets,
      retentionDays: this.config.database.retentionDays
    });
  }

  /**
   * Initialize SQLite database
   */
  initializeDatabase() {
    try {
      // Ensure directory exists
      const dbDir = path.dirname(this.config.database.path);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      this.db = new Database(this.config.database.path);

      // Create tables
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS usage (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp INTEGER NOT NULL,
          provider TEXT NOT NULL,
          model TEXT NOT NULL,
          user_id TEXT,
          input_tokens INTEGER DEFAULT 0,
          output_tokens INTEGER DEFAULT 0,
          thinking_tokens INTEGER DEFAULT 0,
          cached_tokens INTEGER DEFAULT 0,
          total_tokens INTEGER DEFAULT 0,
          cost REAL DEFAULT 0,
          latency INTEGER,
          success BOOLEAN DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS aggregates (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          interval TEXT NOT NULL,
          period TEXT NOT NULL,
          provider TEXT NOT NULL,
          model TEXT,
          total_tokens INTEGER DEFAULT 0,
          total_cost REAL DEFAULT 0,
          total_requests INTEGER DEFAULT 0,
          created_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS budgets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL,
          identifier TEXT,
          limit_amount REAL NOT NULL,
          used_amount REAL DEFAULT 0,
          period_start INTEGER NOT NULL,
          period_end INTEGER NOT NULL,
          exceeded BOOLEAN DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS alerts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp INTEGER NOT NULL,
          type TEXT NOT NULL,
          message TEXT NOT NULL,
          data TEXT,
          acknowledged BOOLEAN DEFAULT 0
        );

        CREATE INDEX IF NOT EXISTS idx_usage_timestamp ON usage(timestamp);
        CREATE INDEX IF NOT EXISTS idx_usage_provider ON usage(provider);
        CREATE INDEX IF NOT EXISTS idx_usage_model ON usage(model);
        CREATE INDEX IF NOT EXISTS idx_usage_user ON usage(user_id);
        CREATE INDEX IF NOT EXISTS idx_aggregates_period ON aggregates(interval, period);
        CREATE INDEX IF NOT EXISTS idx_budgets_type ON budgets(type);
      `);

      // Prepared statements
      this.statements = {
        insertUsage: this.db.prepare(`
          INSERT INTO usage
          (timestamp, provider, model, user_id, input_tokens, output_tokens, thinking_tokens, cached_tokens, total_tokens, cost, latency, success)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `),
        getUsageByPeriod: this.db.prepare(`
          SELECT provider, model, SUM(total_tokens) as tokens, SUM(cost) as cost, COUNT(*) as requests
          FROM usage
          WHERE timestamp >= ? AND timestamp <= ?
          GROUP BY provider, model
        `),
        getUsageByProvider: this.db.prepare(`
          SELECT SUM(total_tokens) as tokens, SUM(cost) as cost, COUNT(*) as requests
          FROM usage
          WHERE provider = ? AND timestamp >= ? AND timestamp <= ?
        `),
        getUsageByUser: this.db.prepare(`
          SELECT user_id, SUM(total_tokens) as tokens, SUM(cost) as cost, COUNT(*) as requests
          FROM usage
          WHERE timestamp >= ? AND timestamp <= ?
          GROUP BY user_id
        `),
        getTotalUsage: this.db.prepare(`
          SELECT SUM(total_tokens) as tokens, SUM(cost) as cost, COUNT(*) as requests
          FROM usage
          WHERE timestamp >= ? AND timestamp <= ?
        `),
        insertAggregate: this.db.prepare(`
          INSERT INTO aggregates
          (interval, period, provider, model, total_tokens, total_cost, total_requests, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `),
        cleanupOldUsage: this.db.prepare(`
          DELETE FROM usage WHERE timestamp < ?
        `)
      };

      this.emit('database:initialized', { path: this.config.database.path });

    } catch (error) {
      this.emit('database:error', { error: error.message });
      throw new Error(`Failed to initialize token tracker database: ${error.message}`);
    }
  }

  /**
   * Load current period statistics
   */
  loadCurrentPeriodStats() {
    const now = Date.now();
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();

    // Load daily stats
    const dailyStats = this.statements.getTotalUsage.get(todayStart, now);
    if (dailyStats) {
      this.budgetStatus.daily.used = dailyStats.cost || 0;
    }

    // Load monthly stats
    const monthlyStats = this.statements.getTotalUsage.get(monthStart, now);
    if (monthlyStats) {
      this.budgetStatus.monthly.used = monthlyStats.cost || 0;
    }

    // Check budget limits
    this.checkBudgetLimits();
  }

  /**
   * Track token usage
   */
  trackUsage(data) {
    const {
      provider,
      model,
      userId = null,
      inputTokens = 0,
      outputTokens = 0,
      thinkingTokens = 0,
      cachedTokens = 0,
      totalTokens = 0,
      cost = 0,
      latency = 0,
      success = true
    } = data;

    const timestamp = Date.now();

    // Insert into database
    try {
      this.statements.insertUsage.run(
        timestamp,
        provider,
        model,
        userId,
        inputTokens,
        outputTokens,
        thinkingTokens,
        cachedTokens,
        totalTokens,
        cost,
        latency,
        success ? 1 : 0
      );
    } catch (error) {
      this.emit('tracking:error', {
        error: error.message,
        data
      });
      return;
    }

    // Update current stats
    this.currentStats.total.tokens += totalTokens;
    this.currentStats.total.cost += cost;
    this.currentStats.total.requests += 1;

    // Update by provider
    if (!this.currentStats.byProvider[provider]) {
      this.currentStats.byProvider[provider] = {
        tokens: 0,
        cost: 0,
        requests: 0
      };
    }
    this.currentStats.byProvider[provider].tokens += totalTokens;
    this.currentStats.byProvider[provider].cost += cost;
    this.currentStats.byProvider[provider].requests += 1;

    // Update by model
    const modelKey = `${provider}:${model}`;
    if (!this.currentStats.byModel[modelKey]) {
      this.currentStats.byModel[modelKey] = {
        tokens: 0,
        cost: 0,
        requests: 0
      };
    }
    this.currentStats.byModel[modelKey].tokens += totalTokens;
    this.currentStats.byModel[modelKey].cost += cost;
    this.currentStats.byModel[modelKey].requests += 1;

    // Update by user
    if (userId) {
      if (!this.currentStats.byUser[userId]) {
        this.currentStats.byUser[userId] = {
          tokens: 0,
          cost: 0,
          requests: 0
        };
      }
      this.currentStats.byUser[userId].tokens += totalTokens;
      this.currentStats.byUser[userId].cost += cost;
      this.currentStats.byUser[userId].requests += 1;
    }

    // Update budget tracking
    this.budgetStatus.daily.used += cost;
    this.budgetStatus.monthly.used += cost;

    if (userId) {
      if (!this.budgetStatus.perUser[userId]) {
        this.budgetStatus.perUser[userId] = {
          used: 0,
          limit: this.config.budgets.perUser,
          exceeded: false
        };
      }
      this.budgetStatus.perUser[userId].used += cost;
    }

    // Check budget limits
    this.checkBudgetLimits();

    this.emit('usage:tracked', {
      provider,
      model,
      tokens: totalTokens,
      cost
    });
  }

  /**
   * Calculate cost for usage
   */
  calculateCost(provider, model, usage) {
    const pricing = this.config.pricing[provider]?.[model];
    if (!pricing) {
      this.emit('pricing:not-found', { provider, model });
      return 0;
    }

    let cost = 0;

    // Input tokens
    if (usage.inputTokens) {
      if (usage.cachedTokens && pricing.cachedInputTokens) {
        const cachedCost = usage.cachedTokens * pricing.cachedInputTokens;
        const regularCost = (usage.inputTokens - usage.cachedTokens) * pricing.inputTokens;
        cost += cachedCost + regularCost;
      } else {
        cost += usage.inputTokens * pricing.inputTokens;
      }
    }

    // Output tokens
    if (usage.outputTokens) {
      cost += usage.outputTokens * pricing.outputTokens;
    }

    // Thinking tokens
    if (usage.thinkingTokens && pricing.thinkingTokens) {
      cost += usage.thinkingTokens * pricing.thinkingTokens;
    }

    // Cache creation tokens
    if (usage.cacheCreationTokens && pricing.cachedCreationTokens) {
      cost += usage.cacheCreationTokens * pricing.cachedCreationTokens;
    }

    // Multi-modal tokens
    if (usage.imageCount && pricing.imageTokens) {
      cost += usage.imageCount * pricing.imageTokens;
    }
    if (usage.videoSeconds && pricing.videoTokens) {
      cost += usage.videoSeconds * pricing.videoTokens;
    }
    if (usage.audioSeconds && pricing.audioTokens) {
      cost += usage.audioSeconds * pricing.audioTokens;
    }

    // M365 query tokens
    if (usage.m365QueryTokens && pricing.m365QueryTokens) {
      cost += usage.m365QueryTokens * pricing.m365QueryTokens;
    }

    return cost;
  }

  /**
   * Check budget limits and send alerts
   */
  checkBudgetLimits() {
    const alerts = [];

    // Check daily budget
    if (this.config.budgets.daily) {
      const dailyPercent = this.budgetStatus.daily.used / this.config.budgets.daily;

      if (dailyPercent >= 1.0 && !this.budgetStatus.daily.exceeded) {
        this.budgetStatus.daily.exceeded = true;
        alerts.push({
          type: 'budget_exceeded',
          period: 'daily',
          used: this.budgetStatus.daily.used,
          limit: this.config.budgets.daily
        });
      } else if (dailyPercent >= this.config.budgets.alertThreshold && !this.budgetStatus.daily.alerted) {
        this.budgetStatus.daily.alerted = true;
        alerts.push({
          type: 'budget_warning',
          period: 'daily',
          used: this.budgetStatus.daily.used,
          limit: this.config.budgets.daily,
          percent: dailyPercent * 100
        });
      }
    }

    // Check monthly budget
    if (this.config.budgets.monthly) {
      const monthlyPercent = this.budgetStatus.monthly.used / this.config.budgets.monthly;

      if (monthlyPercent >= 1.0 && !this.budgetStatus.monthly.exceeded) {
        this.budgetStatus.monthly.exceeded = true;
        alerts.push({
          type: 'budget_exceeded',
          period: 'monthly',
          used: this.budgetStatus.monthly.used,
          limit: this.config.budgets.monthly
        });
      } else if (monthlyPercent >= this.config.budgets.alertThreshold && !this.budgetStatus.monthly.alerted) {
        this.budgetStatus.monthly.alerted = true;
        alerts.push({
          type: 'budget_warning',
          period: 'monthly',
          used: this.budgetStatus.monthly.used,
          limit: this.config.budgets.monthly,
          percent: monthlyPercent * 100
        });
      }
    }

    // Check per-user budgets
    if (this.config.budgets.perUser) {
      Object.entries(this.budgetStatus.perUser).forEach(([userId, status]) => {
        const userPercent = status.used / this.config.budgets.perUser;

        if (userPercent >= 1.0 && !status.exceeded) {
          status.exceeded = true;
          alerts.push({
            type: 'user_budget_exceeded',
            userId,
            used: status.used,
            limit: this.config.budgets.perUser
          });
        } else if (userPercent >= this.config.budgets.alertThreshold && !status.alerted) {
          status.alerted = true;
          alerts.push({
            type: 'user_budget_warning',
            userId,
            used: status.used,
            limit: this.config.budgets.perUser,
            percent: userPercent * 100
          });
        }
      });
    }

    // Send alerts
    alerts.forEach(alert => {
      this.sendAlert(alert);
    });
  }

  /**
   * Send alert
   */
  sendAlert(alert) {
    // Store alert in database
    try {
      this.db.prepare(`
        INSERT INTO alerts (timestamp, type, message, data)
        VALUES (?, ?, ?, ?)
      `).run(
        Date.now(),
        alert.type,
        JSON.stringify(alert),
        JSON.stringify(alert)
      );
    } catch (error) {
      this.emit('alert:storage-error', { error: error.message });
    }

    // Emit alert event
    this.emit('alert', alert);

    // Console alert
    if (this.config.alerts.channels.includes('console')) {
      console.warn(`[Token Tracker Alert] ${alert.type}:`, alert);
    }
  }

  /**
   * Get usage statistics for a period
   */
  getUsageStats(startTime, endTime = Date.now()) {
    try {
      const total = this.statements.getTotalUsage.get(startTime, endTime);
      const byProviderModel = this.statements.getUsageByPeriod.all(startTime, endTime);
      const byUser = this.statements.getUsageByUser.all(startTime, endTime);

      return {
        total: {
          tokens: total.tokens || 0,
          cost: total.cost || 0,
          requests: total.requests || 0
        },
        byProvider: this.groupByProvider(byProviderModel),
        byModel: this.groupByModel(byProviderModel),
        byUser: this.formatUserStats(byUser),
        period: {
          start: startTime,
          end: endTime
        }
      };
    } catch (error) {
      this.emit('stats:error', { error: error.message });
      return null;
    }
  }

  /**
   * Group usage by provider
   */
  groupByProvider(data) {
    const grouped = {};

    data.forEach(row => {
      if (!grouped[row.provider]) {
        grouped[row.provider] = {
          tokens: 0,
          cost: 0,
          requests: 0
        };
      }
      grouped[row.provider].tokens += row.tokens;
      grouped[row.provider].cost += row.cost;
      grouped[row.provider].requests += row.requests;
    });

    return grouped;
  }

  /**
   * Group usage by model
   */
  groupByModel(data) {
    const grouped = {};

    data.forEach(row => {
      const key = `${row.provider}:${row.model}`;
      grouped[key] = {
        tokens: row.tokens,
        cost: row.cost,
        requests: row.requests
      };
    });

    return grouped;
  }

  /**
   * Format user statistics
   */
  formatUserStats(data) {
    const formatted = {};

    data.forEach(row => {
      if (row.user_id) {
        formatted[row.user_id] = {
          tokens: row.tokens,
          cost: row.cost,
          requests: row.requests
        };
      }
    });

    return formatted;
  }

  /**
   * Get provider comparison
   */
  getProviderComparison(startTime, endTime = Date.now()) {
    const stats = this.getUsageStats(startTime, endTime);
    if (!stats) return null;

    const providers = Object.entries(stats.byProvider).map(([name, data]) => ({
      name,
      tokens: data.tokens,
      cost: data.cost,
      requests: data.requests,
      averageCostPerRequest: data.requests > 0 ? data.cost / data.requests : 0,
      averageTokensPerRequest: data.requests > 0 ? data.tokens / data.requests : 0
    }));

    // Sort by cost
    providers.sort((a, b) => b.cost - a.cost);

    return {
      providers,
      totalCost: stats.total.cost,
      totalTokens: stats.total.tokens,
      totalRequests: stats.total.requests
    };
  }

  /**
   * Get budget status
   */
  getBudgetStatus() {
    return {
      daily: {
        used: this.budgetStatus.daily.used,
        limit: this.config.budgets.daily,
        remaining: this.config.budgets.daily ? this.config.budgets.daily - this.budgetStatus.daily.used : null,
        percent: this.config.budgets.daily ? (this.budgetStatus.daily.used / this.config.budgets.daily) * 100 : 0,
        exceeded: this.budgetStatus.daily.exceeded
      },
      monthly: {
        used: this.budgetStatus.monthly.used,
        limit: this.config.budgets.monthly,
        remaining: this.config.budgets.monthly ? this.config.budgets.monthly - this.budgetStatus.monthly.used : null,
        percent: this.config.budgets.monthly ? (this.budgetStatus.monthly.used / this.config.budgets.monthly) * 100 : 0,
        exceeded: this.budgetStatus.monthly.exceeded
      },
      perUser: Object.entries(this.budgetStatus.perUser).reduce((acc, [userId, status]) => {
        acc[userId] = {
          used: status.used,
          limit: status.limit,
          remaining: status.limit ? status.limit - status.used : null,
          percent: status.limit ? (status.used / status.limit) * 100 : 0,
          exceeded: status.exceeded
        };
        return acc;
      }, {})
    };
  }

  /**
   * Reset daily budget tracking
   */
  resetDailyBudget() {
    this.budgetStatus.daily.used = 0;
    this.budgetStatus.daily.exceeded = false;
    this.budgetStatus.daily.alerted = false;
    this.emit('budget:daily-reset');
  }

  /**
   * Reset monthly budget tracking
   */
  resetMonthlyBudget() {
    this.budgetStatus.monthly.used = 0;
    this.budgetStatus.monthly.exceeded = false;
    this.budgetStatus.monthly.alerted = false;
    this.emit('budget:monthly-reset');
  }

  /**
   * Cleanup old usage data
   */
  cleanupOldData() {
    const cutoffTime = Date.now() - (this.config.database.retentionDays * 24 * 60 * 60 * 1000);

    try {
      const result = this.statements.cleanupOldUsage.run(cutoffTime);

      this.emit('cleanup:complete', {
        deletedRows: result.changes
      });

      return result.changes;

    } catch (error) {
      this.emit('cleanup:error', { error: error.message });
      return 0;
    }
  }

  /**
   * Get current statistics
   */
  getCurrentStats() {
    return {
      ...this.currentStats,
      budget: this.getBudgetStatus()
    };
  }

  /**
   * Export usage data
   */
  exportUsageData(startTime, endTime = Date.now(), format = 'json') {
    const stats = this.getUsageStats(startTime, endTime);

    if (format === 'json') {
      return JSON.stringify(stats, null, 2);
    } else if (format === 'csv') {
      // CSV export implementation
      const rows = this.db.prepare(`
        SELECT * FROM usage WHERE timestamp >= ? AND timestamp <= ?
      `).all(startTime, endTime);

      const headers = Object.keys(rows[0] || {}).join(',');
      const csvRows = rows.map(row => Object.values(row).join(','));

      return [headers, ...csvRows].join('\n');
    }

    return null;
  }

  /**
   * Cleanup and close connections
   */
  async cleanup() {
    // Cleanup old data
    this.cleanupOldData();

    // Close database
    if (this.db) {
      this.db.close();
    }

    this.removeAllListeners();
    this.emit('cleanup:complete');
  }
}

module.exports = TokenTracker;
