import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// PERFORMANCE UTILITIES
// ============================================================================

/**
 * Measure execution time of an async function
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Perf] ${name}: ${duration.toFixed(2)}ms`);
  }

  return { result, duration };
}

/**
 * Measure execution time of a sync function
 */
export function measureSync<T>(
  name: string,
  fn: () => T
): { result: T; duration: number } {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Perf] ${name}: ${duration.toFixed(2)}ms`);
  }

  return { result, duration };
}

/**
 * Request idle callback with fallback for older browsers
 */
export function requestIdleCallback(
  callback: IdleRequestCallback,
  options?: IdleRequestOptions
): number {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    return (window as typeof globalThis & { requestIdleCallback: typeof globalThis.requestIdleCallback }).requestIdleCallback(callback, options);
  }
  // Fallback for browsers without requestIdleCallback
  return setTimeout(() => {
    callback({
      didTimeout: false,
      timeRemaining: () => 50,
    });
  }, 1) as unknown as number;
}

/**
 * Cancel idle callback
 */
export function cancelIdleCallback(handle: number): void {
  if (typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
    (window as typeof globalThis & { cancelIdleCallback: typeof globalThis.cancelIdleCallback }).cancelIdleCallback(handle);
  } else {
    clearTimeout(handle);
  }
}

/**
 * Prefetch a module during idle time
 */
export function prefetchModule(importFn: () => Promise<unknown>): void {
  requestIdleCallback(() => {
    importFn().catch(() => {
      // Silently ignore prefetch failures
    });
  }, { timeout: 2000 });
}

/**
 * Create a memoized function with LRU cache
 */
export function memoize<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult,
  options: { maxSize?: number; keyFn?: (...args: TArgs) => string } = {}
): (...args: TArgs) => TResult {
  const { maxSize = 100, keyFn = (...args) => JSON.stringify(args) } = options;
  const cache = new Map<string, { value: TResult; timestamp: number }>();

  return (...args: TArgs): TResult => {
    const key = keyFn(...args);

    if (cache.has(key)) {
      const entry = cache.get(key)!;
      // Move to end (most recently used)
      cache.delete(key);
      cache.set(key, entry);
      return entry.value;
    }

    const result = fn(...args);
    cache.set(key, { value: result, timestamp: Date.now() });

    // Evict oldest entries if over max size
    if (cache.size > maxSize) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey) cache.delete(oldestKey);
    }

    return result;
  };
}

/**
 * Performance metrics collector for development
 */
export class PerformanceMetrics {
  private static instance: PerformanceMetrics;
  private metrics: Map<string, number[]> = new Map();
  private enabled: boolean;

  private constructor() {
    this.enabled = process.env.NODE_ENV === 'development';
  }

  static getInstance(): PerformanceMetrics {
    if (!PerformanceMetrics.instance) {
      PerformanceMetrics.instance = new PerformanceMetrics();
    }
    return PerformanceMetrics.instance;
  }

  record(name: string, value: number): void {
    if (!this.enabled) return;

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    const values = this.metrics.get(name)!;
    values.push(value);

    // Keep last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }

  getStats(name: string): { avg: number; min: number; max: number; count: number } | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return null;

    const sum = values.reduce((a, b) => a + b, 0);
    return {
      avg: sum / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    };
  }

  getAllStats(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {};
    for (const name of this.metrics.keys()) {
      const stats = this.getStats(name);
      if (stats) result[name] = stats;
    }
    return result;
  }

  clear(): void {
    this.metrics.clear();
  }

  log(): void {
    if (!this.enabled) return;
    console.table(this.getAllStats());
  }
}
