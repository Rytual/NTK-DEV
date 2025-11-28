# Development Roadmap

## Overview

This document outlines the sequential debugging and completion roadmap for Ninja Toolkit v11. Each phase builds upon the previous, ensuring a stable foundation before adding complexity.

---

## Phase 1: Foundation (CURRENT)

**Objective**: Establish clean project structure and documentation

### Tasks

| # | Task | Status |
|---|------|--------|
| 1.1 | Archive old tar.gz files to separate location | PENDING |
| 1.2 | Verify NinjaToolKit-FinalMerge is single source of truth | COMPLETE |
| 1.3 | Create CLAUDE.md continuity file | COMPLETE |
| 1.4 | Create enterprise README.md | COMPLETE |
| 1.5 | Create Module Dependency Matrix | COMPLETE |
| 1.6 | Create Development Roadmap (this file) | COMPLETE |
| 1.7 | Commit Phase 1 documentation | PENDING |
| 1.8 | Push to GitHub | PENDING |

### Deliverables
- Clean repository with professional documentation
- Clear roadmap for subsequent phases
- All changes committed and pushed

---

## Phase 2: IPC Bridge Alignment

**Objective**: Fix the mismatch between preload.js and component expectations

### Background
- `preload.js` exposes `window.electron.ipcRenderer`
- Components use `window.electronAPI.invoke`
- This mismatch causes runtime errors

### Tasks

| # | Task | Status |
|---|------|--------|
| 2.1 | Audit all IPC calls in components | PENDING |
| 2.2 | Document expected IPC interface | PENDING |
| 2.3 | Update preload.js to expose consistent API | PENDING |
| 2.4 | Update TypeScript definitions | PENDING |
| 2.5 | Test IPC communication | PENDING |
| 2.6 | Commit Phase 2 changes | PENDING |

### Deliverables
- Consistent IPC API across application
- TypeScript definitions matching runtime API
- Working communication between renderer and main

---

## Phase 3: Core System Verification

**Objective**: Verify core systems work before module debugging

### Priority Order (No Native Dependencies)
1. MediaLoader
2. Express Backend
3. Database (with fallback)

### Tasks

| # | Task | Status |
|---|------|--------|
| 3.1 | Test MediaLoader IPC channels | PENDING |
| 3.2 | Verify fs.watch for art directories | PENDING |
| 3.3 | Test Express backend endpoints | PENDING |
| 3.4 | Implement database fallback (electron-store) | PENDING |
| 3.5 | Commit Phase 3 changes | PENDING |

### Deliverables
- Working MediaLoader with image/video rotation
- Express backend serving API requests
- Persistence layer (SQLite or fallback)

---

## Phase 4: Module Backend Bundling

**Objective**: Configure Vite to bundle backend modules

### Background
Vite bundles `main.ts` but doesn't include backend module files.
All `require('./modules/...')` fail at runtime.

### Tasks

| # | Task | Status |
|---|------|--------|
| 4.1 | Analyze current Vite main config | PENDING |
| 4.2 | Configure Vite to bundle backend modules | PENDING |
| 4.3 | Test module loading in main.ts | PENDING |
| 4.4 | Add graceful fallbacks for missing modules | PENDING |
| 4.5 | Commit Phase 4 changes | PENDING |

### Options
1. Bundle inline with rollup config
2. Copy to build output directory
3. Use absolute paths resolved at runtime

### Deliverables
- All backend modules accessible at runtime
- Graceful fallbacks for modules with missing native deps

---

## Phase 5: Module-by-Module Verification

**Objective**: Verify each module works end-to-end

### Module Order (Based on Dependencies)

#### Tier 1: No Native Dependencies
| Module | Tasks |
|--------|-------|
| MediaLoader | Verify IPC, test image rotation |
| Security | Verify scanner, test UI integration |
| PuTTY | Verify ssh2 connection, test terminal |
| MSAdmin | Verify MSAL auth flow, test Graph calls |
| KageForge | Verify AI providers, test token tracking |
| Ticketing | Verify ConnectWise API, test ticket list |

#### Tier 2: Depends on Tier 1
| Module | Tasks |
|--------|-------|
| KageChat | Verify KageForge integration, test queries |

#### Tier 3: Requires Native Modules
| Module | Native Dep | Alternative |
|--------|------------|-------------|
| Academy | better-sqlite3 | electron-store fallback |
| NetworkMap | snmp-native | API-only mode |
| PowerShell | node-pty | child_process fallback |
| NinjaShark | cap | PCAP file analysis only |

### Tasks

| # | Task | Status |
|---|------|--------|
| 5.1 | MediaLoader: Full verification | PENDING |
| 5.2 | Security: Backend + Frontend test | PENDING |
| 5.3 | PuTTY: SSH connection test | PENDING |
| 5.4 | MSAdmin: Auth flow test | PENDING |
| 5.5 | KageForge: Provider test | PENDING |
| 5.6 | Ticketing: API integration test | PENDING |
| 5.7 | KageChat: Full integration test | PENDING |
| 5.8 | Academy: With fallback | PENDING |
| 5.9 | NetworkMap: API mode test | PENDING |
| 5.10 | PowerShell: Fallback mode test | PENDING |
| 5.11 | NinjaShark: File analysis mode | PENDING |
| 5.12 | Commit Phase 5 changes | PENDING |

