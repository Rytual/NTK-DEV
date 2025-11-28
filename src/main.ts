/**
 * Ninja Toolkit v11 - Main Electron Process
 * Complete 11-Module Integration with Global MediaLoader and KageChat
 *
 * This file initializes the Electron application and wires all modules via IPC.
 * Native modules are loaded with graceful fallbacks for development flexibility.
 */

import { app, BrowserWindow, ipcMain, Menu, globalShortcut, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Handle Squirrel events for Windows installer
try {
  // @ts-ignore - CommonJS module
  const squirrelStartup = require('electron-squirrel-startup');
  if (squirrelStartup) {
    app.quit();
  }
} catch {
  // electron-squirrel-startup not available, continue
}

// Global window references
let mainWindow: BrowserWindow | null = null;

// Module status tracking
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

// ============================================================================
// NATIVE MODULE LOADING WITH GRACEFUL FALLBACKS
// ============================================================================

// Load MediaLoader Bridge
let mediaLoaderBridge: any = null;
try {
  mediaLoaderBridge = require('./backend/mediaLoaderBridge.cjs');
  moduleStatus.mediaLoader.loaded = true;
  console.log('[Main] MediaLoader bridge loaded');
} catch (error: any) {
  moduleStatus.mediaLoader.error = error.message;
  console.warn('[Main] MediaLoader bridge failed to load:', error.message);
}

// Load Database
let dbInit: any = null;
try {
  dbInit = require('./backend/db-init.cjs');
  moduleStatus.database.loaded = true;
  console.log('[Main] Database module loaded');
} catch (error: any) {
  moduleStatus.database.error = error.message;
  console.warn('[Main] Database module failed to load:', error.message);
}

// Load NinjaShark Capture Engine
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

// Load PowerShell Engine
let PowerShellEngine: any = null;
try {
  const psModule = require('./modules/powershell/backend/powershell-engine.cjs');
  PowerShellEngine = psModule.PowerShellEngine;
  moduleStatus.powershell.loaded = true;
  console.log('[Main] PowerShell engine loaded');
} catch (error: any) {
  moduleStatus.powershell.error = error.message;
  console.warn('[Main] PowerShell engine failed to load:', error.message);
}

// Load Remote Access Engine (PuTTY)
let RemoteAccessEngine: any = null;
try {
  const remoteModule = require('./modules/putty/backend/remote-access-engine.cjs');
  RemoteAccessEngine = remoteModule.RemoteAccessEngine;
  moduleStatus.putty.loaded = true;
  console.log('[Main] Remote Access engine loaded');
} catch (error: any) {
  moduleStatus.putty.error = error.message;
  console.warn('[Main] Remote Access engine failed to load:', error.message);
}

// Load Network Mapper (Auvik)
let NetworkMapper: any = null;
try {
  const networkModule = require('./modules/auvik/backend/network-mapper.cjs');
  NetworkMapper = networkModule.NetworkMapper || networkModule;
  moduleStatus.auvik.loaded = true;
  console.log('[Main] Network Mapper loaded');
} catch (error: any) {
  moduleStatus.auvik.error = error.message;
  console.warn('[Main] Network Mapper failed to load:', error.message);
}

// Load Security Scanner
let SecurityScanner: any = null;
try {
  const securityModule = require('./modules/security/backend/vulnerability-scanner.cjs');
  SecurityScanner = securityModule.VulnerabilityScanner || securityModule;
  moduleStatus.security.loaded = true;
  console.log('[Main] Security Scanner loaded');
} catch (error: any) {
  moduleStatus.security.error = error.message;
  console.warn('[Main] Security Scanner failed to load:', error.message);
}

// Load MS Admin modules
let MSAdminAuth: any = null;
try {
  MSAdminAuth = require('./modules/msadmin/backend/msal-auth.cjs');
  moduleStatus.msadmin.loaded = true;
  console.log('[Main] MS Admin auth loaded');
} catch (error: any) {
  moduleStatus.msadmin.error = error.message;
  console.warn('[Main] MS Admin auth failed to load:', error.message);
}

// Load KageForge Provider Router
let ProviderRouter: any = null;
try {
  const kageforgeModule = require('./modules/kageforge/backend/provider-router.cjs');
  ProviderRouter = kageforgeModule.ProviderRouter || kageforgeModule;
  moduleStatus.kageforge.loaded = true;
  console.log('[Main] KageForge provider router loaded');
} catch (error: any) {
  moduleStatus.kageforge.error = error.message;
  console.warn('[Main] KageForge provider router failed to load:', error.message);
}

// Load Ticketing Client
let TicketingClient: any = null;
try {
  const ticketingModule = require('./modules/ticketing/backend/connectwise-client.cjs');
  TicketingClient = ticketingModule.ConnectWiseClient || ticketingModule;
  moduleStatus.ticketing.loaded = true;
  console.log('[Main] Ticketing client loaded');
} catch (error: any) {
  moduleStatus.ticketing.error = error.message;
  console.warn('[Main] Ticketing client failed to load:', error.message);
}

// Load Academy (requires better-sqlite3)
let AcademyEngine: any = null;
try {
  const academyModule = require('./modules/academy/backend/engines/QuestionBank.cjs');
  AcademyEngine = academyModule.QuestionBank || academyModule;
  moduleStatus.academy.loaded = true;
  console.log('[Main] Academy engine loaded');
} catch (error: any) {
  moduleStatus.academy.error = error.message;
  console.warn('[Main] Academy engine failed to load:', error.message);
}

// ============================================================================
// MODULE INSTANCES
// ============================================================================

let captureEngine: any = null;
let powershellEngine: any = null;
let remoteAccessEngine: any = null;
let networkMapper: any = null;
let securityScanner: any = null;
let providerRouter: any = null;
let ticketingClient: any = null;
let academyEngine: any = null;

// ============================================================================
// WINDOW CREATION
// ============================================================================

function createWindow(): void {
  // Determine preload path based on environment
  const preloadPath = path.join(__dirname, 'preload.cjs');

  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    backgroundColor: '#0a0e27',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
    title: 'Ninja Toolkit v11',
    show: false, // Show after ready
  });

  // Load the app
  // In development, Forge serves the renderer via Vite dev server
  // In production, load from the built files
  if (process.env.NODE_ENV === 'development' || process.env.VITE_DEV_SERVER_URL) {
    const devUrl = process.env.MAIN_WINDOW_VITE_DEV_SERVER_URL || 'http://localhost:5173';
    mainWindow.loadURL(devUrl);
    mainWindow.webContents.openDevTools();
  } else {
    // Production - load from .vite/renderer
    mainWindow.loadFile(path.join(__dirname, '../renderer/main_window/index.html'));
  }

  // Show when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    console.log('[Main] Window ready and shown');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ============================================================================
