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

### Entry 005 - UI Layout Issues (OPEN)
**Date:** 2025-11-28
**Time:** ~09:19 EST

**Issue:** UI renders but layout is broken
- Sidebar items stacked vertically instead of contained
- Main content area completely empty
- Tailwind custom classes may not be loading

**Root Cause Analysis (Pending):**
1. Tailwind CSS v4 uses new import syntax `@import 'tailwindcss'`
2. PostCSS may not be processing correctly with Vite
3. Custom classes `bg-ninja-gray`, `border-shadow-gray` may not compile

**Evidence:**
- Screenshots show icons and text rendered but no layout structure
- Performance indicator (MEM/SWAP) renders in top-left
- Background color appears correct (dark)

**Status:** NOT FIXED - Requires debugging

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

## Open Issues Summary

| # | Issue | Priority | Status |
|---|-------|----------|--------|
| 005 | UI Layout Issues | HIGH | OPEN |
| 006 | IPC API Mismatch | HIGH | OPEN |
| 007 | Backend Modules Not Bundled | HIGH | OPEN |
| 008 | TypeScript Compilation Errors | MEDIUM | OPEN |

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
*Last updated: 2025-11-28*
