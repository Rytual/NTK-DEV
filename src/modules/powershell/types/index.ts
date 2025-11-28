/**
 * PowerShell Terminal Type Definitions
 */

export interface PowerShellSession {
  id: string;
  pid: number;
  cwd: string;
  uptime: number;
  commandCount: number;
  powershellVersion?: string;
}

export interface PowerShellSessionOptions {
  cols?: number;
  rows?: number;
  cwd?: string;
  env?: Record<string, string>;
  executionPolicy?: 'Restricted' | 'AllSigned' | 'RemoteSigned' | 'Unrestricted' | 'Bypass';
}

export interface CommandResult {
  output: string;
  executionTime: number;
  commandNumber: number;
}

export interface PowerShellMetrics {
  commandsExecuted: number;
  totalExecutionTime: number;
  averageExecutionTime: number;
  activeSessions: number;
}

export interface TerminalTheme {
  background: string;
  foreground: string;
  cursor: string;
  cursorAccent: string;
  selection: string;
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  brightBlack: string;
  brightRed: string;
  brightGreen: string;
  brightYellow: string;
  brightBlue: string;
  brightMagenta: string;
  brightCyan: string;
  brightWhite: string;
}

export interface TerminalConfig {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  cursorBlink: boolean;
  cursorStyle: 'block' | 'underline' | 'bar';
  scrollback: number;
  tabStopWidth: number;
  theme: TerminalTheme;
}
