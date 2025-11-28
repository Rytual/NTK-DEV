/**
 * Global type definitions for Ninja Toolkit
 */

/// <reference types="node" />
/// <reference types="react" />
/// <reference types="react-dom" />

/**
 * Electron API types exposed to renderer via preload
 */
interface ElectronIpcRenderer {
  invoke: (channel: string, ...args: any[]) => Promise<any>;
  send: (channel: string, ...args: any[]) => void;
  on: (channel: string, callback: (...args: any[]) => void) => () => void;
  once: (channel: string, callback: (...args: any[]) => void) => void;
  removeAllListeners: (channel: string) => void;
}

interface ElectronStore {
  get: (key: string) => Promise<any>;
  set: (key: string, value: any) => Promise<void>;
  delete: (key: string) => Promise<void>;
  clear: () => Promise<void>;
}

interface ElectronAPI {
  ipcRenderer: ElectronIpcRenderer;
  invoke: (channel: string, ...args: any[]) => Promise<any>;
  send: (channel: string, ...args: any[]) => void;
  on: (channel: string, callback: (...args: any[]) => void) => () => void;
  store: ElectronStore;
  platform: string;
  arch: string;
  versions: {
    electron: string;
    node: string;
    chrome: string;
  };
  [key: string]: any;
}

interface Window {
  electron: ElectronAPI;
  electronAPI?: ElectronAPI;
}

/**
 * Environment variables
 */
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    ANTHROPIC_API_KEY?: string;
    PORT?: string;
    ELECTRON_IS_DEV?: string;
  }
}

/**
 * Performance API memory extension
 */
interface Performance {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

/**
 * Module augmentation for Tailwind CSS classes
 */
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

/**
 * Module augmentation for image imports
 */
declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

/**
 * Module augmentation for video imports
 */
declare module '*.mp4' {
  const content: string;
  export default content;
}

declare module '*.webm' {
  const content: string;
  export default content;
}

/**
 * Kage AI types
 */
interface KageQuery {
  query: string;
  context: {
    activeModule: string | null;
    moduleData: any;
    overrides: any;
  };
  sessionId: string;
}

interface KageResponse {
  response: string;
  feudalLabel: string;
  suggestions: string[];
  latency: number;
  metadata: {
    sessionId: string;
    timestamp: string;
    contextUsed: boolean;
  };
}

/**
 * Database types
 */
interface KageConfig {
  sessionId: string;
  config: any;
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

interface KageHistory {
  id: number;
  sessionId: string;
  query: string;
  response: string;
  latency: number;
  feudalLabel: string | null;
  timestamp: string;
}

interface KagePerformance {
  id: number;
  endpoint: string;
  latency: number;
  memoryMb: number | null;
  cpuPercent: number | null;
  timestamp: string;
}