### Deliverables
- All Tier 1 modules fully functional
- Tier 2 modules working with dependencies
- Tier 3 modules with graceful fallbacks

---

## Phase 6: UI Integration

**Objective**: Connect new UI components to module backends

### Tasks

| # | Task | Status |
|---|------|--------|
| 6.1 | Connect Dashboard to real data | PENDING |
| 6.2 | Connect NinjaShark page to backend | PENDING |
| 6.3 | Connect PowerShell page to backend | PENDING |
| 6.4 | Connect RemoteAccess page to backend | PENDING |
| 6.5 | Connect NetworkMap page to backend | PENDING |
| 6.6 | Connect Security page to backend | PENDING |
| 6.7 | Connect Azure page to backend | PENDING |
| 6.8 | Connect AIManager page to backend | PENDING |
| 6.9 | Connect Ticketing page to backend | PENDING |
| 6.10 | Connect Academy page to backend | PENDING |
| 6.11 | Integrate ChatPanel with KageChat | PENDING |
| 6.12 | Commit Phase 6 changes | PENDING |

### Deliverables
- All page stubs replaced with functional UI
- Full data flow from backend to frontend

---

## Phase 7: Native Module Restoration

**Objective**: Restore native modules for full functionality

### Prerequisites
- Visual Studio Build Tools installed
- Platform SDK headers available

### Tasks

| # | Task | Status |
|---|------|--------|
| 7.1 | Install Visual Studio Build Tools | PENDING |
| 7.2 | Rebuild node-pty | PENDING |
| 7.3 | Rebuild better-sqlite3 | PENDING |
| 7.4 | Research cap alternatives | PENDING |
| 7.5 | Research snmp-native alternatives | PENDING |
| 7.6 | Update PowerShell to use node-pty | PENDING |
| 7.7 | Update Academy to use SQLite | PENDING |
| 7.8 | Commit Phase 7 changes | PENDING |

### Deliverables
- PowerShell with full PTY support
- Academy with SQLite persistence
- Documentation of native module requirements

---

## Phase 8: Testing and Quality

**Objective**: Ensure application stability and quality

### Tasks

| # | Task | Status |
|---|------|--------|
| 8.1 | TypeScript error cleanup | PENDING |
| 8.2 | ESLint error cleanup | PENDING |
| 8.3 | Performance testing | PENDING |
| 8.4 | Memory leak testing | PENDING |
| 8.5 | Cross-platform testing | PENDING |
| 8.6 | Commit Phase 8 changes | PENDING |

### Deliverables
- Zero TypeScript errors
- Zero ESLint errors
- Performance within targets

---

## Phase 9: Production Build

**Objective**: Create production-ready installers

### Tasks

| # | Task | Status |
|---|------|--------|
| 9.1 | Update electron-builder config | PENDING |
| 9.2 | Configure code signing | PENDING |
| 9.3 | Build Windows installer | PENDING |
| 9.4 | Build macOS installer | PENDING |
| 9.5 | Build Linux packages | PENDING |
| 9.6 | Test silent installation | PENDING |
| 9.7 | Test auto-updater | PENDING |
| 9.8 | Final release tagging | PENDING |

### Deliverables
- Signed installers for all platforms
- Working auto-update mechanism
- Tagged release in GitHub

---

## Progress Tracking

### Phase Completion Status

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 1: Foundation | IN PROGRESS | 75% |
| Phase 2: IPC Bridge | NOT STARTED | 0% |
| Phase 3: Core Systems | NOT STARTED | 0% |
| Phase 4: Backend Bundling | NOT STARTED | 0% |
| Phase 5: Module Verification | NOT STARTED | 0% |
| Phase 6: UI Integration | NOT STARTED | 0% |
| Phase 7: Native Modules | NOT STARTED | 0% |
| Phase 8: Testing | NOT STARTED | 0% |
| Phase 9: Production | NOT STARTED | 0% |

### Git Branch Strategy

| Phase | Branch |
|-------|--------|
| Phase 1 | `feature/ui-rebuild` |
| Phase 2 | `feature/ipc-alignment` |
| Phase 3 | `feature/core-systems` |
| Phase 4 | `feature/backend-bundling` |
| Phase 5-6 | `feature/module-integration` |
| Phase 7 | `feature/native-modules` |
| Phase 8-9 | `release/v11.0.0` |

---

## Notes

### Commit Convention
All commits follow conventional commit format:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation
- `refactor:` Code refactoring
- `test:` Testing
- `chore:` Maintenance

### Documentation Updates
Update relevant documentation after each phase:
- `docs/DEBUGGING-JOURNAL.md` - Issue tracking
- `docs/SESSION-LOG-*.md` - Session notes
- `docs/MODULE-STATUS.md` - Module status

---

*Last updated: 2025-11-28*
