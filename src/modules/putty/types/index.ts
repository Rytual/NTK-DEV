/**
 * Remote Access Module Type Definitions
 * SSH, Telnet, Serial, RDP, SFTP connectivity types
 */

// ============================================================================
// Session Types
// ============================================================================

export type SessionType = 'ssh' | 'telnet' | 'serial' | 'rdp';

export interface BaseSession {
  id: string;
  type: SessionType;
  startTime: number;
  commandCount: number;
  uptime: number;
}

export interface SSHSession extends BaseSession {
  type: 'ssh';
  host: string;
  port: number;
  username: string;
  authMethod: 'password' | 'publickey' | 'agent';
  sftpEnabled: boolean;
}

export interface TelnetSession extends BaseSession {
  type: 'telnet';
  host: string;
  port: number;
}

export interface SerialSession extends BaseSession {
  type: 'serial';
  path: string;
  baudRate: number;
  dataBits: 5 | 6 | 7 | 8;
  stopBits: 1 | 1.5 | 2;
  parity: 'none' | 'even' | 'odd' | 'mark' | 'space';
}

export interface RDPSession extends BaseSession {
  type: 'rdp';
  host: string;
  port: number;
  username: string;
  domain?: string;
}

export type Session = SSHSession | TelnetSession | SerialSession | RDPSession;

// ============================================================================
// Connection Options
// ============================================================================

export interface SSHConnectionOptions {
  host: string;
  port?: number;
  username: string;
  password?: string;
  privateKey?: string;
  passphrase?: string;
  keepaliveInterval?: number;
  readyTimeout?: number;
  agent?: string;
}

export interface TelnetConnectionOptions {
  host: string;
  port?: number;
  timeout?: number;
  negotiationMandatory?: boolean;
}

export interface SerialConnectionOptions {
  path: string;
  baudRate?: number;
  dataBits?: 5 | 6 | 7 | 8;
  stopBits?: 1 | 1.5 | 2;
  parity?: 'none' | 'even' | 'odd' | 'mark' | 'space';
  rtscts?: boolean;
  xon?: boolean;
  xoff?: boolean;
  xany?: boolean;
  autoOpen?: boolean;
}

export interface RDPConnectionOptions {
  host: string;
  port?: number;
  username: string;
  password?: string;
  domain?: string;
  width?: number;
  height?: number;
  colorDepth?: 8 | 15 | 16 | 24 | 32;
}

// ============================================================================
// Command Execution
// ============================================================================

export interface CommandOptions {
  timeout?: number;
  waitForPrompt?: boolean;
}

export interface CommandResult {
  output: string;
  executionTime: number;
  commandNumber: number;
}

// ============================================================================
// Macros
// ============================================================================

export interface Macro {
  name: string;
  commands: string[];
  delay?: number;
  description?: string;
  created: number;
}

export interface MacroExecution {
  macro: string;
  results: Array<{
    command: string;
    result: CommandResult;
  }>;
}

export interface MacroVariables {
  [key: string]: string;
}

// ============================================================================
// SFTP
// ============================================================================

export interface SFTPSession {
  sessionId: string;
  upload: (local: string, remote: string) => Promise<SFTPTransferResult>;
  download: (remote: string, local: string) => Promise<SFTPTransferResult>;
  readdir: (path: string) => Promise<SFTPFileInfo[]>;
}

export interface SFTPTransferResult {
  localPath?: string;
  remotePath?: string;
}

export interface SFTPFileInfo {
  filename: string;
  longname: string;
  attrs: {
    mode: number;
    uid: number;
    gid: number;
    size: number;
    atime: number;
    mtime: number;
  };
}

// ============================================================================
// Connection Profiles
// ============================================================================

export interface ConnectionProfile {
  name: string;
  type: SessionType;
  host?: string;
  port?: number;
  username?: string;
  authMethod?: 'password' | 'publickey' | 'agent';
  privateKeyPath?: string;
  created: number;
  lastUsed?: number;
}

// ============================================================================
// Serial Port
// ============================================================================

export interface SerialPortInfo {
  path: string;
  manufacturer: string;
  serialNumber: string;
  pnpId: string;
  vendorId: string;
  productId: string;
}

// ============================================================================
// Session Recording
// ============================================================================

export interface SessionRecording {
  sessionId: string;
  type: SessionType;
  host?: string;
  port?: number;
  startTime: number;
  endTime: number;
  commandCount: number;
  events: RecordingEvent[];
}

export interface RecordingEvent {
  timestamp: number;
  type: 'input' | 'output' | 'rx' | 'tx';
  data: string;
}

// ============================================================================
// Metrics
// ============================================================================

export interface RemoteAccessMetrics {
  sessionsCreated: number;
  commandsExecuted: number;
  totalExecutionTime: number;
  averageExecutionTime: number;
  bytesTransferred: number;
  activeSessions: number;
}

export interface SerialMetrics {
  sessionsCreated: number;
  bytesTransmitted: number;
  bytesReceived: number;
  activeSessions: number;
}

// ============================================================================
// Terminal Theme
// ============================================================================

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

// ============================================================================
// Events
// ============================================================================

export interface SessionEvent {
  sessionId: string;
  type: 'connect' | 'disconnect' | 'data' | 'error';
  timestamp: number;
  data?: any;
}

export interface OutputEvent {
  sessionId: string;
  data: string;
}

export interface ErrorEvent {
  sessionId: string;
  error: string;
}

// ============================================================================
// RDP Integration
// ============================================================================

export interface RDPClientConfig {
  executable: string; // xfreerdp, rdesktop, etc.
  args: string[];
  env?: Record<string, string>;
}

// ============================================================================
// Port Forwarding
// ============================================================================

export interface PortForwardConfig {
  localPort: number;
  remoteHost: string;
  remotePort: number;
  type: 'local' | 'remote' | 'dynamic';
}

// ============================================================================
// Jump Host / Bastion
// ============================================================================

export interface JumpHostConfig {
  host: string;
  port: number;
  username: string;
  authMethod: 'password' | 'publickey' | 'agent';
  privateKeyPath?: string;
}
