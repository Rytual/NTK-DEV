/**
 * Type declarations for Hot Module Replacement (HMR)
 * Adds module.hot support for Webpack/Vite HMR
 */

interface HotModule {
  accept(path?: string | string[], callback?: () => void): void;
  dispose(callback: () => void): void;
  invalidate(): void;
  data?: any;
}

declare const module: NodeModule & {
  hot?: HotModule;
};

interface NodeModule {
  hot?: HotModule;
}
