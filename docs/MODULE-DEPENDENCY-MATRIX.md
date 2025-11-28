# Module Dependency Matrix

## Overview

This document maps the dependencies for each module in Ninja Toolkit v11. Use this as a reference when debugging module issues or planning integration work.

---

## Dependency Categories

| Category | Description |
|----------|-------------|
| **NPM Package** | Standard npm dependencies |
| **Native Module** | Requires platform-specific compilation |
| **External Service** | Requires API key or external connection |
| **Internal Module** | Depends on another Ninja Toolkit module |
| **IPC Channel** | Required Electron IPC channels |

---

## Module Matrix

### Module 1: NinjaShark (Prompt 2)

**Purpose**: Network packet capture and protocol analysis

| Dependency Type | Dependency | Status | Notes |
|-----------------|------------|--------|-------|
| Native Module | `cap` | REMOVED | Requires libpcap headers |
| Native Module | `pcap` | REMOVED | Alternative to cap |
| NPM Package | - | - | - |
| External Service | - | - | - |
| Internal Module | - | - | Standalone |
| IPC Channel | `shark:startCapture` | DEFINED | In preload.js |
| IPC Channel | `shark:stopCapture` | DEFINED | In preload.js |
| IPC Channel | `shark:getPackets` | DEFINED | In preload.js |

**Backend Files**:
- `src/modules/ninjashark/backend/capture-engine.js`

**Impact of Missing Dependencies**:
- Without `cap`: No live packet capture, module non-functional

**Resolution Options**:
1. Install libpcap/WinPcap and rebuild cap module
2. Implement mock capture for development
3. Use pre-recorded PCAP file analysis only

---

### Module 2: PowerShell (Prompt 3)

**Purpose**: Terminal emulation with PowerShell integration

| Dependency Type | Dependency | Status | Notes |
|-----------------|------------|--------|-------|
| Native Module | `node-pty` | REMOVED | Requires winpty/build tools |
| NPM Package | `xterm` | INSTALLED | Terminal rendering |
| NPM Package | `xterm-addon-fit` | INSTALLED | Terminal sizing |
| NPM Package | `xterm-addon-search` | INSTALLED | Search in terminal |
| NPM Package | `xterm-addon-web-links` | INSTALLED | Clickable links |
| External Service | - | - | - |
| Internal Module | - | - | Standalone |
| IPC Channel | `shell:create` | DEFINED | In preload.js |
| IPC Channel | `shell:input` | DEFINED | In preload.js |
| IPC Channel | `shell:resize` | DEFINED | In preload.js |
| IPC Channel | `shell:close` | DEFINED | In preload.js |

**Backend Files**:
- `src/modules/powershell/backend/powershell-engine.js`

**Impact of Missing Dependencies**:
- Without `node-pty`: Cannot spawn PTY processes, terminal non-functional

**Resolution Options**:
1. Install Visual Studio Build Tools and rebuild node-pty
2. Use `child_process.spawn` as fallback (limited functionality)
3. Implement WebSocket-based terminal proxy

---

### Module 3: PuTTY/RemoteAccess (Prompt 4)

**Purpose**: SSH and Telnet client for remote access

| Dependency Type | Dependency | Status | Notes |
|-----------------|------------|--------|-------|
| Native Module | - | - | - |
| NPM Package | `ssh2` | INSTALLED | SSH client library |
| External Service | SSH Servers | REQUIRED | User-provided |
| Internal Module | - | - | Standalone |
| IPC Channel | `ssh:connect` | DEFINED | In preload.js |
| IPC Channel | `ssh:disconnect` | DEFINED | In preload.js |
| IPC Channel | `ssh:execute` | DEFINED | In preload.js |

**Backend Files**:
- `src/modules/putty/backend/remote-access-engine.js`

**Impact of Missing Dependencies**:
- SSH functionality should work with ssh2 package
- Telnet may require additional implementation

**Status**: Should be functional once IPC is wired correctly

---

### Module 4: Auvik/NetworkMap (Prompt 5)

**Purpose**: Network infrastructure monitoring and topology

| Dependency Type | Dependency | Status | Notes |
|-----------------|------------|--------|-------|
| Native Module | `snmp-native` | REMOVED | SNMP protocol |
| NPM Package | `axios` | INSTALLED | API requests |
| External Service | Auvik API | OPTIONAL | For Auvik integration |
| Internal Module | - | - | Standalone |
| IPC Channel | `network:discover` | DEFINED | In preload.js |
| IPC Channel | `network:getDevices` | DEFINED | In preload.js |

