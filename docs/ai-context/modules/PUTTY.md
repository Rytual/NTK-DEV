# PuTTY / Remote Access Module - AI Context Documentation

## Module Overview

**Remote Access Module** (also known as NinjaPuTTY) provides advanced SSH, Telnet, and Serial connectivity with macro support, session recording, SFTP file transfer, and connection profile management.

### Core Purpose
- SSH/Telnet remote connections
- Serial port connectivity (RS-232, USB-Serial)
- Session recording and playback
- Command macros and automation
- SFTP file transfer

---

## File Structure

```
src/modules/putty/
├── backend/
│   ├── remote-access-engine.cjs  # SSH/Telnet engine (692 lines)
│   └── serial-engine.cjs         # Serial port engine (274 lines)
├── types/
│   └── index.ts                  # TypeScript interfaces
└── [frontend in src/pages/RemoteAccess.tsx]
```

---

## Backend Components

### 1. RemoteAccessEngine (remote-access-engine.cjs)

**Purpose**: SSH2 and Telnet connectivity with macro support.

**Key Class**: `RemoteAccessEngine extends EventEmitter`

**Native Dependencies**:
- `ssh2` - SSH2 client library

**Core Methods**:

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `createSSHSession(options)` | `{host, port, username, password/privateKey}` | `{sessionId, host, port, username}` | Create SSH session |
| `createTelnetSession(options)` | `{host, port, timeout}` | `{sessionId, host, port}` | Create Telnet session |
| `executeCommand(sessionId, command, options)` | session, command, `{timeout, waitForPrompt}` | `{output, executionTime}` | Execute remote command |
| `executeMacro(sessionId, macroName, variables)` | session, macro name, vars | `{macro, results[]}` | Run command macro |
| `createSFTPSession(sessionId)` | SSH session ID | `{sessionId, upload, download, readdir}` | SFTP file transfer |
| `saveProfile(name, profile)` | name, connection config | void | Save connection profile |
| `saveMacro(name, commands, options)` | name, commands[], `{delay, description}` | void | Save command macro |
| `closeSession(sessionId)` | session ID | boolean | Close connection |

**SSH Session Options**:
```javascript
{
  host: string,               // Required
  port: 22,                   // Default: 22
  username: string,           // Required
  password?: string,          // Password auth
  privateKey?: string,        // Key file path
  passphrase?: string,        // Key passphrase
  agent?: string,             // SSH agent socket
  keepaliveInterval: 10000,   // Keepalive (10s)
  readyTimeout: 20000         // Connection timeout (20s)
}
```

**Telnet Session Options**:
```javascript
{
  host: string,               // Required
  port: 23,                   // Default: 23
  timeout: 10000,             // Connection timeout
  negotiationMandatory: true  // Telnet negotiation
}
```

**Session Object Structure**:
```javascript
{
  id: string,
  type: 'ssh' | 'telnet',
  client: SSHClient | null,
  socket: Socket | null,
  host: string,
  port: number,
  username?: string,
  startTime: number,
  commandCount: number,
  outputBuffer: string,
  stream: null,
  sftp: null,
  recording: [],
  listeners: Set<Function>
}
```

**Session Recording**:
```javascript
// Recording entry format
{
  timestamp: number,
  type: 'input' | 'output',
  data: string
}

// Recording saved to:
// ~/.ninja-toolkit-recordings/{sessionId}-{timestamp}.json
```

**Macro System**:
```javascript
// Macro definition
{
  commands: ['cmd1', 'cmd2 {{variable}}'],
  delay: 100,              // ms between commands
  description: 'My macro',
  created: Date.now()
}

// Variable substitution: {{varName}} → value
```

**SFTP Methods**:
```javascript
// Upload file
await sftp.upload('/local/file.txt', '/remote/file.txt');

// Download file
await sftp.download('/remote/file.txt', '/local/file.txt');

// List directory
const files = await sftp.readdir('/remote/path');
```

---

### 2. SerialEngine (serial-engine.cjs)

**Purpose**: Serial port connectivity for console access.

**Key Class**: `SerialEngine extends EventEmitter`

