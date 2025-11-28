/**
 * Cache Engine - Kage Forge 2025 Edition
 * Multi-layer caching: LRU memory, SQLite persistent, Redis support
 * Features: Semantic similarity, TTL management, Analytics, Cache warming
 *
 * @module CacheEngine
 * @version 8.0.0
 */

const { EventEmitter } = require('events');
const { LRUCache } = require('lru-cache');
const Database = require('better-sqlite3');
const Redis = require('ioredis');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

/**
 * Cache Engine Configuration
 */
const CACHE_CONFIG = {
  memory: {
    maxSize: 500,          // Max items in memory cache
    maxAge: 3600000,       // 1 hour TTL
    updateAgeOnGet: true,
    updateAgeOnHas: false
  },
  sqlite: {
    path: path.join(process.cwd(), 'cache.db'),
    maxSize: 10000,        // Max items in SQLite
    maxAge: 86400000       // 24 hours TTL
  },
  redis: {
    host: 'localhost',
    port: 6379,
    maxAge: 604800000,     // 7 days TTL
    keyPrefix: 'kage:cache:'
  },
  similarity: {
    threshold: 0.85,       // Minimum similarity for cache hit
    algorithm: 'cosine',   // cosine, jaccard, levenshtein
    enabled: true
  },
  analytics: {
    enabled: true,
    trackPatterns: true,
    windowSize: 1000       // Track last N requests
  },
  warmup: {
    enabled: false,
    queries: []            // Queries to warm up on start
  }
};

/**
 * Cache Engine Class
 * Provides multi-layer caching with semantic similarity matching
 */