**Backend Files**:
- `src/modules/auvik/backend/network-mapper.js`

**Impact of Missing Dependencies**:
- Without `snmp-native`: No SNMP device discovery
- Can still function with API-based discovery

**Resolution Options**:
1. Rebuild snmp-native for local discovery
2. Use Auvik API exclusively
3. Implement ping-based discovery only

---

### Module 5: Security (Prompt 6)

**Purpose**: Vulnerability scanning and security assessment

| Dependency Type | Dependency | Status | Notes |
|-----------------|------------|--------|-------|
| Native Module | - | - | - |
| NPM Package | `axios` | INSTALLED | API requests |
| External Service | Various scan APIs | OPTIONAL | External scanners |
| Internal Module | - | - | Standalone |
| IPC Channel | `security:scan` | DEFINED | In preload.js |
| IPC Channel | `security:getResults` | DEFINED | In preload.js |

**Backend Files**:
- `src/modules/security/backend/vulnerability-scanner.js`

**Impact of Missing Dependencies**:
- Core scanning logic should work
- External integrations require API keys

**Status**: Should be mostly functional

---

### Module 6: MSAdmin (Prompt 7)

**Purpose**: Microsoft 365 and Azure administration

| Dependency Type | Dependency | Status | Notes |
|-----------------|------------|--------|-------|
| Native Module | - | - | - |
| NPM Package | `@azure/msal-node` | INSTALLED | MS authentication |
| NPM Package | `@azure/identity` | INSTALLED | Azure identity |
| NPM Package | `@microsoft/microsoft-graph-client` | INSTALLED | Graph API |
| External Service | Azure AD | REQUIRED | Needs app registration |
| Internal Module | - | - | Standalone |
| IPC Channel | `azure:authenticate` | DEFINED | In preload.js |
| IPC Channel | `azure:getUsers` | DEFINED | In preload.js |
| IPC Channel | `graph:query` | DEFINED | In preload.js |

**Backend Files**:
- `src/modules/msadmin/backend/msal-auth.js`

**Environment Variables Required**:
```
AZURE_CLIENT_ID=
AZURE_TENANT_ID=
AZURE_CLIENT_SECRET=
```

**Status**: Packages installed, requires Azure AD configuration

---

### Module 7: KageForge (Prompt 8)

**Purpose**: AI provider management and automation

| Dependency Type | Dependency | Status | Notes |
|-----------------|------------|--------|-------|
| Native Module | - | - | - |
| NPM Package | `@anthropic-ai/sdk` | INSTALLED | Anthropic API |
| NPM Package | `openai` | INSTALLED | OpenAI API |
| NPM Package | `@google-cloud/vertexai` | INSTALLED | Google AI |
| NPM Package | `tiktoken` | INSTALLED | Token counting |
| External Service | AI APIs | REQUIRED | API keys needed |
| Internal Module | - | - | Standalone |
| IPC Channel | `ai:query` | DEFINED | In preload.js |
| IPC Channel | `ai:getProviders` | DEFINED | In preload.js |
| IPC Channel | `ai:setProvider` | DEFINED | In preload.js |

**Backend Files**:
- `src/modules/kageforge/backend/provider-router.js`

**Environment Variables Required**:
```
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GOOGLE_APPLICATION_CREDENTIALS=
```

**Status**: Packages installed, requires API keys

---

### Module 8: Ticketing (Prompt 9)

**Purpose**: ConnectWise PSA integration

| Dependency Type | Dependency | Status | Notes |
|-----------------|------------|--------|-------|
| Native Module | - | - | - |
| NPM Package | `axios` | INSTALLED | API requests |
| External Service | ConnectWise API | REQUIRED | PSA instance |
| Internal Module | - | - | Standalone |
| IPC Channel | `tickets:list` | DEFINED | In preload.js |
| IPC Channel | `tickets:get` | DEFINED | In preload.js |
| IPC Channel | `tickets:update` | DEFINED | In preload.js |

**Backend Files**:
- `src/modules/ticketing/backend/connectwise-client.js`

**Environment Variables Required**:
```
CONNECTWISE_API_URL=
CONNECTWISE_COMPANY_ID=
CONNECTWISE_PUBLIC_KEY=
CONNECTWISE_PRIVATE_KEY=
```

**Status**: Should work with ConnectWise configuration

---

### Module 9: Academy (Prompt 10)

**Purpose**: Training and certification platform

