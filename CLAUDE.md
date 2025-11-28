# Ninja Toolkit v11 - Development Continuity Guide

## Project Overview

Ninja Toolkit is an enterprise MSP (Managed Service Provider) management suite built on Electron + React + TypeScript. It integrates 11 specialized modules into a unified 3-pane desktop application for IT infrastructure management, security monitoring, and automation.

## Quick Reference

| Attribute | Value |
|-----------|-------|
| Version | 11.0.0 |
| Platform | Windows (primary), macOS, Linux |
| Runtime | Node.js 24.x, Electron 39.2.4 |
| UI Framework | React 19.2.0, TypeScript 5.9.3 |
| Build System | Vite 7.2.4, Electron Forge 7.4.0 |
| Styling | Tailwind CSS 4.0.17 (OKLCH color system) |

## Architecture

### 3-Pane Layout
```
+------------------+------------------------+------------------+
|    BladeNav      |    ContentRouter       |    KageChat      |
|   (Left Nav)     |    (Module Content)    |   (AI Panel)     |
|   Collapsible    |    React Router        |   Collapsible    |
|    64px/240px    |    Lazy Loading        |    320px         |
+------------------+------------------------+------------------+
|                      StatusBar                               |
+--------------------------------------------------------------+
```

### Module Registry (11 Total)

| # | Module | Prompt | Purpose | Backend Dependencies |
|---|--------|--------|---------|---------------------|
| 1 | NinjaShark | 2 | Network packet capture/analysis | cap (native), libpcap |
| 2 | PowerShell | 3 | Terminal emulation | node-pty (native) |
| 3 | PuTTY/RemoteAccess | 4 | SSH/Telnet client | ssh2 |
| 4 | Auvik/NetworkMap | 5 | Infrastructure monitoring | - |
| 5 | Security | 6 | Vulnerability scanning | - |
| 6 | MSAdmin | 7 | Microsoft 365/Azure admin | @azure/msal-node |
| 7 | KageForge | 8 | AI provider management | openai, @anthropic-ai/sdk |
| 8 | Ticketing | 9 | ConnectWise integration | - |
| 9 | Academy | 10 | Training platform | - |
| 10 | MediaLoader | 1 (v4) | Global media system | fs.watch |
| 11 | KageChat | 1 | AI assistant | Depends on KageForge |

### Directory Structure

```
src/
├── main.ts                 # Electron main process, module orchestration
├── preload.js              # IPC bridge (contextBridge)
├── renderer/
│   ├── App.tsx             # Main React application
│   ├── index.css           # Tailwind CSS with @theme
│   └── main.tsx            # React entry point
├── components/
│   ├── ui/                 # Reusable UI components (Button, Card, etc.)
│   └── layout/             # Layout components (Sidebar, TopBar, etc.)
├── pages/                  # Route page components
├── contexts/               # React contexts (Theme, etc.)
├── modules/                # Feature modules
│   ├── academy/
│   ├── auvik/
│   ├── kageforge/
│   ├── msadmin/
│   ├── ninjashark/
│   ├── powershell/
│   ├── putty/
│   ├── security/
│   └── ticketing/
├── backend/                # Express server, database
├── core/                   # Shared systems (MediaLoader)
├── lib/                    # Utilities
└── types/                  # TypeScript definitions
```

## Development Commands

```bash
# Development
npm start                   # Launch Electron in dev mode
npm run dev                 # Alias for npm start
npm run backend             # Start Express backend server (port 3001)

# Build
npm run package             # Package Electron app
npm run make                # Create installers

# Quality
npm run typecheck           # TypeScript type checking
npm run lint                # ESLint
npm run test:env            # Verify environment
```

## Current Development State

### Branch: `feature/ui-rebuild`

**Completed:**
- Tailwind CSS v4 migration with OKLCH color system
- UI component library (Button, Card, Input, Badge, etc.)
- Layout system (Sidebar, TopBar, StatusBar, ChatPanel)
- React Router navigation with 10 page stubs
- Dark/light theme support

**Open Issues:**
1. IPC API mismatch: `window.electron` vs `window.electronAPI`
2. Backend modules not bundled by Vite
3. Native modules removed (node-pty, cap, better-sqlite3)
4. TypeScript errors in Academy, KageForge modules

## IPC Channel Reference

### Exposed via preload.js (`window.electron`)
```typescript
// Renderer to Main
ipcRenderer.invoke(channel, ...args)
ipcRenderer.send(channel, ...args)
ipcRenderer.on(channel, listener)

// Channels:
'kage-query'              // AI queries
'media:getRandomImage'    // MediaLoader
'media:getRandomVideo'    // MediaLoader
'media:getStats'          // MediaLoader
'shell:create'            // PowerShell
'shell:input'             // PowerShell
'shell:resize'            // PowerShell
'ssh:connect'             // PuTTY
'ssh:disconnect'          // PuTTY
// ... more in preload.js
```

## Build Sequence (Original Prompts)

The application was built sequentially:

1. **Prompt 0**: Base Electron + Vite scaffold
2. **Prompt 1 (v4)**: 3-Pane shell + MediaLoader (33MB)
3. **Prompt 2**: NinjaShark module
4. **Prompt 3**: PowerShell module
5. **Prompt 4**: PuTTY/RemoteAccess module
6. **Prompt 5**: Auvik/NetworkMap module
7. **Prompt 6**: Security module
8. **Prompt 7**: MSAdmin module
9. **Prompt 8**: KageForge module
10. **Prompt 9**: Ticketing module
11. **Prompt 10**: Academy module
12. **Prompt 11**: Integration (wired all modules)
13. **Prompt 12**: Deployment (installer, updater)

## Debugging Approach

When debugging, follow this sequence:

1. **Backend first**: Ensure main.ts loads modules correctly
2. **IPC bridge**: Verify preload.js exposes correct channels
3. **Frontend last**: Connect UI to working backend

### Module Debugging Order
Debug modules in dependency order:
1. Core systems (MediaLoader, Database)
2. Independent modules (Security, NetworkMap, Academy)
3. Dependent modules (KageChat depends on KageForge)

## Environment Variables

```bash
# .env file
ANTHROPIC_API_KEY=sk-ant-...     # For KageForge/KageChat
OPENAI_API_KEY=sk-...            # For KageForge
AZURE_CLIENT_ID=...              # For MSAdmin
AZURE_TENANT_ID=...              # For MSAdmin
CONNECTWISE_API_URL=...          # For Ticketing
```

## Git Workflow

- **main/master**: Stable releases only
- **feature/***: Active development branches
- Commit messages: Use conventional commits (feat:, fix:, docs:, etc.)
- Always document changes in `docs/DEBUGGING-JOURNAL.md`

## Performance Targets

| Metric | Target |
|--------|--------|
| Module swap | < 100ms |
| Memory usage | < 500MB |
| Animation CPU | < 5% |
| Initial render | < 2s |

## Contact / Resources

- Repository: https://github.com/Rytual/NTK-DEV
- Documentation: `docs/` directory
- Session logs: `docs/SESSION-LOG-*.md`
- Debug journal: `docs/DEBUGGING-JOURNAL.md`