class CacheEngine extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      ...CACHE_CONFIG,
      ...config,
      memory: { ...CACHE_CONFIG.memory, ...config.memory },
      sqlite: { ...CACHE_CONFIG.sqlite, ...config.sqlite },
      redis: { ...CACHE_CONFIG.redis, ...config.redis }
    };

    // Initialize memory cache (LRU)
    this.memoryCache = new LRUCache({
      max: this.config.memory.maxSize,
      ttl: this.config.memory.maxAge,
      updateAgeOnGet: this.config.memory.updateAgeOnGet,
      updateAgeOnHas: this.config.memory.updateAgeOnHas
    });

    // Initialize SQLite cache
    this.initializeSQLite();

    // Initialize Redis cache (optional)
    if (config.redis?.enabled) {
      this.initializeRedis();
    }

    // Statistics
    this.stats = {
      totalRequests: 0,
      memoryHits: 0,
      memoryMisses: 0,
      sqliteHits: 0,
      sqliteMisses: 0,
      redisHits: 0,
      redisMisses: 0,
      semanticHits: 0,
      writes: 0,
      evictions: 0,
      hitRate: 0,
      averageLatency: 0,
      byProvider: {}
    };

    // Analytics
    if (this.config.analytics.enabled) {
      this.analytics = {
        recentRequests: [],
        patterns: new Map(),
        popularKeys: new Map()
      };
    }

    // Cache warming
    if (this.config.warmup.enabled && this.config.warmup.queries.length > 0) {
      this.warmCache();
    }

    this.emit('initialized', { layers: this.getActiveLayers() });
  }

  /**
   * Initialize SQLite cache
   */
  initializeSQLite() {
    try {
      // Ensure directory exists
      const dbDir = path.dirname(this.config.sqlite.path);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      this.sqliteDb = new Database(this.config.sqlite.path);

      // Create cache table
      this.sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS cache (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          provider TEXT,
          model TEXT,
          normalized_prompt TEXT,
          embedding TEXT,
          tokens INTEGER,
          cost REAL,
          created_at INTEGER,
          expires_at INTEGER,
          access_count INTEGER DEFAULT 0,
          last_accessed INTEGER
        );

        CREATE INDEX IF NOT EXISTS idx_expires_at ON cache(expires_at);
        CREATE INDEX IF NOT EXISTS idx_provider ON cache(provider);
        CREATE INDEX IF NOT EXISTS idx_normalized_prompt ON cache(normalized_prompt);
        CREATE INDEX IF NOT EXISTS idx_access_count ON cache(access_count DESC);
      `);

      // Prepared statements
      this.sqliteStatements = {
        get: this.sqliteDb.prepare('SELECT * FROM cache WHERE key = ? AND expires_at > ?'),
        set: this.sqliteDb.prepare(`
          INSERT OR REPLACE INTO cache
          (key, value, provider, model, normalized_prompt, embedding, tokens, cost, created_at, expires_at, access_count, last_accessed)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT access_count FROM cache WHERE key = ?), 0), ?)
        `),
        updateAccess: this.sqliteDb.prepare('UPDATE cache SET access_count = access_count + 1, last_accessed = ? WHERE key = ?'),
        delete: this.sqliteDb.prepare('DELETE FROM cache WHERE key = ?'),
        cleanup: this.sqliteDb.prepare('DELETE FROM cache WHERE expires_at <= ?'),
        getByPrompt: this.sqliteDb.prepare('SELECT * FROM cache WHERE normalized_prompt = ? AND provider = ? AND expires_at > ? LIMIT 1'),
        getStats: this.sqliteDb.prepare('SELECT COUNT(*) as count, SUM(tokens) as tokens, SUM(cost) as cost FROM cache WHERE expires_at > ?'),
        getByProvider: this.sqliteDb.prepare('SELECT COUNT(*) as count FROM cache WHERE provider = ? AND expires_at > ?')
      };

      this.emit('sqlite:initialized', { path: this.config.sqlite.path });

    } catch (error) {
      this.emit('sqlite:error', { error: error.message });
      throw new Error(`Failed to initialize SQLite cache: ${error.message}`);
    }
  }

  /**
   * Initialize Redis cache
   */
  initializeRedis() {
    try {
      this.redisClient = new Redis({
        host: this.config.redis.host,
        port: this.config.redis.port,
        keyPrefix: this.config.redis.keyPrefix,
        retryStrategy: (times) => {
          if (times > 3) {
            this.emit('redis:connection-failed');
            return null;
          }
          return Math.min(times * 100, 2000);
        }
      });

      this.redisClient.on('connect', () => {
        this.emit('redis:connected');
      });

      this.redisClient.on('error', (error) => {
        this.emit('redis:error', { error: error.message });
      });

    } catch (error) {
      this.emit('redis:init-failed', { error: error.message });
    }
  }

  /**
   * Generate cache key
   */
  generateKey(prompt, provider, model, options = {}) {
    const data = {
      prompt: this.normalizePrompt(prompt),
      provider,
      model,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 2048
    };

    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');

    return `${provider}:${model}:${hash}`;
  }

  /**
   * Normalize prompt for caching
   */
  normalizePrompt(prompt) {
    if (typeof prompt === 'string') {
      // Remove extra whitespace, normalize line endings
      return prompt
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/\r\n/g, '\n')
        .toLowerCase();
    } else if (Array.isArray(prompt)) {
      // Handle message arrays
      return JSON.stringify(prompt.map(msg => ({
        role: msg.role,
        content: typeof msg.content === 'string'
          ? this.normalizePrompt(msg.content)
          : msg.content
      })));
    }
    return JSON.stringify(prompt);
  }

  /**
   * Calculate similarity between prompts
   */
  calculateSimilarity(prompt1, prompt2) {
    const normalized1 = this.normalizePrompt(prompt1);
    const normalized2 = this.normalizePrompt(prompt2);

    if (normalized1 === normalized2) {
      return 1.0;
    }

    switch (this.config.similarity.algorithm) {
      case 'cosine':
        return this.cosineSimilarity(normalized1, normalized2);
      case 'jaccard':
        return this.jaccardSimilarity(normalized1, normalized2);
      case 'levenshtein':
        return this.levenshteinSimilarity(normalized1, normalized2);
      default:
        return this.cosineSimilarity(normalized1, normalized2);
    }
  }

  /**
   * Cosine similarity
   */
  cosineSimilarity(str1, str2) {
    const words1 = str1.split(/\s+/);
    const words2 = str2.split(/\s+/);

    const wordSet = new Set([...words1, ...words2]);
    const vec1 = Array.from(wordSet).map(word => words1.filter(w => w === word).length);
    const vec2 = Array.from(wordSet).map(word => words2.filter(w => w === word).length);

    const dotProduct = vec1.reduce((sum, val, idx) => sum + val * vec2[idx], 0);
    const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));

    return magnitude1 && magnitude2 ? dotProduct / (magnitude1 * magnitude2) : 0;
  }

  /**
   * Jaccard similarity
   */
  jaccardSimilarity(str1, str2) {
    const set1 = new Set(str1.split(/\s+/));
    const set2 = new Set(str2.split(/\s+/));

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Levenshtein similarity
   */
  levenshteinSimilarity(str1, str2) {
    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    return maxLength > 0 ? 1 - (distance / maxLength) : 1;
  }

  /**
   * Levenshtein distance
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Get from cache (multi-layer)
   */
  async get(prompt, provider, model, options = {}) {
    const startTime = Date.now();
    this.stats.totalRequests++;

    const key = this.generateKey(prompt, provider, model, options);
    const normalizedPrompt = this.normalizePrompt(prompt);

    // Layer 1: Memory cache
    if (this.memoryCache.has(key)) {
      const value = this.memoryCache.get(key);
      this.stats.memoryHits++;
      this.updateStats('hit', Date.now() - startTime);
      this.trackAnalytics(key, normalizedPrompt, 'memory');

      this.emit('cache:hit', {
        layer: 'memory',
        key,
        latency: Date.now() - startTime
      });

      return value;
    }

    this.stats.memoryMisses++;

    // Layer 2: SQLite cache
    try {
      const now = Date.now();
      const row = this.sqliteStatements.get.get(key, now);

      if (row) {
        const value = JSON.parse(row.value);

        // Promote to memory cache
        this.memoryCache.set(key, value);

        // Update access count
        this.sqliteStatements.updateAccess.run(now, key);

        this.stats.sqliteHits++;
        this.updateStats('hit', Date.now() - startTime);
        this.trackAnalytics(key, normalizedPrompt, 'sqlite');

        this.emit('cache:hit', {
          layer: 'sqlite',
          key,
          latency: Date.now() - startTime
        });

        return value;
      }

      this.stats.sqliteMisses++;

    } catch (error) {
      this.emit('cache:error', {
        layer: 'sqlite',
        operation: 'get',
        error: error.message
      });
    }

    // Layer 3: Redis cache (if enabled)
    if (this.redisClient) {
      try {
        const redisValue = await this.redisClient.get(key);

        if (redisValue) {
          const value = JSON.parse(redisValue);

          // Promote to memory and SQLite
          this.memoryCache.set(key, value);
          this.setSQLite(key, value, provider, model, normalizedPrompt);

          this.stats.redisHits++;
          this.updateStats('hit', Date.now() - startTime);
          this.trackAnalytics(key, normalizedPrompt, 'redis');

          this.emit('cache:hit', {
            layer: 'redis',
            key,
            latency: Date.now() - startTime
          });

          return value;
        }

        this.stats.redisMisses++;

      } catch (error) {
        this.emit('cache:error', {
          layer: 'redis',
          operation: 'get',
          error: error.message
        });
      }
    }

    // Semantic similarity search (if enabled)
    if (this.config.similarity.enabled) {
      const similarEntry = await this.findSimilar(normalizedPrompt, provider, model);

      if (similarEntry) {
        this.stats.semanticHits++;
        this.updateStats('hit', Date.now() - startTime);

        this.emit('cache:semantic-hit', {
          key,
          similarity: similarEntry.similarity,
          latency: Date.now() - startTime
        });

        return similarEntry.value;
      }
    }

    // Cache miss
    this.updateStats('miss', Date.now() - startTime);

    this.emit('cache:miss', {
      key,
      latency: Date.now() - startTime
    });

    return null;
  }

  /**
   * Set in cache (multi-layer)
   */
  async set(prompt, provider, model, value, options = {}) {
    const key = this.generateKey(prompt, provider, model, options);
    const normalizedPrompt = this.normalizePrompt(prompt);

    this.stats.writes++;

    // Layer 1: Memory cache
    this.memoryCache.set(key, value);

    // Layer 2: SQLite cache
    this.setSQLite(key, value, provider, model, normalizedPrompt);

    // Layer 3: Redis cache (if enabled)
    if (this.redisClient) {
      try {
        await this.redisClient.setex(
          key,
          Math.floor(this.config.redis.maxAge / 1000),
          JSON.stringify(value)
        );
      } catch (error) {
        this.emit('cache:error', {
          layer: 'redis',
          operation: 'set',
          error: error.message
        });
      }
    }

    this.emit('cache:set', { key, layers: this.getActiveLayers() });
  }

  /**
   * Set in SQLite cache
   */
  setSQLite(key, value, provider, model, normalizedPrompt) {
    try {
      const now = Date.now();
      const expiresAt = now + this.config.sqlite.maxAge;

      this.sqliteStatements.set.run(
        key,
        JSON.stringify(value),
        provider,
        model,
        normalizedPrompt,
        null, // embedding placeholder
        value.usage?.totalTokens || 0,
        value.cost || 0,
        now,
        expiresAt,
        key,
        now
      );

    } catch (error) {
      this.emit('cache:error', {
        layer: 'sqlite',
        operation: 'set',
        error: error.message
      });
    }
  }

  /**
   * Find similar cached entry
   */
  async findSimilar(normalizedPrompt, provider, model) {
    try {
      const now = Date.now();
      const rows = this.sqliteDb
        .prepare('SELECT * FROM cache WHERE provider = ? AND expires_at > ? LIMIT 100')
        .all(provider, now);

      let bestMatch = null;
      let bestSimilarity = 0;

      for (const row of rows) {
        const similarity = this.calculateSimilarity(normalizedPrompt, row.normalized_prompt);

        if (similarity >= this.config.similarity.threshold && similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestMatch = {
            value: JSON.parse(row.value),
            similarity
          };
        }
      }

      return bestMatch;

    } catch (error) {
      this.emit('cache:error', {
        operation: 'findSimilar',
        error: error.message
      });
      return null;
    }
  }

  /**
   * Delete from cache
   */
  async delete(key) {
    this.memoryCache.delete(key);

    try {
      this.sqliteStatements.delete.run(key);
    } catch (error) {
      this.emit('cache:error', {
        layer: 'sqlite',
        operation: 'delete',
        error: error.message
      });
    }

    if (this.redisClient) {
      try {
        await this.redisClient.del(key);
      } catch (error) {
        this.emit('cache:error', {
          layer: 'redis',
          operation: 'delete',
          error: error.message
        });
      }
    }

    this.emit('cache:deleted', { key });
  }

  /**
   * Clear all caches
   */
  async clear() {
    this.memoryCache.clear();

    try {
      this.sqliteDb.prepare('DELETE FROM cache').run();
    } catch (error) {
      this.emit('cache:error', {
        layer: 'sqlite',
        operation: 'clear',
        error: error.message
      });
    }

    if (this.redisClient) {
      try {
        await this.redisClient.flushdb();
      } catch (error) {
        this.emit('cache:error', {
          layer: 'redis',
          operation: 'clear',
          error: error.message
        });
      }
    }

    this.emit('cache:cleared');
  }

  /**
   * Cleanup expired entries
   */
  cleanupExpired() {
    const now = Date.now();

    try {
      const result = this.sqliteStatements.cleanup.run(now);
      this.stats.evictions += result.changes;

      this.emit('cache:cleanup', {
        evicted: result.changes
      });

    } catch (error) {
      this.emit('cache:error', {
        operation: 'cleanup',
        error: error.message
      });
    }
  }

  /**
   * Warm cache with predefined queries
   */
  async warmCache() {
    this.emit('cache:warming-start', {
      queries: this.config.warmup.queries.length
    });

    for (const query of this.config.warmup.queries) {
      // Implementation would call the actual provider
      // This is a placeholder for the warming logic
      this.emit('cache:warming-query', { query });
    }

    this.emit('cache:warming-complete');
  }

  /**
   * Update statistics
   */
  updateStats(type, latency) {
    const totalHits = this.stats.memoryHits + this.stats.sqliteHits + this.stats.redisHits + this.stats.semanticHits;
    const totalMisses = this.stats.memoryMisses + this.stats.sqliteMisses + this.stats.redisMisses;

    this.stats.hitRate = this.stats.totalRequests > 0
      ? (totalHits / this.stats.totalRequests) * 100
      : 0;

    // Update average latency
    const totalLatency = this.stats.averageLatency * (this.stats.totalRequests - 1) + latency;
    this.stats.averageLatency = totalLatency / this.stats.totalRequests;
  }

  /**
   * Track analytics
   */
  trackAnalytics(key, prompt, layer) {
    if (!this.config.analytics.enabled) return;

    // Recent requests
    this.analytics.recentRequests.push({
      key,
      prompt: prompt.substring(0, 100), // Store first 100 chars
      layer,
      timestamp: Date.now()
    });

    // Maintain window size
    if (this.analytics.recentRequests.length > this.config.analytics.windowSize) {
      this.analytics.recentRequests.shift();
    }

    // Popular keys
    const count = this.analytics.popularKeys.get(key) || 0;
    this.analytics.popularKeys.set(key, count + 1);

    // Track patterns
    if (this.config.analytics.trackPatterns) {
      const words = prompt.split(/\s+/).slice(0, 5).join(' ');
      const patternCount = this.analytics.patterns.get(words) || 0;
      this.analytics.patterns.set(words, patternCount + 1);
    }
  }

  /**
   * Get active cache layers
   */
  getActiveLayers() {
    const layers = ['memory', 'sqlite'];
    if (this.redisClient) layers.push('redis');
    return layers;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const sqliteStats = this.sqliteStatements.getStats.get(Date.now());

    return {
      ...this.stats,
      layers: this.getActiveLayers(),
      memory: {
        size: this.memoryCache.size,
        maxSize: this.config.memory.maxSize
      },
      sqlite: {
        entries: sqliteStats.count,
        tokens: sqliteStats.tokens,
        cost: sqliteStats.cost
      },
      analytics: this.config.analytics.enabled ? {
        recentRequestsCount: this.analytics.recentRequests.length,
        popularKeysCount: this.analytics.popularKeys.size,
        patternsCount: this.analytics.patterns.size
      } : null
    };
  }

  /**
   * Get analytics data
   */
  getAnalytics() {
    if (!this.config.analytics.enabled) {
      return null;
    }

    return {
      recentRequests: this.analytics.recentRequests.slice(-100),
      topKeys: Array.from(this.analytics.popularKeys.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20),
      topPatterns: Array.from(this.analytics.patterns.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
    };
  }

  /**
   * Cleanup and close connections
   */
  async cleanup() {
    // Cleanup expired entries
    this.cleanupExpired();

    // Close SQLite
    if (this.sqliteDb) {
      this.sqliteDb.close();
    }

    // Close Redis
    if (this.redisClient) {
      await this.redisClient.quit();
    }

    this.removeAllListeners();
    this.emit('cleanup:complete');
  }
}

module.exports = CacheEngine;
