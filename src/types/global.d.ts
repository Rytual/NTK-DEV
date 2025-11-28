/**
 * Global type definitions for Ninja Toolkit v11
 *
 * This file defines the canonical IPC interface used by all renderer components.
 */

/// <reference types="node" />
/// <reference types="react" />
/// <reference types="react-dom" />

// ============================================================================
// ELECTRON API TYPES
// ============================================================================

/**
 * Canonical Electron API interface exposed via preload
 * Access via: window.electronAPI
 */
interface ElectronAPI {
  /**
   * Invoke a channel and wait for response
   * @param channel - IPC channel name (e.g., 'media:getRandomImage')
   * @param args - Arguments to pass to the handler
   * @returns Promise resolving to the handler's return value
   */
  invoke: (channel: string, ...args: any[]) => Promise<any>;

  /**
   * Send a message to main process (fire and forget)
   * @param channel - IPC channel name
   * @param args - Arguments to pass
   */
  send: (channel: string, ...args: any[]) => void;

  /**
   * Subscribe to events from main process
   * @param channel - IPC channel name
   * @param callback - Handler function
   * @returns Unsubscribe function
   */
  on: (channel: string, callback: (...args: any[]) => void) => () => void;

  /**
   * Subscribe to a single event
   * @param channel - IPC channel name
   * @param callback - Handler function (called once)
   */
  once: (channel: string, callback: (...args: any[]) => void) => void;

  /**
   * Remove all listeners for a channel
   * @param channel - IPC channel name
   */
  removeAllListeners: (channel: string) => void;

  /** Current platform (darwin, win32, linux) */
  platform: NodeJS.Platform;

  /** CPU architecture */
  arch: string;

  /** Electron version information */
  versions: {
    electron: string;
    node: string;
    chrome: string;
  };
}

/**
 * Legacy Electron API interface (deprecated)
 * @deprecated Use window.electronAPI instead
 */
interface LegacyElectronAPI {
  ipcRenderer: {
    invoke: (channel: string, ...args: any[]) => Promise<any>;
    send: (channel: string, ...args: any[]) => void;
    on: (channel: string, callback: (...args: any[]) => void) => () => void;
    once: (channel: string, callback: (...args: any[]) => void) => void;
    removeAllListeners: (channel: string) => void;
  };
  platform: string;
  arch: string;
  versions: {
    electron: string;
    node: string;
    chrome: string;
  };
}

/**
 * Window interface augmentation
 */
declare global {
  interface Window {
    /** Canonical Electron API - USE THIS */
    electronAPI: ElectronAPI;

    /** @deprecated Legacy API - use electronAPI instead */
    electron: LegacyElectronAPI;
  }
}

// ============================================================================
// IPC CHANNEL TYPES
// ============================================================================

/**
 * Module status returned by system:getModuleStates
 */
interface ModuleStatus {
  loaded: boolean;
  error?: string;
}

/**
 * Version info returned by system:getVersion
 */
interface VersionInfo {
  version: string;
  electron: string;
  node: string;
  chrome: string;
}

/**
 * Platform info returned by system:getPlatform
 */
interface PlatformInfo {
  platform: NodeJS.Platform;
  arch: string;
  cwd: string;
}

/**
 * Kage AI query parameters
 */
interface KageQuery {
  query: string;
  context: KageContext;
  sessionId: string;
}

/**
 * Kage context information
 */
interface KageContext {
  activeModule: string | null;
  moduleData: any;
  overrides: any;
}

/**
 * Kage AI response
 */
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
 * Capture session options for NinjaShark
 */
interface CaptureOptions {
  sessionId?: string;
  interface: string;
  filter?: string;
}

/**
 * Capture result from NinjaShark
 */
interface CaptureResult {
  success: boolean;
  session?: any;
  error?: string;
}

/**
 * Network packet data
 */
interface Packet {
  id: string;
  timestamp: number;
  srcIp: string;
  dstIp: string;
  protocol: string;
  length: number;
  data: any;
}

/**
 * PowerShell execution result
 */
interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
}

/**
 * Remote connection configuration
 */
interface ConnectionConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  type: 'ssh' | 'telnet' | 'serial';
}

/**
 * Security scan result
 */
interface ScanResult {
  success: boolean;
  vulnerabilities?: Vulnerability[];
  error?: string;
}

/**
 * Vulnerability information
 */
interface Vulnerability {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  solution?: string;
  cve?: string;
}

/**
 * Risk score result
 */
interface RiskScore {
  score: number;
  factors: RiskFactor[];
}

/**
 * Risk factor detail
 */
interface RiskFactor {
  name: string;
  weight: number;
  impact: 'positive' | 'negative';
}

/**
 * Ticket data for creation
 */
interface TicketData {
  summary: string;
  company: string;
  contact?: string;
  board?: string;
  priority?: number;
  status?: string;
  notes?: string;
}

/**
 * Academy question
 */
interface AcademyQuestion {
  id: string;
  examCode: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  domain?: string;
  difficulty?: string;
}

/**
 * Academy progress info
 */
interface AcademyProgress {
  progress: number;
  total: number;
  exams?: Record<string, ExamProgress>;
}

/**
 * Exam-specific progress
 */
interface ExamProgress {
  attempted: number;
  correct: number;
  percentage: number;
}

// ============================================================================
// ENVIRONMENT VARIABLES
// ============================================================================

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    ANTHROPIC_API_KEY?: string;
    OPENAI_API_KEY?: string;
    AZURE_CLIENT_ID?: string;
    AZURE_TENANT_ID?: string;
    AZURE_CLIENT_SECRET?: string;
    CONNECTWISE_API_URL?: string;
    CONNECTWISE_COMPANY_ID?: string;
    CONNECTWISE_PUBLIC_KEY?: string;
    CONNECTWISE_PRIVATE_KEY?: string;
    PORT?: string;
    ELECTRON_IS_DEV?: string;
    VITE_DEV_SERVER_URL?: string;
  }
}

// ============================================================================
// PERFORMANCE API EXTENSION
// ============================================================================

interface Performance {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

// ============================================================================
// MODULE AUGMENTATIONS
// ============================================================================

declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

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

declare module '*.mp4' {
  const content: string;
  export default content;
}

declare module '*.webm' {
  const content: string;
  export default content;
}

// ============================================================================
// DATABASE TYPES (for reference)
// ============================================================================

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

export {};
