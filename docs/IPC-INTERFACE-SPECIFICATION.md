# IPC Interface Specification

## Overview

This document defines the canonical IPC interface for Ninja Toolkit v11. All renderer processes MUST use this interface for main process communication.

---

## API Surface

### Global Object: `window.electronAPI`

All IPC communication flows through a single global object exposed via `contextBridge`:

```typescript
interface ElectronAPI {
  invoke(channel: string, ...args: any[]): Promise<any>;
  send(channel: string, ...args: any[]): void;
  on(channel: string, callback: (...args: any[]) => void): () => void;
  once(channel: string, callback: (...args: any[]) => void): void;
  removeAllListeners(channel: string): void;

  // Platform info
  platform: NodeJS.Platform;
  arch: string;
  versions: {
    electron: string;
    node: string;
    chrome: string;
  };
}
```

### Usage Pattern

```typescript
// Correct usage
const result = await window.electronAPI.invoke('media:getRandomImage');

// Subscribe to events
const unsubscribe = window.electronAPI.on('ninjashark:packet', (packet) => {
  console.log('Packet received:', packet);
});

// Cleanup
unsubscribe();
```

---

## Channel Naming Convention

All channels follow the pattern: `{module}:{action}`

| Module | Prefix | Example |
|--------|--------|---------|
| System | `system:` | `system:getVersion` |
| MediaLoader | `media:` | `media:getRandomImage` |
| KageChat | `kage:` | `kage:sendMessage` |
| NinjaShark | `ninjashark:` | `ninjashark:startCapture` |
| PowerShell | `powershell:` | `powershell:execute` |
| PuTTY | `putty:` | `putty:connect` |
| Auvik | `auvik:` | `auvik:scan` |
| Security | `security:` | `security:scanTarget` |
| MSAdmin | `msadmin:` | `msadmin:authenticate` |
| KageForge | `kageforge:` | `kageforge:chat` |
| Ticketing | `ticketing:` | `ticketing:createTicket` |
| Academy | `academy:` | `academy:getQuestion` |

---

## Invoke Channels (Request/Response)

### System Channels

| Channel | Parameters | Returns | Description |
|---------|------------|---------|-------------|
| `system:getModuleStates` | none | `Record<string, ModuleStatus>` | Get all module loading states |
| `system:getVersion` | none | `VersionInfo` | Get application version info |
| `system:getPlatform` | none | `PlatformInfo` | Get platform information |

### Media Channels

| Channel | Parameters | Returns | Description |
|---------|------------|---------|-------------|
| `media:getRandomImage` | none | `string \| null` | Get random background image path |
| `media:getRandomVideo` | none | `string \| null` | Get random background video path |
| `media:getRandomImages` | `count: number` | `string[]` | Get multiple random images |
| `media:getStats` | none | `MediaStats` | Get media library statistics |
| `media:getAllMedia` | none | `MediaCollection` | Get all available media |
| `media:reload` | none | `void` | Force reload media library |

### Kage Channels

| Channel | Parameters | Returns | Description |
|---------|------------|---------|-------------|
| `kage:sendMessage` | `message: string, context?: KageContext` | `KageResponse` | Send message to AI |
| `kage:setContext` | `context: KageContext` | `{ success: boolean }` | Update AI context |
| `kage:getProviders` | none | `string[]` | List available AI providers |

### NinjaShark Channels

| Channel | Parameters | Returns | Description |
|---------|------------|---------|-------------|
| `ninjashark:startCapture` | `options: CaptureOptions` | `CaptureResult` | Start packet capture |
| `ninjashark:stopCapture` | `sessionId: string` | `{ success: boolean }` | Stop capture session |
| `ninjashark:getPackets` | `filter?: PacketFilter` | `Packet[]` | Get captured packets |
| `ninjashark:export` | `format: string, packets: Packet[]` | `ExportResult` | Export packets to file |

### PowerShell Channels

| Channel | Parameters | Returns | Description |
|---------|------------|---------|-------------|
| `powershell:execute` | `command: string` | `ExecutionResult` | Execute PowerShell command |
| `powershell:getHistory` | none | `HistoryEntry[]` | Get command history |
| `powershell:createSession` | `options?: SessionOptions` | `SessionInfo` | Create new session |

### PuTTY Channels

| Channel | Parameters | Returns | Description |
|---------|------------|---------|-------------|
| `putty:connect` | `config: ConnectionConfig` | `{ success: boolean }` | Connect to remote host |
| `putty:disconnect` | `sessionId: string` | `{ success: boolean }` | Disconnect session |
| `putty:send` | `sessionId: string, data: string` | `{ success: boolean }` | Send data to session |
| `putty:getSessions` | none | `SessionInfo[]` | List active sessions |

### Auvik Channels

