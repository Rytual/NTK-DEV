# Ninja Toolkit v11 - System Architecture

---

## Overview

Ninja Toolkit is an Electron-based desktop application designed for Managed Service Providers (MSPs). It provides a unified interface for network management, security scanning, Microsoft 365 administration, ticketing, and AI-assisted operations.

---

## Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Desktop Framework | Electron | 39.2.4 |
| UI Library | React | 19.2.0 |
| Language | TypeScript | 5.9.3 |
| Build Tool | Vite | 7.2.4 |
| Packaging | Electron Forge | 7.4.0 |
| Styling | Tailwind CSS | 4.0.17 |
| Animation | Framer Motion | 11.18.2 |
| Icons | Heroicons | 2.2.0 |
| AI (Anthropic) | @anthropic-ai/sdk | 0.68.0 |
| AI (OpenAI) | openai | 4.104.0 |
| SSH | ssh2 | 1.17.0 |
| Terminal UI | xterm | 5.3.0 |
| Charts | recharts | 2.15.4 |

---

## Application Architecture

### Three-Pane Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                        Window Title Bar                          │
│  Ninja Toolkit v11 - MSP Management Suite                       │
├──────────┬────────────────────────────────────┬─────────────────┤
│          │                                    │                 │
│  Blade   │         Content Router             │    KageChat     │
│   Nav    │                                    │                 │
│          │    (Module content area)           │   (AI Panel)    │
│  64px/   │                                    │                 │
│  240px   │    Lazy-loaded modules             │    400px        │
│          │    with Suspense                   │    (collapsible)│
│          │                                    │                 │
│          │                                    │                 │
├──────────┴────────────────────────────────────┴─────────────────┤
│                      Performance Indicator                       │
│                    MEM: XXmb  SWAP: XXms                         │
└─────────────────────────────────────────────────────────────────┘
```

### Process Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      MAIN PROCESS                                │
│                      (src/main.ts)                               │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Module      │  │ IPC         │  │ Window      │             │
│  │ Loaders     │  │ Handlers    │  │ Management  │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│         │                │                │                      │
│         └────────────────┼────────────────┘                      │
│                          │                                       │
│                    ┌─────┴─────┐                                │
│                    │  Preload  │                                │
│                    │  Bridge   │                                │
│                    └─────┬─────┘                                │
└──────────────────────────┼──────────────────────────────────────┘
                           │
                    contextBridge
                           │
┌──────────────────────────┼──────────────────────────────────────┐
│                          ▼                                       │
│                   RENDERER PROCESS                               │
│                   (src/renderer/)                                │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  BladeNav   │  │  Content    │  │  KageChat   │             │
│  │  Component  │  │  Router     │  │  Component  │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                          │                                       │
│                   ┌──────┴──────┐                               │
│                   │   Modules   │                               │
│                   │ (lazy load) │                               │
│                   └─────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
C:\Dev\NinjaToolKit-FinalMerge\
│
├── src/
│   ├── main.ts                 # Electron main process (892 lines)
│   ├── preload.js              # IPC bridge (202 lines)
│   ├── index.html              # Renderer entry HTML
│   │
│   ├── renderer/               # React application
│   │   ├── App.tsx             # Main app component
│   │   ├── main.tsx            # React bootstrap
│   │   └── index.css           # Base styles
│   │
│   ├── components/             # Shared UI components
│   │   ├── BladeNav/           # Left navigation
│   │   ├── ContentRouter/      # Module loader
│   │   ├── KageChat/           # AI chat panel
│   │   ├── Splash/             # Loading screen
│   │   └── modules/            # Placeholder module components
│   │
│   ├── backend/                # Core backend services
│   │   ├── server.js           # Express backend
│   │   ├── db-init.js          # SQLite initialization
│   │   └── mediaLoaderBridge.js # Media IPC handlers
│   │
│   ├── core/                   # Global systems
│   │   └── media/              # MediaLoader singleton
│   │
│   ├── modules/                # Full module implementations
│   │   ├── ninjashark/         # Network capture
│   │   ├── powershell/         # Terminal
│   │   ├── putty/              # SSH/Telnet
│   │   ├── auvik/              # Network mapping
│   │   ├── security/           # Vulnerability scanning
│   │   ├── msadmin/            # Microsoft 365
│   │   ├── kageforge/          # AI providers
│   │   ├── ticketing/          # ConnectWise
│   │   └── academy/            # Training
│   │
│   └── types/                  # TypeScript definitions
│       └── global.d.ts
│
├── art/                        # User media assets
│   ├── images/
│   └── videos/
│
├── assets/                     # Application assets
│   └── icons/
│
├── build/                      # Build configurations
│   ├── installer.nsi           # NSIS installer
│   └── *.json                  # Build reports
│
├── scripts/                    # Build/test scripts
│   ├── ram-audit.cjs
│   ├── security-audit.cjs
│   └── beta-test.cjs
│
├── docs/                       # Documentation
│   ├── SESSION-LOG-*.md
│   ├── ARCHITECTURE.md
│   ├── MODULE-STATUS.md
│   └── DEBUGGING-JOURNAL.md
│
└── [Configuration Files]
    ├── package.json
    ├── forge.config.cjs
    ├── vite.main.config.mjs
    ├── vite.preload.config.mjs
    ├── vite.renderer.config.mjs
    ├── tailwind.config.js
    ├── tsconfig.json
    └── electron-builder.yml
```