**Native Dependencies**:
- `serialport` - Node.js serial port library

**Common Use Cases**:
- Cisco/Juniper console access
- Arduino/embedded device programming
- PLC/SCADA connectivity
- Legacy equipment management

**Core Methods**:

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `listPorts()` | none | `PortInfo[]` | List available ports |
| `createSession(options)` | `{path, baudRate, dataBits, ...}` | `{sessionId, path, baudRate, ...}` | Open serial port |
| `write(sessionId, data)` | session, raw data | `{bytes}` | Write raw data |
| `sendCommand(sessionId, command)` | session, command | `{bytes}` | Send with newline |
| `closeSession(sessionId)` | session ID | boolean | Close port |

**Serial Session Options**:
```javascript
{
  path: string,              // Required: COM3, /dev/ttyUSB0
  baudRate: 9600,            // 110 to 115200+
  dataBits: 8,               // 5, 6, 7, 8
  stopBits: 1,               // 1, 1.5, 2
  parity: 'none',            // none, even, odd, mark, space
  rtscts: false,             // Hardware flow control
  xon: false,                // Software flow control
  xoff: false,
  xany: false,
  autoOpen: true
}
```

---

## Persistent Storage

**Connection Profiles**:
```javascript
// File: ~/.ninja-toolkit-remote-profiles.enc
// Note: Should be encrypted in production
{
  "myserver": {
    host: "192.168.1.100",
    port: 22,
    username: "admin",
    created: 1234567890
  }
}
```

**Command Macros**:
```javascript
// File: ~/.ninja-toolkit-remote-macros.json
{
  "check-services": {
    commands: ["systemctl status nginx", "systemctl status mysql"],
    delay: 500,
    description: "Check web services",
    created: 1234567890
  }
}
```

---

## IPC Channels

| Channel | Direction | Parameters | Returns |
|---------|-----------|------------|---------|
| `remote:createSSH` | Renderer → Main | `{host, port, username, ...}` | `{sessionId, host}` |
| `remote:createTelnet` | Renderer → Main | `{host, port}` | `{sessionId, host}` |
| `remote:createSerial` | Renderer → Main | `{path, baudRate, ...}` | `{sessionId, path}` |
| `remote:execute` | Renderer → Main | `{sessionId, command}` | `{output, executionTime}` |
| `remote:write` | Renderer → Main | `{sessionId, data}` | void |
| `remote:close` | Renderer → Main | `{sessionId}` | boolean |
| `remote:listProfiles` | Renderer → Main | none | `string[]` |
| `remote:saveProfile` | Renderer → Main | `{name, profile}` | void |
| `remote:executeMacro` | Renderer → Main | `{sessionId, macroName, vars}` | `{results[]}` |
| `remote:listPorts` | Renderer → Main | none | `PortInfo[]` |

---

## Events

| Event | Data | Description |
|-------|------|-------------|
| `output` | `{sessionId, data}` | Terminal output |
| `error` | `{sessionId, error}` | Error occurred |
| `close` | `{sessionId}` | Session closed |

---

## Integration Points

### With PowerShell
- PowerShell remoting via SSH
- Cross-platform remote execution

### With NetworkMap
- Device console access from topology
- Automated device configuration

### With Security
- Secure credential storage
- Connection auditing

### With KageChat
- AI-assisted command generation
- Troubleshooting assistance

---

## Current State

### Implemented
- Full SSH2 protocol support
- Telnet connectivity
- Serial port communication
- Session recording
- Macro system
- Connection profiles
- SFTP file transfer

### Requirements
1. Install `ssh2`: `npm install ssh2`
2. Install `serialport`: `npm install serialport`
3. Serial ports require native module compilation

---

## Improvement Opportunities

1. **Jump Host Support**: SSH bastion/jump server
2. **Port Forwarding**: Local and remote tunnels
3. **Session Sharing**: Share session with team
4. **Credential Vault**: Encrypted credential storage
5. **Terminal Recording**: Asciinema-style replay
6. **RDP Integration**: Windows Remote Desktop
7. **VNC Support**: VNC remote viewing
