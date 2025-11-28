# PowerShell Module - AI Context Documentation

## Module Overview

**PowerShell Module** provides advanced PowerShell terminal integration using node-pty for true PTY terminal emulation with ANSI color support, command history persistence, and multi-session management.

### Core Purpose
- Cross-platform PowerShell execution (Windows PowerShell, PowerShell Core)
- Real PTY terminal with ANSI color support
- Command history with persistence
- Multi-session management with isolation

---

## File Structure

```
src/modules/powershell/
├── backend/
│   └── powershell-engine.cjs   # Core PTY engine (457 lines)
├── types/
│   └── index.ts                # TypeScript interfaces
└── [frontend in src/pages/PowerShell.tsx]
```

---

## Backend Components

### PowerShellEngine (powershell-engine.cjs)

**Purpose**: Cross-platform PowerShell execution with PTY terminal emulation.

**Key Class**: `PowerShellEngine extends EventEmitter`

**Native Dependencies**:
- `node-pty` - Pseudo-terminal for Node.js

**PowerShell Detection Priority**:
1. `pwsh` (PowerShell Core - preferred)
2. `/usr/local/bin/pwsh`, `/usr/bin/pwsh` (Linux/macOS)
3. `C:\Program Files\PowerShell\7\pwsh.exe` (Windows PS7)
4. `C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe` (Windows PS5)

**Configuration**:
```javascript
// Session defaults
const sessionDefaults = {
  cols: 120,
  rows: 30,
  cwd: os.homedir(),
  executionPolicy: 'RemoteSigned'
};

// Environment
env: {
  TERM: 'xterm-256color',
  COLORTERM: 'truecolor'
}
```

**Core Methods**:

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `createSession(options)` | `{cols, rows, cwd, env, executionPolicy}` | `{sessionId, pid}` | Create new PS session |
| `executeCommand(sessionId, command, options)` | session ID, command, `{timeout}` | `{output, executionTime, commandNumber}` | Execute command |
| `writeToSession(sessionId, data)` | session ID, raw input | void | Write raw input |
| `resizeTerminal(sessionId, cols, rows)` | session ID, dimensions | void | Resize terminal |
| `closeSession(sessionId)` | session ID | boolean | Close session |
| `getSessionInfo(sessionId)` | session ID | `SessionInfo \| null` | Get session metadata |
| `listSessions()` | none | `SessionInfo[]` | List all active sessions |
| `getHistory(limit)` | max results | `string[]` | Get command history |
| `clearHistory()` | none | void | Clear history |

**Session Object Structure**:
```javascript
{
  id: string,
  ptyProcess: IPty,
  cwd: string,
  startTime: number,
  commandCount: number,
  outputBuffer: string,
  listeners: Set<Function>
}
```

**Performance Targets**:
- Command dispatch: <50ms
- History persistence: 1000 commands max

**History Persistence**:
```javascript
// History file location
this.historyFile = path.join(os.homedir(), '.ninja-toolkit-ps-history');

// Auto-save on command, deduplicate
addToHistory(command) {
  if (command === lastCommand) return; // Skip duplicates
  this.history.push(command);
  if (this.history.length > 1000) {
    this.history = this.history.slice(-1000);
  }
  this.saveHistory();
}
```

---

## IPC Channels

| Channel | Direction | Parameters | Returns |
|---------|-----------|------------|---------|
| `powershell:createSession` | Renderer → Main | `{cols, rows, cwd}` | `{sessionId, pid}` |
| `powershell:execute` | Renderer → Main | `{sessionId, command}` | `{output, executionTime}` |
| `powershell:write` | Renderer → Main | `{sessionId, data}` | void |
| `powershell:resize` | Renderer → Main | `{sessionId, cols, rows}` | void |
| `powershell:close` | Renderer → Main | `{sessionId}` | boolean |
| `powershell:getHistory` | Renderer → Main | `{limit}` | `string[]` |
| `powershell:listSessions` | Renderer → Main | none | `SessionInfo[]` |

---

## Events

| Event | Data | Description |
|-------|------|-------------|
| `output` | `{sessionId, data}` | Terminal output |
| `exit` | `{sessionId, code}` | Session terminated |

---

## Integration Points

### With KageChat
- AI-assisted command suggestions
- Natural language to PowerShell translation
- Command explanation

### With Remote Access
- PowerShell remoting via SSH
- Hybrid local/remote sessions

### With Security
- Script security analysis
- Execution policy management

---

## Current State

### Implemented
- Full PTY terminal emulation
- Cross-platform PowerShell detection
- Command history with persistence
- Multi-session management
- Performance metrics

### Requirements
1. Install `node-pty`: `npm install node-pty`
2. PowerShell must be installed on system
3. Recommended: PowerShell Core (pwsh) for cross-platform

---

## Improvement Opportunities

1. **Tab Completion**: Integrate with PowerShell's ReadLine API
2. **Syntax Highlighting**: Real-time syntax highlighting
3. **Script Editor**: Built-in script editing and execution
4. **Profile Support**: Load user PowerShell profiles
5. **Variable Explorer**: Inspect PowerShell variables
6. **Module Browser**: Browse and install PS modules
