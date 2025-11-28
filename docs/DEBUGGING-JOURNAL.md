# Ninja Toolkit v11 - Debugging Journal

---

## Purpose

This document tracks all debugging efforts chronologically. Each entry includes:
- Timestamp
- Issue description
- Root cause analysis
- Solution applied
- Result
- Commit reference (if applicable)

---

## Journal Entries

### Entry 001 - Initial State Assessment
**Date:** 2025-11-28
**Time:** ~09:00 EST
**Author:** Claude (Opus 4.5) + User

**Issue:** Application needs baseline preservation before debugging

**Actions Taken:**
1. Launched application with `npm start`
2. Captured screenshots of current visual state
3. Documented all console errors
4. Created STATUS-REPORT-2025-11-28.md
5. Initialized Git repository
6. Pushed to GitHub

**Result:** Baseline established at commit `16bcafb`

**Commit:** `16bcafb` - Initial commit: Ninja Toolkit v11.0.0 - State Preservation [2025-11-28T09:20:00]

---

### Entry 002 - Native Module Build Failures
**Date:** 2025-11-28
**Time:** ~08:30 EST

**Issue:** `npm install` fails due to native module compilation errors

**Root Cause:**
- `node-pty` requires `GetCommitHash.bat` in winpty submodule (missing)
- `better-sqlite3` requires Visual Studio build tools
- `cap` requires libpcap development headers
- `serialport` requires native compilation
- `snmp-native` requires native compilation

**Solution Applied:**
Removed native modules from package.json:
```json
// REMOVED:
"better-sqlite3": "^11.5.0",
"cap": "^0.2.1",
"node-pty": "^1.0.0",
"serialport": "^12.0.0",
"snmp-native": "^1.2.0"
```

**Result:** `npm install` completes successfully. Application launches. Affected features have graceful fallbacks in main.ts.

**Trade-offs:**
- PowerShell terminal non-functional
- Packet capture non-functional
- Serial port connections non-functional
- SNMP discovery non-functional
- SQLite persistence non-functional

**Future Fix:** Research electron-rebuild or pure-JS alternatives

---

### Entry 003 - ESM/CJS Configuration Conflict
**Date:** 2025-11-28
**Time:** ~08:45 EST

**Issue:** `npm start` fails with "require is not defined in ES module scope"

**Root Cause:**
- `package.json` has `"type": "module"` (ESM)
- `forge.config.js` uses `require()` (CommonJS)
- Node.js treats `.js` files as ESM due to package.json setting

**Solution Applied:**
1. Renamed `forge.config.js` to `forge.config.cjs`
2. Updated `vite.main.config.mjs` to output `.cjs` extension
3. Updated `vite.preload.config.mjs` to output `.cjs` extension
4. Updated `package.json` main entry to `.vite/build/main.cjs`
5. Updated `main.ts` preload path to `preload.cjs`

**Result:** Application builds and launches successfully

---

### Entry 004 - Electron Forge Plugin Conflicts
**Date:** 2025-11-28
**Time:** ~08:50 EST

**Issue:** `npm start` fails with plugin conflict error

**Root Cause:**
- `FusesPlugin` and `auto-unpack-natives` conflict with Vite plugin
- These plugins try to modify the start command

**Solution Applied:**
Removed from `forge.config.cjs`:
```javascript
// REMOVED:
{
  name: '@electron-forge/plugin-auto-unpack-natives',
  config: {},
},
new FusesPlugin({...})
```

**Result:** Application starts in dev mode

**Note:** These plugins should be re-added for production builds

---

### Entry 005 - UI Layout Issues (FIXED)
**Date:** 2025-11-28
**Time:** ~09:19 EST (identified) / ~14:00 EST (fixed)

**Issue:** UI renders but layout is broken
- Sidebar items stacked vertically instead of contained
- Main content area completely empty
- Tailwind custom classes may not be loading

**Root Cause Analysis:**
1. Tailwind CSS v4 uses new import syntax `@import 'tailwindcss'`
2. Tailwind v4 requires `@tailwindcss/postcss` package (not direct plugin)
3. Tailwind v4 requires `@theme` block for custom CSS properties (OKLCH format)
4. Old Tailwind v3 syntax (`tailwind.config.js` colors) not read by v4