---

## IPC Communication

### Channel Categories

The preload script defines three categories of IPC channels:

#### Invoke Channels (Request/Response)
```javascript
// MediaLoader
'media:getRandomImage'
'media:getRandomVideo'
'media:getRandomImages'
'media:getStats'
'media:getAllMedia'
'media:reload'

// KageChat
'kage:sendMessage'
'kage:setContext'
'kage:getProviders'

// System
'system:getModuleStates'
'system:getVersion'
'system:getPlatform'

// Per-module channels (40+ total)
'ninjashark:*', 'powershell:*', 'putty:*', 'auvik:*',
'security:*', 'msadmin:*', 'kageforge:*', 'ticketing:*', 'academy:*'
```

#### Send Channels (Fire and Forget)
```javascript
'app:ready'
'module:navigate'
'kage:clearHistory'
```

#### Receive Channels (Event Listeners)
```javascript
'media:reload'
'hotkey:kageChat'
'hotkey:module'
'menu:settings'
'kage:response'
'ninjashark:packet'
'powershell:output'
'putty:data'
// ... etc
```

---

## Module Architecture

Each module follows a consistent structure:

```
src/modules/{module-name}/
├── backend/                # Main process code
│   ├── {feature}-engine.js
│   └── {feature}-handler.js
├── components/             # React components (if complex)
│   └── *.tsx
├── renderer/               # Renderer entry (if standalone)
│   └── index.tsx
├── types/                  # TypeScript definitions
│   └── index.ts
└── index.tsx               # Module entry component
```

### Module Loading Flow

```
1. User clicks module in BladeNav
   │
2. BladeNav calls onModuleChange(moduleId)
   │
3. App.tsx updates activeModule state with useTransition
   │
4. ContentRouter receives new activeModule prop
   │
5. ContentRouter's switch statement matches moduleId
   │
6. React.lazy() triggers dynamic import
   │
7. Suspense shows ShurikenLoader while loading
   │
8. Module component renders in content area
```

---

## Build System

### Vite Configuration

Three separate Vite configs handle different build targets:

| Config | Target | Output |
|--------|--------|--------|
| `vite.main.config.mjs` | Main process | `.vite/build/main.cjs` |
| `vite.preload.config.mjs` | Preload script | `.vite/build/preload.cjs` |
| `vite.renderer.config.mjs` | Renderer (React) | Dev server / dist |

### Electron Forge

Configured in `forge.config.cjs`:
- **Makers**: Squirrel.Windows, ZIP, DEB, RPM
- **Plugins**: Vite plugin for build integration

---

## Styling System

### Tailwind CSS v4

Custom theme defined in `tailwind.config.js`:

```javascript
colors: {
  'ninja-gray': '#0a0e27',    // Primary background
  'shadow-gray': '#1a1f3a',   // Secondary background
  'emerald': { 50-900 }       // Accent color palette
}

fontFamily: {
  sans: ['Inter', ...],
  mono: ['Fira Code', ...]
}

boxShadow: {
  'ninja': '0 0 20px rgba(16, 185, 129, 0.3)',
  'ninja-lg': '0 0 40px rgba(16, 185, 129, 0.4)'
}

animation: {
  'shuriken': 'spin 1.2s linear infinite',
  'pulse-emerald': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
}
```

### CSS Variables

Defined in `src/renderer/index.css`:
```css
:root {
  --ninja-gray: #0a0e27;
  --shadow-gray: #1a1f3a;
  --emerald-500: #10b981;
  --emerald-600: #059669;
}
```

---

## Data Flow

### AI Query Flow (KageChat)

```
User Input
    │
    ▼
KageChat.tsx
    │
    ▼ window.electronAPI.invoke('kage-query', {...})
    │
Preload Bridge
    │
    ▼ ipcRenderer.invoke('kage-query', {...})
    │
Main Process (main.ts)
    │
    ▼ ipcMain.handle('kage-query', ...)
    │
Backend Service
    │
    ▼ Anthropic/OpenAI API call
    │
Response
    │
    ▼ Return through IPC chain
    │
KageChat.tsx renders response
```

### Module State Flow

```
BladeNav (click)
    │
    ▼ onModuleChange(moduleId)
    │
App.tsx
    │
    ▼ startTransition(() => setActiveModule(moduleId))
    │
ContentRouter
    │
    ▼ Lazy import matching module
    │
Module Component renders
```

---

## Security Model

### Context Isolation
- `contextIsolation: true` in BrowserWindow
- Preload script uses `contextBridge` to expose limited API

### Channel Whitelisting
- Only pre-defined channels allowed through IPC
- Unauthorized channels are blocked and logged

### Content Security Policy
```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self';
               style-src 'self' 'unsafe-inline'">
```

---

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Module swap time | <100ms | ~40-80ms |
| Memory usage | <500MB | ~15MB (shell only) |
| Animation CPU | <5% | Untested |
| Initial load | <3s | ~3.5s |

---

*Architecture document for Ninja Toolkit v11*
*Last updated: 2025-11-28*