| Dependency Type | Dependency | Status | Notes |
|-----------------|------------|--------|-------|
| Native Module | `better-sqlite3` | REMOVED | Local database |
| NPM Package | `quill` | INSTALLED | Rich text editor |
| NPM Package | `jspdf` | INSTALLED | PDF generation |
| External Service | - | - | - |
| Internal Module | - | - | Standalone |
| IPC Channel | `academy:getCourses` | DEFINED | In preload.js |
| IPC Channel | `academy:getProgress` | DEFINED | In preload.js |

**Backend Files**:
- `src/modules/academy/backend/engines/QuestionBank.js`

**Impact of Missing Dependencies**:
- Without `better-sqlite3`: Cannot persist progress locally

**Resolution Options**:
1. Rebuild better-sqlite3 with Visual Studio
2. Use electron-store for simple persistence
3. Use memory-only storage for development

---

### Module 10: MediaLoader (Prompt 1 v4)

**Purpose**: Global media management for backgrounds/themes

| Dependency Type | Dependency | Status | Notes |
|-----------------|------------|--------|-------|
| Native Module | - | - | - |
| NPM Package | - | - | Uses Node.js fs |
| External Service | - | - | - |
| Internal Module | - | - | Standalone, CORE |
| IPC Channel | `media:getRandomImage` | DEFINED | In preload.js |
| IPC Channel | `media:getRandomVideo` | DEFINED | In preload.js |
| IPC Channel | `media:getStats` | DEFINED | In preload.js |
| IPC Channel | `media:getAllMedia` | DEFINED | In preload.js |
| IPC Channel | `media:reload` | DEFINED | In preload.js |

**Backend Files**:
- `src/core/media/MediaLoader.js`
- `src/backend/mediaLoaderBridge.js`

**Status**: Should be fully functional (no native dependencies)

---

### Module 11: KageChat (Prompt 1)

**Purpose**: AI assistant panel

| Dependency Type | Dependency | Status | Notes |
|-----------------|------------|--------|-------|
| Native Module | - | - | - |
| NPM Package | - | - | Uses KageForge |
| External Service | Via KageForge | REQUIRED | AI providers |
| Internal Module | KageForge | REQUIRED | For AI queries |
| IPC Channel | `kage-query` | DEFINED | In preload.js |

**Backend Files**:
- Uses KageForge backend

**Status**: Depends on KageForge being functional

---

## Native Module Summary

| Module | Native Dependency | Build Requirements |
|--------|-------------------|-------------------|
| NinjaShark | cap | libpcap-dev (Linux), WinPcap (Windows) |
| PowerShell | node-pty | Visual Studio Build Tools, Python |
| NetworkMap | snmp-native | C++ compiler |
| Academy | better-sqlite3 | Visual Studio Build Tools |

### Windows Build Requirements

```powershell
# Install Visual Studio Build Tools
winget install Microsoft.VisualStudio.2022.BuildTools

# Or via npm (deprecated)
npm install --global windows-build-tools

# Rebuild native modules
npm run rebuild
```

---

## IPC Channel Quick Reference

| Channel | Direction | Module |
|---------|-----------|--------|
| `kage-query` | Renderer -> Main | KageChat |
| `media:*` | Renderer -> Main | MediaLoader |
| `shell:*` | Renderer -> Main | PowerShell |
| `ssh:*` | Renderer -> Main | PuTTY |
| `shark:*` | Renderer -> Main | NinjaShark |
| `network:*` | Renderer -> Main | NetworkMap |
| `security:*` | Renderer -> Main | Security |
| `azure:*` | Renderer -> Main | MSAdmin |
| `graph:*` | Renderer -> Main | MSAdmin |
| `ai:*` | Renderer -> Main | KageForge |
| `tickets:*` | Renderer -> Main | Ticketing |
| `academy:*` | Renderer -> Main | Academy |

---

## Debugging Priority Order

Based on dependencies, debug modules in this order:

1. **MediaLoader** - No native deps, core system
2. **Security** - No native deps
3. **PuTTY/RemoteAccess** - ssh2 is pure JS
4. **MSAdmin** - MSAL is pure JS
5. **KageForge** - AI SDKs are pure JS
6. **Ticketing** - axios is pure JS
7. **KageChat** - Depends on KageForge
8. **Academy** - Needs better-sqlite3
9. **NetworkMap** - Needs snmp-native
10. **PowerShell** - Needs node-pty
11. **NinjaShark** - Needs cap/libpcap

---

*Last updated: 2025-11-28*
