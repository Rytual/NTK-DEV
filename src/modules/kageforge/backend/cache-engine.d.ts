/**
 * Type declarations for Cache Engine
 */

import { EventEmitter } from 'events';

export interface CacheConfig {
  maxSize?: number;
  ttl?: number;
  persistPath?: string;
  memory?: { maxSize: number };
  sqlite?: { path: string };
  similarity?: { enabled: boolean; threshold: number };
}

export interface CacheEntry {
  key: string;
  value: any;
  timestamp: number;
  ttl: number;
  hits: number;
}

export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
}

export class CacheEngine extends EventEmitter {
  constructor(config?: CacheConfig);

  get(key: string): any | null;
  set(key: string, value: any, ttl?: number): void;
  has(key: string): boolean;
  delete(key: string): boolean;
  clear(): void;
  getStats(): CacheStats;
  persist(): Promise<void>;
  load(): Promise<void>;
}

export default CacheEngine;