**Solution Applied:**
1. Installed `@tailwindcss/postcss` package
2. Updated `vite.renderer.config.mjs` to use `import tailwindcss from '@tailwindcss/postcss'`
3. Rewrote `src/renderer/index.css` with `@theme` block using OKLCH colors
4. Added `.dark` class overrides for dark theme
5. Created new UI component library with Tailwind v4 syntax
6. Created new layout components (Sidebar, TopBar, StatusBar, ChatPanel)
7. Created 10 module page components

**Result:** ✅ FIXED - Application compiles and renders correctly

**Commit:** `b428359` on `feature/ui-rebuild` branch

---

### Entry 006 - IPC API Mismatch (OPEN)
**Date:** 2025-11-28
**Time:** ~09:30 EST

**Issue:** KageChat component uses wrong IPC API

**Root Cause:**
- `preload.js` exposes: `window.electron.ipcRenderer`
- `KageChat.tsx` uses: `window.electronAPI.invoke`
- These are different APIs - mismatch causes undefined errors

**Evidence:**
```javascript
// preload.js line 125
contextBridge.exposeInMainWorld('electron', {...})

// KageChat.tsx line 141
const response = await window.electronAPI.invoke('kage-query', {...})
```

**Status:** NOT FIXED - Requires code change

**Proposed Fix:**
Change KageChat.tsx to use `window.electron.ipcRenderer.invoke()`

---

### Entry 007 - Backend Modules Not Bundled (OPEN)
**Date:** 2025-11-28
**Time:** ~09:20 EST

**Issue:** All backend module imports fail at runtime

**Console Errors:**
```
[Main] MediaLoader bridge failed to load: Cannot find module './backend/mediaLoaderBridge'
[Main] Database module failed to load: Cannot find module './backend/db-init'
[Main] NinjaShark capture engine failed to load: Cannot find module './modules/ninjashark/backend/capture-engine'
... (8 more similar errors)
```

**Root Cause:**
- Vite bundles `main.ts` into `.vite/build/main.cjs`
- Backend modules are not included in the bundle
- `require()` paths are relative to bundle location, not source

**Status:** NOT FIXED - Requires Vite configuration

**Proposed Fix:**
Configure `vite.main.config.mjs` to:
1. Bundle backend modules inline, OR
2. Copy backend modules to build output, OR
3. Use absolute paths resolved at runtime

---

### Entry 008 - TypeScript Compilation Errors (OPEN)
**Date:** 2025-11-28
**Time:** ~08:20 EST

**Issue:** TypeScript reports errors in module files

**Errors:**
```
src/modules/academy/renderer/app.jsx(95,43): error TS17001: JSX elements cannot have multiple attributes with the same name.
src/modules/kageforge/components/App.tsx(7,10): error TS2595: 'ProviderRouter' can only be imported by using a default import.
src/modules/kageforge/components/App.tsx(8,10): error TS2595: 'TokenTracker' can only be imported by using a default import.
```

**Status:** NOT FIXED - Requires code correction

**Impact:** Build succeeds (Vite ignores TS errors by default) but modules may fail at runtime

---

### Entry 009 - Comprehensive Scope Analysis
**Date:** 2025-11-28
**Time:** ~16:00 EST

**Issue:** Development understanding incomplete - needed full project scope review

**Root Cause:**
- Original 13 prompts (prompt0-12.txt) contain critical specifications not captured in initial assessment
- Project has deep architectural requirements beyond "11 separate modules"

**Solution Applied:**
Complete review of all original specifications:

1. **Prompts Reviewed:**
   - prompt0.txt: Environment setup, Node 24.x, dependency versions
   - prompt1.txt: 3-Pane architecture, KageChat, Splash, MediaLoader
   - promtp2.txt: NinjaShark packet capture and analysis
   - prompt3.txt: PowerShell terminal with AI tagging
   - prompt4.txt: PuTTY/Remote Access with macros and stealth
   - prompt5.txt: Auvik/Network Map with 3D visualization
   - prompt6.txt: Security Suite with compliance frameworks
   - prompt7.txt: MS Admin with Azure canvas and pricing
   - prompt8.txt: KageForge AI provider management
   - prompt9.txt: Ticketing ConnectWise integration
   - prompt10.txt: Academy gamified training platform
   - prompt11.txt: Cross-module integration and chains
   - prompt12.txt: Deployment, installer, and polish

2. **Critical Discoveries:**

   **A. Feudal Japanese Theme Identity**
   - NOT just "dark mode" - deliberate aesthetic identity
   - Emerald #00ff88 glows, ninja-gray backgrounds
   - Shuriken spin animations (<5% CPU target)
   - Pagoda VM icons, torii gateway nodes
   - Haiku-style tooltips via AI extended thinking
   - Genin->Chunin->Jonin rank progression

   **B. Cross-Module Integration Chains**
   - Security Remediation: NinjaShark anomaly -> Security alert -> Auvik topo -> PuTTY fix -> Ticketing draft
   - Azure Reporting: CSV pricing -> MS Admin calculate -> PowerShell script -> PDF report -> Outlook email
   - Training Content: NinjaShark hex analysis -> Academy PBQ generation
   - Diagnostic Flow: Ticketing ticket -> PowerShell diag scripts -> Log collection -> Draft response

   **C. Native Modules Are Core (Not Optional)**
   | Module | Native Dep | Purpose | Impact |
   |--------|------------|---------|--------|
   | NinjaShark | cap | libpcap capture | No live capture |
   | PowerShell | node-pty | PTY spawning | No terminal |
   | PuTTY | serialport | Serial console | No serial |
   | NetworkMap | snmp-native | SNMP discovery | No SNMP |
   | Academy | better-sqlite3 | Progress persistence | No saving |
   | All | keytar | Credential storage | No secure creds |

   **D. AI (Kage) Is Central Orchestrator**
   - Script tagging for PowerShell
   - Quiz generation for Academy
   - Error analysis for terminals
   - Anomaly detection for NinjaShark
   - Remediation flow orchestration
   - Self-configuration via KageForge

   **E. Performance Specifications**
   | Metric | Target |
   |--------|--------|
   | Module swap | <100ms |
   | RAM usage | <500MB dev, <400MB prod |
   | Animation CPU | <5% |
   | 3D rendering | 30fps |
   | Virtual scrolling | 100k packets |
   | Echo latency | <100ms |

   **F. Enterprise Compliance (Security Module)**
   - PCI-DSS v4.0 (78+ sub-requirements)
   - HIPAA Security Rule
   - ISO 27001:2022 (93 controls)
   - SOC 2 Trust Service Criteria
   - GDPR Article 32
   - CIS Controls v8 (18 controls)
   - NIST Cybersecurity Framework

**Result:** Understanding updated. Roadmap implications identified for all phases.

**Commit:** Pending (this session)

---

## Open Issues Summary

| # | Issue | Priority | Status |
|---|-------|----------|--------|
| 005 | UI Layout Issues | HIGH | ✅ FIXED |
| 006 | IPC API Mismatch | HIGH | OPEN |
| 007 | Backend Modules Not Bundled | HIGH | OPEN |
| 008 | TypeScript Compilation Errors | MEDIUM | OPEN |
| 009 | Native Modules Restoration | HIGH | OPEN (Documented) |

---

## Debugging Checklist

### Before Each Debug Session:
- [ ] Pull latest from GitHub
- [ ] Run `npm install --legacy-peer-deps`
- [ ] Clear `.vite/` cache if needed
- [ ] Note current commit hash

### After Each Fix:
- [ ] Test with `npm start`
- [ ] Document result in this journal
- [ ] Commit with descriptive message
- [ ] Push to GitHub

### Before Ending Session:
- [ ] Update this journal
- [ ] Update MODULE-STATUS.md if needed
- [ ] Commit all documentation
- [ ] Note next priorities

---

*Debugging journal for Ninja Toolkit v11*
*Last updated: 2025-11-28 ~17:00 EST*