// IPC HANDLER REGISTRATION
// ============================================================================

function registerIpcHandlers(): void {
  console.log('[Main] Registering IPC handlers...');

  // -------------------------------------------------------------------------
  // System Handlers
  // -------------------------------------------------------------------------

  ipcMain.handle('system:getModuleStates', async () => {
    return moduleStatus;
  });

  ipcMain.handle('system:getVersion', async () => {
    return {
      version: '11.0.0',
      electron: process.versions.electron,
      node: process.versions.node,
      chrome: process.versions.chrome,
    };
  });

  ipcMain.handle('system:getPlatform', async () => {
    return {
      platform: process.platform,
      arch: process.arch,
      cwd: process.cwd(),
    };
  });

  // -------------------------------------------------------------------------
  // KageChat / KageForge Handlers
  // -------------------------------------------------------------------------

  ipcMain.handle('kage:sendMessage', async (_event, message: string, context?: any) => {
    if (!moduleStatus.kageforge.loaded || !providerRouter) {
      return { error: 'KageForge not available', message: moduleStatus.kageforge.error };
    }
    try {
      const response = await providerRouter.route({ message, context });
      return response;
    } catch (error: any) {
      return { error: 'AI processing failed', message: error.message };
    }
  });

  ipcMain.handle('kage:setContext', async (_event, context: any) => {
    console.log('[KageChat] Context updated:', context?.module);
    return { success: true };
  });

  ipcMain.handle('kage:getProviders', async () => {
    return ['anthropic', 'openai', 'vertex', 'grok', 'copilot'];
  });

  // -------------------------------------------------------------------------
  // NinjaShark Handlers
  // -------------------------------------------------------------------------

  ipcMain.handle('ninjashark:startCapture', async (_event, options) => {
    if (!moduleStatus.ninjashark.loaded || !captureEngine) {
      return { success: false, error: moduleStatus.ninjashark.error || 'NinjaShark not available' };
    }
    try {
      const session = await captureEngine.startCapture(
        options.sessionId || `session-${Date.now()}`,
        options.interface,
        options.filter,
        (packet: any) => {
          mainWindow?.webContents.send('ninjashark:packet', packet);
        }
      );
      return { success: true, session };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('ninjashark:stopCapture', async (_event, sessionId) => {
    if (!captureEngine) {
      return { success: false, error: 'NinjaShark not available' };
    }
    try {
      await captureEngine.stopCapture(sessionId);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('ninjashark:getPackets', async (_event, filter) => {
    return []; // Packets are sent via events
  });

  ipcMain.handle('ninjashark:export', async (_event, format, packets) => {
    if (!captureEngine) {
      return { success: false, error: 'NinjaShark not available' };
    }
    try {
      const { filePath } = await dialog.showSaveDialog({
        defaultPath: `capture-${Date.now()}.${format}`,
        filters: [{ name: format.toUpperCase(), extensions: [format] }],
      });
      if (filePath) {
        // Export logic would go here
        return { success: true, path: filePath };
      }
      return { success: false, error: 'Export cancelled' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // -------------------------------------------------------------------------
  // PowerShell Handlers
  // -------------------------------------------------------------------------

  ipcMain.handle('powershell:execute', async (_event, command) => {
    if (!moduleStatus.powershell.loaded || !powershellEngine) {
      return { success: false, error: moduleStatus.powershell.error || 'PowerShell not available' };
    }
    try {
      // Get or create default session
      let sessions = powershellEngine.listSessions();
      if (sessions.length === 0) {
        await powershellEngine.createSession();
        sessions = powershellEngine.listSessions();
      }
      const result = await powershellEngine.executeCommand(sessions[0].id, command);
      return { success: true, ...result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('powershell:getHistory', async () => {
    if (!powershellEngine) return [];
    return powershellEngine.getHistory();
  });

  ipcMain.handle('powershell:createSession', async (_event, options) => {
    if (!moduleStatus.powershell.loaded || !powershellEngine) {
      return { success: false, error: moduleStatus.powershell.error || 'PowerShell not available' };
    }
    try {
      const session = await powershellEngine.createSession(options);
      return { success: true, ...session };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // -------------------------------------------------------------------------
  // PuTTY / Remote Access Handlers
  // -------------------------------------------------------------------------

  ipcMain.handle('putty:connect', async (_event, config) => {
    if (!moduleStatus.putty.loaded || !remoteAccessEngine) {
      return { success: false, error: moduleStatus.putty.error || 'Remote Access not available' };
    }
    try {
      await remoteAccessEngine.connect(config);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('putty:disconnect', async (_event, sessionId) => {
    if (!remoteAccessEngine) {
      return { success: false, error: 'Remote Access not available' };
    }
    try {
      await remoteAccessEngine.disconnect(sessionId);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('putty:send', async (_event, sessionId, data) => {
    if (!remoteAccessEngine) {
      return { success: false, error: 'Remote Access not available' };
    }
    try {
      remoteAccessEngine.send(sessionId, data);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('putty:getSessions', async () => {
    if (!remoteAccessEngine) return [];
    return remoteAccessEngine.getSessions ? remoteAccessEngine.getSessions() : [];
  });

  // -------------------------------------------------------------------------
  // Auvik / Network Handlers
  // -------------------------------------------------------------------------

  ipcMain.handle('auvik:scan', async (_event, range) => {
    if (!moduleStatus.auvik.loaded || !networkMapper) {
      return { success: false, error: moduleStatus.auvik.error || 'Network Mapper not available' };
    }
    try {
      const result = await networkMapper.scan(range);
      return { success: true, ...result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('auvik:getTopology', async () => {
    if (!networkMapper) return { nodes: [], edges: [] };
    return networkMapper.getTopology ? networkMapper.getTopology() : { nodes: [], edges: [] };
  });

  ipcMain.handle('auvik:snmpWalk', async (_event, target, community) => {
    if (!networkMapper) {
      return { success: false, error: 'Network Mapper not available' };
    }
    try {
      const result = await networkMapper.snmpWalk(target, community);
      return { success: true, ...result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // -------------------------------------------------------------------------
  // Security Handlers
  // -------------------------------------------------------------------------

  ipcMain.handle('security:scanTarget', async (_event, target) => {
    if (!moduleStatus.security.loaded || !securityScanner) {
      return { vulnerabilities: [], error: moduleStatus.security.error || 'Security Scanner not available' };
    }
    try {
      const result = await securityScanner.scan(target);
      return result;
    } catch (error: any) {
      return { vulnerabilities: [], error: error.message };
    }
  });

  ipcMain.handle('security:getThreats', async () => {
    if (!securityScanner) return [];
    return securityScanner.getThreats ? securityScanner.getThreats() : [];
  });

  ipcMain.handle('security:checkCompliance', async (_event, standard) => {
    if (!securityScanner) {
      return { compliant: false, error: 'Security Scanner not available' };
    }
    try {
      const result = await securityScanner.checkCompliance(standard);
      return result;
    } catch (error: any) {
      return { compliant: false, error: error.message };
    }
  });

  ipcMain.handle('security:getRiskScore', async (_event, asset) => {
    if (!securityScanner) return { score: 0, factors: [] };
    return securityScanner.getRiskScore ? securityScanner.getRiskScore(asset) : { score: 0, factors: [] };
  });

  // -------------------------------------------------------------------------
  // MS Admin Handlers
  // -------------------------------------------------------------------------

  ipcMain.handle('msadmin:authenticate', async (_event, config) => {
    if (!moduleStatus.msadmin.loaded || !MSAdminAuth) {
      return { success: false, error: moduleStatus.msadmin.error || 'MS Admin not available' };
    }
    try {
      const result = await MSAdminAuth.authenticate(config);
      return { success: true, ...result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('msadmin:getUsers', async () => {
    if (!MSAdminAuth) return [];
    return MSAdminAuth.getUsers ? MSAdminAuth.getUsers() : [];
  });

  ipcMain.handle('msadmin:getLicenses', async () => {
    if (!MSAdminAuth) return [];
    return MSAdminAuth.getLicenses ? MSAdminAuth.getLicenses() : [];
  });

  ipcMain.handle('msadmin:runScript', async (_event, script, targets) => {
    if (!MSAdminAuth) {
      return { success: false, error: 'MS Admin not available' };
    }
    try {
      const result = await MSAdminAuth.runScript(script, targets);
      return { success: true, ...result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // -------------------------------------------------------------------------
  // KageForge Handlers
  // -------------------------------------------------------------------------

  ipcMain.handle('kageforge:chat', async (_event, message, provider, options) => {
    if (!moduleStatus.kageforge.loaded || !providerRouter) {
      return { error: moduleStatus.kageforge.error || 'KageForge not available' };
    }
    try {
      const response = await providerRouter.chat(message, provider, options);
      return response;
    } catch (error: any) {
      return { error: error.message };
    }
  });

  ipcMain.handle('kageforge:switchProvider', async (_event, provider) => {
    console.log('[KageForge] Switching provider to:', provider);
    return { success: true, provider };
  });

  ipcMain.handle('kageforge:getTokenUsage', async () => {
    if (!providerRouter) return { tokens: 0, cost: 0 };
    return providerRouter.getTokenUsage ? providerRouter.getTokenUsage() : { tokens: 0, cost: 0 };
  });

  ipcMain.handle('kageforge:getProviderStatus', async () => {
    return { anthropic: true, openai: true, vertex: false, grok: false, copilot: false };
  });

  // -------------------------------------------------------------------------
  // Ticketing Handlers
  // -------------------------------------------------------------------------

  ipcMain.handle('ticketing:createTicket', async (_event, ticket) => {
    if (!moduleStatus.ticketing.loaded || !ticketingClient) {
      return { success: false, error: moduleStatus.ticketing.error || 'Ticketing not available' };
    }
    try {
      const result = await ticketingClient.createTicket(ticket);
      return { success: true, ...result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('ticketing:searchTickets', async (_event, query) => {
    if (!ticketingClient) return [];
    try {
      return await ticketingClient.searchTickets(query);
    } catch (error: any) {
      console.error('[Ticketing] Search error:', error);
      return [];
    }
  });

  ipcMain.handle('ticketing:updateTicket', async (_event, id, updates) => {
    if (!ticketingClient) {
      return { success: false, error: 'Ticketing not available' };
    }
    try {
      const result = await ticketingClient.updateTicket(id, updates);
      return { success: true, ...result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('ticketing:getCompanies', async () => {
    if (!ticketingClient) return [];
    return ticketingClient.getCompanies ? ticketingClient.getCompanies() : [];
  });

  ipcMain.handle('ticketing:analyzeTicket', async (_event, ticketId) => {
    if (!ticketingClient || !providerRouter) {
      return { analysis: null, error: 'Analysis not available' };
    }
    try {
      const ticket = await ticketingClient.getTicket(ticketId);
      const analysis = await providerRouter.analyze(ticket);
      return { analysis };
    } catch (error: any) {
      return { analysis: null, error: error.message };
    }
  });

  // -------------------------------------------------------------------------
  // Academy Handlers
  // -------------------------------------------------------------------------

  ipcMain.handle('academy:getQuestion', async (_event, category, difficulty) => {
    if (!moduleStatus.academy.loaded || !academyEngine) {
      return { question: null, error: moduleStatus.academy.error || 'Academy not available' };
    }
    try {
      const question = academyEngine.getQuestion(category, difficulty);
      return { question };
    } catch (error: any) {
      return { question: null, error: error.message };
    }
  });

  ipcMain.handle('academy:submitAnswer', async (_event, questionId, answer) => {
    if (!academyEngine) {
      return { correct: false, error: 'Academy not available' };
    }
    try {
      const result = academyEngine.submitAnswer(questionId, answer);
      return result;
    } catch (error: any) {
      return { correct: false, error: error.message };
    }
  });

  ipcMain.handle('academy:getProgress', async () => {
    if (!academyEngine) return { progress: 0, total: 0 };
    return academyEngine.getProgress ? academyEngine.getProgress() : { progress: 0, total: 0 };
  });

  ipcMain.handle('academy:getCertifications', async () => {
    if (!academyEngine) return [];
    return academyEngine.getCertifications ? academyEngine.getCertifications() : [];
  });

  console.log('[Main] IPC handlers registered');
}

// ============================================================================
// MODULE INITIALIZATION
// ============================================================================

function initializeModules(): void {
  console.log('[Main] Initializing modules...');

  // Initialize MediaLoader bridge
  if (mediaLoaderBridge?.initializeMediaLoaderBridge) {
    try {
      mediaLoaderBridge.initializeMediaLoaderBridge();
      console.log('[Main] MediaLoader bridge initialized');
    } catch (error: any) {
      console.error('[Main] MediaLoader bridge initialization failed:', error.message);
    }
  }

  // Initialize database
  if (dbInit?.initDatabase) {
    try {
      dbInit.initDatabase();
      console.log('[Main] Database initialized');
    } catch (error: any) {
      console.error('[Main] Database initialization failed:', error.message);
    }
  }

  // Initialize module engines
  if (CaptureEngine) {
    try {
      captureEngine = new CaptureEngine();
      console.log('[Main] NinjaShark capture engine initialized');
    } catch (error: any) {
      console.error('[Main] NinjaShark initialization failed:', error.message);
    }
  }

  if (PowerShellEngine) {
    try {
      powershellEngine = new PowerShellEngine();
      console.log('[Main] PowerShell engine initialized');
    } catch (error: any) {
      console.error('[Main] PowerShell initialization failed:', error.message);
    }
  }

  if (RemoteAccessEngine) {
    try {
      remoteAccessEngine = new RemoteAccessEngine();
      console.log('[Main] Remote Access engine initialized');
    } catch (error: any) {
      console.error('[Main] Remote Access initialization failed:', error.message);
    }
  }

  if (NetworkMapper) {
    try {
      networkMapper = typeof NetworkMapper === 'function' ? new NetworkMapper() : NetworkMapper;
      console.log('[Main] Network Mapper initialized');
    } catch (error: any) {
      console.error('[Main] Network Mapper initialization failed:', error.message);
    }
  }

  if (SecurityScanner) {
    try {
      securityScanner = typeof SecurityScanner === 'function' ? new SecurityScanner() : SecurityScanner;
      console.log('[Main] Security Scanner initialized');
    } catch (error: any) {
      console.error('[Main] Security Scanner initialization failed:', error.message);
    }
  }

  if (ProviderRouter) {
    try {
      providerRouter = typeof ProviderRouter === 'function' ? new ProviderRouter() : ProviderRouter;
      console.log('[Main] KageForge Provider Router initialized');
    } catch (error: any) {
      console.error('[Main] KageForge initialization failed:', error.message);
    }
  }

  if (TicketingClient) {
    try {
      ticketingClient = typeof TicketingClient === 'function' ? new TicketingClient() : TicketingClient;
      console.log('[Main] Ticketing Client initialized');
    } catch (error: any) {
      console.error('[Main] Ticketing initialization failed:', error.message);
    }
  }

  if (AcademyEngine) {
    try {
      academyEngine = typeof AcademyEngine === 'function' ? new AcademyEngine() : AcademyEngine;
      console.log('[Main] Academy Engine initialized');
    } catch (error: any) {
      console.error('[Main] Academy initialization failed:', error.message);
    }
  }

  console.log('[Main] Module initialization complete');
}

// ============================================================================
// GLOBAL HOTKEYS
// ============================================================================

function registerHotkeys(): void {
  // KageChat toggle
  globalShortcut.register('CommandOrControl+K', () => {
    mainWindow?.webContents.send('hotkey:kageChat');
  });

  // Module hotkeys
  const moduleHotkeys: Record<string, string> = {
    'CommandOrControl+Shift+N': 'ninjashark',
    'CommandOrControl+Shift+P': 'powershell',
    'CommandOrControl+Shift+R': 'putty',
    'CommandOrControl+Shift+A': 'auvik',
    'CommandOrControl+Shift+S': 'security',
    'CommandOrControl+Shift+M': 'msadmin',
    'CommandOrControl+Shift+F': 'kageforge',
    'CommandOrControl+Shift+T': 'ticketing',
    'CommandOrControl+Shift+L': 'academy',
  };

  Object.entries(moduleHotkeys).forEach(([shortcut, module]) => {
    globalShortcut.register(shortcut, () => {
      mainWindow?.webContents.send('hotkey:module', module);
    });
  });

  console.log('[Main] Global hotkeys registered');
}

// ============================================================================
// APPLICATION LIFECYCLE
// ============================================================================

app.whenReady().then(() => {
  console.log('[Main] Ninja Toolkit v11 starting...');

  // Initialize modules first
  initializeModules();

  // Register IPC handlers
  registerIpcHandlers();

  // Create window
  createWindow();

  // Register hotkeys
  registerHotkeys();

  // macOS: Re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Cleanup on quit
app.on('will-quit', () => {
  // Unregister hotkeys
  globalShortcut.unregisterAll();

  // Cleanup MediaLoader
  if (mediaLoaderBridge?.cleanupMediaLoaderBridge) {
    try {
      mediaLoaderBridge.cleanupMediaLoaderBridge();
    } catch (error) {
      console.error('[Main] MediaLoader cleanup error:', error);
    }
  }

  // Cleanup database
  if (dbInit?.closeDatabase) {
    try {
      dbInit.closeDatabase();
    } catch (error) {
      console.error('[Main] Database cleanup error:', error);
    }
  }

  // Cleanup PowerShell
  if (powershellEngine?.cleanup) {
    try {
      powershellEngine.cleanup();
    } catch (error) {
      console.error('[Main] PowerShell cleanup error:', error);
    }
  }

  console.log('[Main] Ninja Toolkit shutting down');
});

// Quit when all windows closed (except macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: Prevent navigation to unknown URLs
app.on('web-contents-created', (_event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    const allowedHosts = ['localhost', '127.0.0.1'];
    const allowedProtocols = ['file:', 'devtools:'];

    if (!allowedHosts.includes(parsedUrl.hostname) && !allowedProtocols.includes(parsedUrl.protocol)) {
      event.preventDefault();
      console.warn('[Security] Blocked navigation to:', navigationUrl);
    }
  });
});
