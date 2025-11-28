# Ninja Toolkit v11.0.0 - Complete AI Context Document

> **Purpose**: This document provides complete context for AI assistants (Claude, GPT-4, Gemini, Grok) to understand and work on the Ninja Toolkit codebase.
>
> **Last Updated**: 2025-11-28
> **Version**: 11.0.0
> **Status**: Production Ready

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Summary](#2-architecture-summary)
3. [Technology Stack](#3-technology-stack)
4. [File Structure](#4-file-structure)
5. [IPC Communication](#5-ipc-communication)
6. [Module System](#6-module-system)
7. [Core Source Files](#7-core-source-files)
8. [Build System](#8-build-system)
9. [Current State](#9-current-state)
10. [Working with the Codebase](#10-working-with-the-codebase)

---

## 1. Project Overview

### What is Ninja Toolkit?

Ninja Toolkit is an **enterprise-grade desktop application** for Managed Service Providers (MSPs). It consolidates 11 specialized IT management modules into a unified command center.

### Key Capabilities

| Module | Purpose |
|--------|---------|
| **NinjaShark** | Network packet capture & protocol analysis (libpcap) |
| **PowerShell** | Multi-tab terminal emulator with AI tagging |
| **PuTTY** | SSH/Telnet/Serial remote access |
| **NetworkMap** | 3D topology visualization with SNMP |
| **Security** | Vulnerability scanning & 7 compliance frameworks |
| **MSAdmin** | Microsoft 365/Azure administration (Graph API) |
| **KageForge** | Multi-provider AI orchestration (5 providers) |
| **Ticketing** | ConnectWise PSA integration |
| **Academy** | Gamified training with 1,200+ questions |
| **MediaLoader** | Global theming & background management |
| **KageChat** | Context-aware AI assistant panel |

### Business Context

- **Target Users**: MSP technicians, IT administrators
- **Deployment**: Windows 10/11, enterprise (GPO/Intune/SCCM)
- **Performance Targets**: <100ms module swap, <400MB RAM (production)

---

## 2. Architecture Summary

### Three-Process Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     RENDERER PROCESS                             │
│  React 19 + TypeScript + Tailwind CSS + Framer Motion           │
│  - UI Components (src/components/)                               │
│  - Pages/Routes (src/pages/)                                     │
│  - Context Providers (src/contexts/)                             │
│  - Module UIs (src/modules/*/renderer/)                          │
└────────────────────────┬────────────────────────────────────────┘
                         │ contextBridge (preload.js)
                         │ 58 IPC Channels
┌────────────────────────┴────────────────────────────────────────┐
│                      MAIN PROCESS                                │
│  Electron 39 + Node.js 20 + Native Modules                      │
│  - IPC Handlers (src/main.ts)                                    │
│  - Module Backends (src/modules/*/backend/)                      │
│  - Event Bus (src/backend/eventBus.cjs)                          │
│  - Native: better-sqlite3, serialport, cap                       │
└─────────────────────────────────────────────────────────────────┘
```

### Layout Structure

```
┌──────────┬─────────────────────────────────┬─────────────┐
│  SIDEBAR │         MODULE CONTENT          │  KAGE CHAT  │
│  (64px)  │       (Lazy Loaded Routes)      │   (320px)   │
│          │                                  │             │
│  Nav     │   <ErrorBoundary>               │  AI Panel   │
│  Icons   │     <Suspense>                  │  Context-   │
│          │       <Module />                │  Aware      │
│          │     </Suspense>                 │             │
│          │   </ErrorBoundary>              │             │
├──────────┴─────────────────────────────────┴─────────────┤
│                      STATUS BAR                          │
└──────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Action** → React Component
2. **IPC Call** → `window.electronAPI.invoke(channel, args)`
3. **Preload Bridge** → Channel validation (allowlist)
4. **Main Process** → `ipcMain.handle(channel, handler)`
5. **Backend Module** → Business logic execution
6. **Response** → Back through IPC to renderer

---

## 3. Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.0 | UI framework with concurrent features |
| TypeScript | 5.9.3 | Type safety (strict mode) |
| Tailwind CSS | 4.0.17 | Styling with OKLCH colors |
| Framer Motion | 11.15.0 | Animation with physics |
| React Router | 6.30.2 | Client-side routing |
| Radix UI | Latest | Accessible primitives |
| Recharts | 2.15.0 | Data visualization |
| xterm.js | 5.3.0 | Terminal emulation |
| Three.js | 0.160.0 | 3D graphics |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Electron | 39.2.4 | Desktop shell (Chromium 130) |
| Express | 4.21.2 | REST API server |
| better-sqlite3 | 12.4.6 | SQLite with WAL mode |
| serialport | 13.0.0 | Serial communication |
| cap | N/A | libpcap bindings |
| ssh2 | 1.15.0 | SSH connections |
| Winston | 3.11.0 | Logging |

### AI Providers

| Provider | Package | Models |
|----------|---------|--------|
| Anthropic | @anthropic-ai/sdk 0.68.0 | Claude 3.5 Sonnet, Opus, Haiku |
| OpenAI | openai 4.67.0 | GPT-4o, GPT-4 Turbo |
| Google | @google-cloud/vertexai 1.10.0 | Gemini Pro/Ultra |
| Azure | @azure/msal-node 2.15.0 | Azure OpenAI |
| Local | HTTP API | Ollama, LM Studio |

### Build Tools

| Tool | Version | Purpose |
|------|---------|---------|
| Vite | 7.2.4 | Build tooling with HMR |
| Electron Forge | 7.4.0 | Packaging & distribution |
| esbuild | Bundled | Fast transpilation |

---

## 4. File Structure

```
ninja-toolkit-v11/
├── src/
│   ├── main.ts                    # Main process entry (1,132 lines)
│   ├── preload.js                 # IPC bridge (295 lines)
│   ├── renderer/
│   │   ├── App.tsx                # Root React component (260 lines)
│   │   ├── main.tsx               # React entry point
│   │   └── index.css              # Tailwind theme
│   │
│   ├── components/
│   │   ├── ErrorBoundary/         # Error handling with retry
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx        # Navigation blade
│   │   │   ├── TopBar.tsx         # Header with search
│   │   │   ├── StatusBar.tsx      # System status
│   │   │   └── ChatPanel.tsx      # KageChat UI
│   │   └── ui/                    # Radix-based components
│   │
│   ├── pages/                     # Route components
│   │   ├── Dashboard.tsx
│   │   ├── NinjaShark.tsx
│   │   ├── PowerShell.tsx
│   │   ├── RemoteAccess.tsx
│   │   ├── NetworkMap.tsx
│   │   ├── Security.tsx
│   │   ├── Azure.tsx
│   │   ├── AIManager.tsx
│   │   ├── Ticketing.tsx
│   │   └── Academy.tsx
│   │
│   ├── modules/                   # Module-specific code
│   │   ├── academy/
│   │   │   └── backend/engines/   # QuestionBank, Gamification, DB
│   │   ├── auvik/
│   │   │   └── backend/           # network-mapper, snmp-engine
│   │   ├── kageforge/
│   │   │   └── backend/           # provider-router, providers/
│   │   ├── msadmin/
│   │   │   └── backend/           # msal-auth, graph-client
│   │   ├── ninjashark/
│   │   │   └── backend/           # capture-engine
│   │   ├── powershell/
│   │   │   └── backend/           # powershell-engine
│   │   ├── putty/
│   │   │   └── backend/           # remote-access-engine
│   │   ├── security/
│   │   │   └── backend/           # vulnerability-scanner
│   │   └── ticketing/
│   │       └── backend/           # connectwise-client
│   │
│   ├── backend/
│   │   ├── eventBus.cjs           # Pub/sub + health monitoring
│   │   ├── mediaLoaderBridge.cjs  # Background asset management
│   │   ├── db-init.cjs            # Database initialization
│   │   └── server.cjs             # Express API server
│   │
│   ├── lib/
│   │   └── utils.ts               # Utilities + performance tools
│   │
│   ├── contexts/                  # React context providers
│   │   └── ThemeContext.tsx
│   │
│   └── types/                     # TypeScript declarations
│       ├── global.d.ts
│       ├── hmr.d.ts
│       └── styled-jsx.d.ts
│
├── art/                           # User-provided media assets
├── assets/                        # Application icons
├── docs/                          # Documentation
│   ├── ai-context/                # AI context documents (this)
│   └── DEBUGGING-JOURNAL.md       # Development history
│
├── forge.config.cjs               # Electron Forge configuration
├── vite.main.config.mjs           # Main process Vite config
├── vite.preload.config.mjs        # Preload Vite config
├── vite.renderer.config.mjs       # Renderer Vite config
├── tailwind.config.js             # Tailwind configuration
├── tsconfig.json                  # TypeScript configuration
└── package.json                   # Dependencies
```

---

## 5. IPC Communication

### Channel Registry

The IPC system uses **allowlisted channels** for security. All communication goes through `window.electronAPI`.

#### Invoke Channels (Request/Response)

```javascript
// System (7 channels)
'system:getModuleStates'    // Get all module load states
'system:getVersion'         // Get app version info
'system:getPlatform'        // Get platform info
'system:logError'           // Log error to aggregator
'system:getErrors'          // Get recent errors
'system:getHealth'          // Get module health status
'system:runHealthCheck'     // Run health checks
'system:getEventHistory'    // Get event bus history

// Module Lifecycle (2 channels)
'module:switch'             // Switch active module context
'module:getActive'          // Get current active module

// MediaLoader (6 channels)
'media:getRandomImage'      // Get random background image
'media:getRandomVideo'      // Get random background video
'media:getRandomImages'     // Get multiple random images
'media:getStats'            // Get media statistics
'media:getAllMedia'         // Get all available media
'media:reload'              // Reload media from disk

// KageChat (3 channels)
'kage:sendMessage'          // Send message to AI
'kage:setContext'           // Set module context
'kage:getProviders'         // Get available AI providers

// NinjaShark (4 channels)
'ninjashark:startCapture'   // Start packet capture
'ninjashark:stopCapture'    // Stop packet capture
'ninjashark:getPackets'     // Get captured packets
'ninjashark:export'         // Export to PCAP/CSV

// PowerShell (3 channels)
'powershell:execute'        // Execute command
'powershell:getHistory'     // Get command history
'powershell:createSession'  // Create new session

// PuTTY (4 channels)
'putty:connect'             // Connect SSH/Telnet/Serial
'putty:disconnect'          // Disconnect session
'putty:send'                // Send data
'putty:getSessions'         // Get active sessions

// Auvik/Network (3 channels)
'auvik:scan'                // Scan network range
'auvik:getTopology'         // Get network topology
'auvik:snmpWalk'            // SNMP walk target

// Security (4 channels)
'security:scanTarget'       // Scan for vulnerabilities
'security:getThreats'       // Get threat list
'security:checkCompliance'  // Check compliance status
'security:getRiskScore'     // Calculate risk score

// MSAdmin (4 channels)
'msadmin:authenticate'      // Authenticate to Azure AD
'msadmin:getUsers'          // Get M365 users
'msadmin:getLicenses'       // Get license info
'msadmin:runScript'         // Run admin script

// KageForge (4 channels)
'kageforge:chat'            // Chat with AI provider
'kageforge:switchProvider'  // Switch AI provider
'kageforge:getTokenUsage'   // Get token usage stats
'kageforge:getProviderStatus' // Get provider status

// Ticketing (5 channels)
'ticketing:createTicket'    // Create new ticket
'ticketing:searchTickets'   // Search tickets
'ticketing:updateTicket'    // Update ticket
'ticketing:getCompanies'    // Get company list
'ticketing:analyzeTicket'   // AI analyze ticket

// Academy (10 channels)
'academy:getQuestion'       // Get single question
'academy:submitAnswer'      // Submit answer
'academy:getProgress'       // Get progress
'academy:getCertifications' // Get cert list
'academy:getExams'          // Get exam list
'academy:getExamQuestions'  // Get exam questions
'academy:getRandomQuestions' // Get random questions
'academy:getUserStats'      // Get user stats
'academy:getProgressSummary' // Get progress summary
'academy:getAllBadges'      // Get all badges
'academy:recordAnswer'      // Record answer
```

#### Receive Channels (Events from Main)

```javascript
'media:reload'              // Media hot reload
'module:switched'           // Module switch event
'health:changed'            // Health status change
'error:logged'              // Error logged event
'hotkey:kageChat'           // KageChat toggle hotkey
'hotkey:module'             // Module switch hotkey
'ninjashark:packet'         // New packet captured
'powershell:output'         // Terminal output
'putty:data'                // Remote data received
'auvik:deviceFound'         // Device discovered
'security:alert'            // Security alert
'ticketing:notification'    // Ticket notification
```

### Usage Pattern

```typescript
// Renderer: Making IPC calls
const result = await window.electronAPI.invoke('ninjashark:startCapture', {
  sessionId: 'session-1',
  interface: 'eth0',
  filter: 'tcp port 443'
});

// Renderer: Listening for events
const unsubscribe = window.electronAPI.on('ninjashark:packet', (packet) => {
  console.log('New packet:', packet);
});

// Main: Handling IPC
ipcMain.handle('ninjashark:startCapture', async (_event, options) => {
  const session = await captureEngine.startCapture(options);
  return { success: true, session };
});
```

---

## 6. Module System

### Module Loading (main.ts)

Each module is loaded with graceful fallback:

```typescript
// Pattern for all modules
let CaptureEngine: any = null;
try {
  const captureModule = require('./modules/ninjashark/backend/capture-engine.cjs');
  CaptureEngine = captureModule.CaptureEngine;
  moduleStatus.ninjashark.loaded = true;
  console.log('[Main] NinjaShark capture engine loaded');
} catch (error: any) {
  moduleStatus.ninjashark.error = error.message;
  console.warn('[Main] NinjaShark capture engine failed to load:', error.message);
}
```

### Module Status Tracking

```typescript
const moduleStatus: Record<string, { loaded: boolean; error?: string }> = {
  mediaLoader: { loaded: false },
  database: { loaded: false },
  ninjashark: { loaded: false },
  powershell: { loaded: false },
  putty: { loaded: false },
  auvik: { loaded: false },
  security: { loaded: false },
  msadmin: { loaded: false },
  kageforge: { loaded: false },
  ticketing: { loaded: false },
  academy: { loaded: false },
};
```

### Frontend Lazy Loading (App.tsx)

```typescript
const moduleImports = {
  Dashboard: () => import('../pages/Dashboard'),
  NinjaShark: () => import('../pages/NinjaShark'),
  // ... other modules
};

// With performance tracking
const NinjaShark = React.lazy(() => {
  const start = performance.now();
  return moduleImports.NinjaShark().then((mod) => {
    perfMetrics.record('module-load:NinjaShark', performance.now() - start);
    return mod;
  });
});

// Route adjacency for prefetching
const routeModuleMap: Record<string, string[]> = {
  '/ninjashark': ['Dashboard', 'Security', 'NetworkMap'],
  '/powershell': ['Dashboard', 'RemoteAccess', 'Security'],
  // ... other routes
};
```

---

## 7. Core Source Files

### main.ts (Electron Main Process)

**Location**: `src/main.ts`
**Lines**: 1,132
**Purpose**: Application entry, IPC handlers, module initialization

Key sections:
- Lines 1-50: Native module loading with fallbacks
- Lines 50-210: Module engine class loading
- Lines 228-270: Window creation with security config
- Lines 276-903: IPC handler registration (58 handlers)
- Lines 909-1017: Module initialization
- Lines 1023-1049: Global hotkey registration
- Lines 1055-1133: Application lifecycle

### preload.js (IPC Bridge)

**Location**: `src/preload.js`
**Lines**: 295
**Purpose**: Secure IPC bridge between main and renderer

Key sections:
- Lines 22-109: Invoke channel allowlist (58 channels)
- Lines 111-116: Send channel allowlist
- Lines 117-148: Receive channel allowlist
- Lines 154-231: `window.electronAPI` exposure
- Lines 239-282: Legacy `window.electron` (deprecated)

### App.tsx (React Root)

**Location**: `src/renderer/App.tsx`
**Lines**: 260
**Purpose**: Root component with routing and layout

Key sections:
- Lines 14-25: Module import functions
- Lines 27-97: Lazy component definitions with timing
- Lines 99-111: Route adjacency map for prefetching
- Lines 136-189: AnimatedRoutes with prefetching logic
- Lines 192-245: AppLayout with sidebar/chat state
- Lines 248-259: Root App with providers

### eventBus.cjs (Enterprise Infrastructure)

**Location**: `src/backend/eventBus.cjs`
**Lines**: 389
**Purpose**: Pub/sub, error aggregation, health monitoring

Exports:
- `eventBus`: Central EventEmitter with history
- `errorAggregator`: Centralized error collection
- `healthMonitor`: Module health tracking
- `moduleLifecycle`: Active module context

---

## 8. Build System

### Vite Configuration

**Renderer** (`vite.renderer.config.mjs`):
- Target: Chrome 120
- Chunk splitting: react-vendor, framer, icons, charts, ui-primitives
- Asset inlining: <8KB
- Production: console.log/debugger removed

**Main** (`vite.main.config.mjs`):
- Target: Node 20
- External: electron, native modules

### Electron Forge Configuration

**File**: `forge.config.cjs`

```javascript
{
  packagerConfig: {
    asar: true,
    name: 'Ninja Toolkit',
    executableName: 'ninja-toolkit',
    // Security fuses enabled
  },
  makers: [
    '@electron-forge/maker-squirrel',  // Windows installer
    '@electron-forge/maker-zip',       // Portable ZIP
  ],
  plugins: [
    '@electron-forge/plugin-vite',     // Vite integration
    FusesPlugin                        // Security hardening
  ]
}
```

### Build Commands

```bash
npm start          # Development with HMR
npm run package    # Package app
npm run make       # Create installers
npm run typecheck  # TypeScript validation
```

### Build Artifacts

| Artifact | Size | Location |
|----------|------|----------|
| Squirrel installer | 211 MB | `out/make/squirrel.windows/x64/` |
| ZIP portable | 219 MB | `out/make/zip/win32/x64/` |
| NuGet package | 211 MB | `out/make/squirrel.windows/x64/` |

---

## 9. Current State

### Completed Phases (All 9)

1. **Baseline Preservation** - Git setup, initial structure
2. **IPC Bridge Alignment** - Channel registry, allowlists
3. **Backend Module Bundling** - CommonJS backends (.cjs)
4. **TypeScript Error Resolution** - Zero compilation errors
5. **Native Module Restoration** - sqlite3, serialport, cap
6. **Module Integration Testing** - All 11 modules verified
7. **Enterprise Integration** - ErrorBoundary, EventBus, HealthMonitor
8. **Performance Optimization** - Prefetching, chunk splitting
9. **Production Build** - Installers created

### Known Limitations

1. **Native Modules**: Require rebuild for different Electron versions
2. **cap (libpcap)**: Requires Npcap on Windows, root on Linux
3. **better-sqlite3**: Requires native compilation
4. **Simulation Mode**: NinjaShark runs in simulation without cap

### Environment Variables

```ini
# AI Providers
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_APPLICATION_CREDENTIALS=/path/to/creds.json

# Microsoft
AZURE_CLIENT_ID=...
AZURE_TENANT_ID=...
AZURE_CLIENT_SECRET=...

# ConnectWise
CONNECTWISE_API_URL=...
CONNECTWISE_COMPANY_ID=...
CONNECTWISE_PUBLIC_KEY=...
CONNECTWISE_PRIVATE_KEY=...

# App
PORT=3001
NODE_ENV=production
```

---

## 10. Working with the Codebase

### Adding a New IPC Channel

1. **Add to preload.js allowlist**:
```javascript
const validInvokeChannels = [
  // ... existing
  'newmodule:action',
];
```

2. **Add handler in main.ts**:
```typescript
ipcMain.handle('newmodule:action', async (_event, args) => {
  // Implementation
  return { success: true, data: result };
});
```

3. **Call from renderer**:
```typescript
const result = await window.electronAPI.invoke('newmodule:action', args);
```

### Adding a New Module

1. Create directory structure:
```
src/modules/newmodule/
├── backend/
│   └── engine.cjs
├── components/
│   └── MainView.tsx
└── renderer/
    └── index.tsx
```

2. Add to module loading in main.ts
3. Add IPC handlers
4. Create page in src/pages/
5. Add route in App.tsx
6. Add to sidebar navigation

### Running Development

```bash
# Install dependencies
npm install --legacy-peer-deps

# Rebuild native modules
npm run rebuild

# Start development
npm start

# TypeScript validation
npm run typecheck
```

### Common Issues

**"Module not found" for native modules**:
- Run `npm run rebuild`
- Check Electron version matches native module build

**IPC channel blocked**:
- Add channel to appropriate allowlist in preload.js

**TypeScript errors**:
- Check type declarations in src/types/
- Run `npm run typecheck` for full validation

---

## Quick Reference

### Key Files to Edit for Common Tasks

| Task | File(s) |
|------|---------|
| Add IPC channel | `src/preload.js`, `src/main.ts` |
| Add new page/route | `src/pages/*.tsx`, `src/renderer/App.tsx` |
| Add backend logic | `src/modules/*/backend/*.cjs` |
| Modify UI components | `src/components/**/*.tsx` |
| Change styling | `src/renderer/index.css`, component classes |
| Modify build | `forge.config.cjs`, `vite.*.config.mjs` |
| Add dependencies | `package.json`, then rebuild |

### IPC Channel Naming Convention

```
module:action
```

Examples:
- `ninjashark:startCapture`
- `academy:getQuestion`
- `system:getHealth`

### Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Module swap | <100ms | ~50-80ms |
| Initial load | <3s | ~2.5s |
| Memory (prod) | <400MB | ~320MB |
| Animation CPU | <5% | <3% |

---

## Related Documents

- **Module-specific docs**: `docs/ai-context/modules/`
- **Integration map**: `docs/ai-context/INTEGRATION-MAP.md`
- **Debug journal**: `docs/DEBUGGING-JOURNAL.md`
- **Session memory**: `NINJA_TOOLKIT_SESSION_MEMORY.txt`

---

*This document is designed to be uploaded to AI assistants for comprehensive codebase understanding.*
