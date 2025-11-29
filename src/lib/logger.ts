/**
 * Ninja Toolkit v11 - Debug Logger and Session Manager
 *
 * Provides comprehensive logging for debugging and session tracking.
 * Logs are stored in userData directory for persistence across sessions.
 */

import { app } from 'electron';
import path from 'path';
import fs from 'fs';

// Log levels
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL'
}

// Log entry structure
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  data?: any;
  stack?: string;
}

// Session info structure
export interface SessionInfo {
  sessionId: string;
  startTime: string;
  endTime?: string;
  appVersion: string;
  electronVersion: string;
  nodeVersion: string;
  platform: string;
  arch: string;
  moduleStates: Record<string, { loaded: boolean; error?: string }>;
  errors: LogEntry[];
  events: string[];
}

class Logger {
  private logDir: string;
  private currentLogFile: string;
  private sessionFile: string;
  private session: SessionInfo;
  private logBuffer: LogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private maxLogSize = 10 * 1024 * 1024; // 10MB
  private maxLogFiles = 5;

  constructor() {
    // Initialize paths - in development use project root, in production use userData
    const baseDir = app?.isPackaged
      ? app.getPath('userData')
      : process.cwd();

    this.logDir = path.join(baseDir, 'logs');
    this.ensureLogDir();

    // Create log file with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.currentLogFile = path.join(this.logDir, `ninja-toolkit-${timestamp}.log`);
    this.sessionFile = path.join(this.logDir, 'session.json');

    // Initialize session
    this.session = {
      sessionId: `session-${Date.now()}`,
      startTime: new Date().toISOString(),
      appVersion: '11.0.0',
      electronVersion: process.versions.electron || 'unknown',
      nodeVersion: process.versions.node || 'unknown',
      platform: process.platform,
      arch: process.arch,
      moduleStates: {},
      errors: [],
      events: []
    };

    // Start flush interval
    this.flushInterval = setInterval(() => this.flush(), 5000);

    // Rotate old logs
    this.rotateLogs();

    this.info('Logger', 'Ninja Toolkit Logger initialized', {
      logFile: this.currentLogFile,
      sessionId: this.session.sessionId
    });
  }

  private ensureLogDir(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private rotateLogs(): void {
    try {
      const files = fs.readdirSync(this.logDir)
        .filter(f => f.endsWith('.log'))
        .map(f => ({
          name: f,
          path: path.join(this.logDir, f),
          mtime: fs.statSync(path.join(this.logDir, f)).mtime
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      // Keep only maxLogFiles
      if (files.length > this.maxLogFiles) {
        files.slice(this.maxLogFiles).forEach(f => {
          try {
            fs.unlinkSync(f.path);
          } catch (e) {
            // Ignore deletion errors
          }
        });
      }
    } catch (error) {
      // Ignore rotation errors
    }
  }

  private formatEntry(entry: LogEntry): string {
    const parts = [
      `[${entry.timestamp}]`,
      `[${entry.level.padEnd(5)}]`,
      `[${entry.module}]`,
      entry.message
    ];

    if (entry.data) {
      parts.push(JSON.stringify(entry.data));
    }

    if (entry.stack) {
      parts.push(`\n${entry.stack}`);
    }

    return parts.join(' ');
  }

  private log(level: LogLevel, module: string, message: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      data
    };

    // Add stack trace for errors
    if (level === LogLevel.ERROR || level === LogLevel.FATAL) {
      const err = new Error();
      entry.stack = err.stack?.split('\n').slice(3).join('\n');
      this.session.errors.push(entry);
    }

    // Add to buffer
    this.logBuffer.push(entry);

    // Also log to console in development
    const formatted = this.formatEntry(entry);
    switch (level) {
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      default:
        console.log(formatted);
    }

    // Immediate flush for errors
    if (level === LogLevel.ERROR || level === LogLevel.FATAL) {
      this.flush();
    }
  }

  public flush(): void {
    if (this.logBuffer.length === 0) return;

    try {
      const lines = this.logBuffer.map(e => this.formatEntry(e)).join('\n') + '\n';
      fs.appendFileSync(this.currentLogFile, lines);

      // Check file size and rotate if needed
      const stats = fs.statSync(this.currentLogFile);
      if (stats.size > this.maxLogSize) {
        this.currentLogFile = path.join(
          this.logDir,
          `ninja-toolkit-${new Date().toISOString().replace(/[:.]/g, '-')}.log`
        );
        this.rotateLogs();
      }

      this.logBuffer = [];
    } catch (error) {
      console.error('Failed to flush logs:', error);
    }
  }

  public debug(module: string, message: string, data?: any): void {
    this.log(LogLevel.DEBUG, module, message, data);
  }

  public info(module: string, message: string, data?: any): void {
    this.log(LogLevel.INFO, module, message, data);
  }

  public warn(module: string, message: string, data?: any): void {
    this.log(LogLevel.WARN, module, message, data);
  }

  public error(module: string, message: string, data?: any): void {
    this.log(LogLevel.ERROR, module, message, data);
  }

  public fatal(module: string, message: string, data?: any): void {
    this.log(LogLevel.FATAL, module, message, data);
  }

  public event(eventName: string): void {
    const entry = `${new Date().toISOString()} - ${eventName}`;
    this.session.events.push(entry);
    this.debug('Event', eventName);
  }

  public updateModuleStates(states: Record<string, { loaded: boolean; error?: string }>): void {
    this.session.moduleStates = states;
    this.saveSession();
  }

  public saveSession(): void {
    try {
      this.session.endTime = new Date().toISOString();
      fs.writeFileSync(this.sessionFile, JSON.stringify(this.session, null, 2));
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  public getSession(): SessionInfo {
    return { ...this.session };
  }

  public getRecentLogs(count: number = 100): LogEntry[] {
    try {
      const content = fs.readFileSync(this.currentLogFile, 'utf-8');
      const lines = content.trim().split('\n').slice(-count);
      // Parse back to entries (simplified)
      return lines.map(line => ({
        timestamp: line.match(/\[(.*?)\]/)?.[1] || '',
        level: (line.match(/\[(\w+)\s*\]/g)?.[1]?.replace(/[\[\]]/g, '').trim() || 'INFO') as LogLevel,
        module: line.match(/\[(\w+)\]/g)?.[2]?.replace(/[\[\]]/g, '') || 'Unknown',
        message: line.split(']').slice(3).join(']').trim()
      }));
    } catch (error) {
      return [];
    }
  }

  public getLogPath(): string {
    return this.currentLogFile;
  }

  public getLogDir(): string {
    return this.logDir;
  }

  public cleanup(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flush();
    this.saveSession();
    this.info('Logger', 'Logger cleanup complete');
    this.flush();
  }
}

// Singleton instance
let loggerInstance: Logger | null = null;

export function getLogger(): Logger {
  if (!loggerInstance) {
    loggerInstance = new Logger();
  }
  return loggerInstance;
}

export function initLogger(): Logger {
  return getLogger();
}

export default Logger;