| Channel | Parameters | Returns | Description |
|---------|------------|---------|-------------|
| `auvik:scan` | `range: string` | `ScanResult` | Scan network range |
| `auvik:getTopology` | none | `TopologyData` | Get network topology |
| `auvik:snmpWalk` | `target: string, community: string` | `SnmpResult` | Perform SNMP walk |

### Security Channels

| Channel | Parameters | Returns | Description |
|---------|------------|---------|-------------|
| `security:scanTarget` | `target: string` | `ScanResult` | Scan target for vulnerabilities |
| `security:getThreats` | none | `Threat[]` | Get detected threats |
| `security:checkCompliance` | `standard: string` | `ComplianceResult` | Check compliance |
| `security:getRiskScore` | `asset: string` | `RiskScore` | Calculate risk score |

### MSAdmin Channels

| Channel | Parameters | Returns | Description |
|---------|------------|---------|-------------|
| `msadmin:authenticate` | `config: AuthConfig` | `AuthResult` | Authenticate with Azure AD |
| `msadmin:getUsers` | none | `User[]` | Get M365 users |
| `msadmin:getLicenses` | none | `License[]` | Get license information |
| `msadmin:runScript` | `script: string, targets: string[]` | `ScriptResult` | Run admin script |

### KageForge Channels

| Channel | Parameters | Returns | Description |
|---------|------------|---------|-------------|
| `kageforge:chat` | `message: string, provider?: string, options?: ChatOptions` | `ChatResponse` | Send chat message |
| `kageforge:switchProvider` | `provider: string` | `{ success: boolean }` | Switch AI provider |
| `kageforge:getTokenUsage` | none | `TokenUsage` | Get token consumption |
| `kageforge:getProviderStatus` | none | `ProviderStatus` | Get provider availability |

### Ticketing Channels

| Channel | Parameters | Returns | Description |
|---------|------------|---------|-------------|
| `ticketing:createTicket` | `ticket: TicketData` | `CreateResult` | Create new ticket |
| `ticketing:searchTickets` | `query: SearchQuery` | `Ticket[]` | Search tickets |
| `ticketing:updateTicket` | `id: number, updates: TicketUpdates` | `UpdateResult` | Update existing ticket |
| `ticketing:getCompanies` | none | `Company[]` | Get company list |
| `ticketing:analyzeTicket` | `ticketId: number` | `AnalysisResult` | AI analyze ticket |

### Academy Channels

| Channel | Parameters | Returns | Description |
|---------|------------|---------|-------------|
| `academy:getQuestion` | `category: string, difficulty: string` | `QuestionResult` | Get quiz question |
| `academy:submitAnswer` | `questionId: string, answer: string` | `AnswerResult` | Submit answer |
| `academy:getProgress` | none | `ProgressInfo` | Get learning progress |
| `academy:getCertifications` | none | `Certification[]` | Get certifications |

---

## Send Channels (Fire-and-Forget)

| Channel | Parameters | Description |
|---------|------------|-------------|
| `app:ready` | none | Signal app is ready |
| `module:navigate` | `module: string` | Request module navigation |
| `kage:clearHistory` | none | Clear chat history |

---

## Receive Channels (Events from Main)

| Channel | Payload | Description |
|---------|---------|-------------|
| `media:reload` | none | Media library updated |
| `hotkey:kageChat` | none | KageChat toggle hotkey pressed |
| `hotkey:module` | `module: string` | Module hotkey pressed |
| `menu:settings` | none | Settings menu clicked |
| `menu:aiSettings` | none | AI settings clicked |
| `menu:docs` | none | Documentation clicked |
| `menu:shortcuts` | none | Shortcuts clicked |
| `menu:updates` | none | Check updates clicked |
| `kage:clearHistory` | none | History cleared |
| `kage:response` | `KageResponse` | Streaming AI response |
| `ninjashark:packet` | `Packet` | New packet captured |
| `powershell:output` | `OutputData` | Terminal output |
| `putty:data` | `SessionData` | Remote session data |
| `auvik:deviceFound` | `Device` | Device discovered |
| `security:alert` | `Alert` | Security alert |
| `ticketing:notification` | `Notification` | Ticket notification |

---

## Migration Guide

### From `window.electron` to `window.electronAPI`

**Before (incorrect):**
```typescript
// Old pattern - DO NOT USE
const result = await window.electron.ipcRenderer.invoke('media:getRandomImage');
```

**After (correct):**
```typescript
// New pattern - USE THIS
const result = await window.electronAPI.invoke('media:getRandomImage');
```

### From `kage-query` to `kage:sendMessage`

**Before (incorrect):**
```typescript
const response = await window.electronAPI.invoke('kage-query', { query, context });
```

**After (correct):**
```typescript
const response = await window.electronAPI.invoke('kage:sendMessage', query, context);
```

---

## Type Definitions

See `src/types/electron.d.ts` for complete TypeScript definitions.

---

*Last updated: 2025-11-28*
