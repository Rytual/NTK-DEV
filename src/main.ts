/**
 * Ninja Toolkit v11 - Main Electron Process
 * Complete 11-Module Integration with Global MediaLoader and KageChat
 *
 * This file initializes the Electron application and wires all modules via IPC.
 * Native modules are loaded with graceful fallbacks for development flexibility.
 */

import { app, BrowserWindow, ipcMain, Menu, globalShortcut, dialog, Tray, nativeImage } from 'electron';
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
let splashWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

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

// Load Event Bus (Enterprise integration system)
let eventBusModule: any = null;
let eventBus: any = null;
let errorAggregator: any = null;
let healthMonitor: any = null;
let moduleLifecycle: any = null;
try {
  eventBusModule = require('./backend/eventBus.cjs');
  eventBus = eventBusModule.eventBus;
  errorAggregator = eventBusModule.errorAggregator;
  healthMonitor = eventBusModule.healthMonitor;
  moduleLifecycle = eventBusModule.moduleLifecycle;
  console.log('[Main] Event bus loaded');
} catch (error: any) {
  console.warn('[Main] Event bus failed to load:', error.message);
}

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
let QuestionBankManager: any = null;
let GamificationEngine: any = null;
let AcademyDatabaseManager: any = null;
try {
  const questionBankModule = require('./modules/academy/backend/engines/QuestionBank.cjs');
  QuestionBankManager = questionBankModule.QuestionBankManager;

  // Try to load gamification engine (requires better-sqlite3)
  try {
    AcademyDatabaseManager = require('./modules/academy/backend/engines/DatabaseManager.cjs');
    GamificationEngine = require('./modules/academy/backend/engines/GamificationEngine.cjs');
    console.log('[Main] Academy gamification engine loaded');
  } catch (gamErr: any) {
    console.warn('[Main] Academy gamification unavailable:', gamErr.message);
  }

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
let academyQuestionBank: any = null;
let academyDatabase: any = null;
let academyGamification: any = null;

// ============================================================================
// SYSTEM TRAY
// ============================================================================

function createTray(): void {
  // Try to load icon from various locations
  const iconPaths = app.isPackaged
    ? [
        path.join(process.resourcesPath, 'assets', 'icons', 'icon.png'),
        path.join(process.resourcesPath, 'icon.png'),
      ]
    : [
        path.join(__dirname, '..', 'assets', 'icons', 'icon.png'),
        path.join(__dirname, '..', 'assets', 'icons', 'icon.ico'),
      ];

  let trayIcon: Electron.NativeImage | null = null;

  for (const iconPath of iconPaths) {
    if (fs.existsSync(iconPath)) {
      const stat = fs.statSync(iconPath);
      if (stat.size > 0) {
        trayIcon = nativeImage.createFromPath(iconPath);
        break;
      }
    }
  }

  // Fallback: Create a simple programmatic icon if no file found
  if (!trayIcon || trayIcon.isEmpty()) {
    // Create a 16x16 colored square as fallback
    const size = 16;
    const canvas = Buffer.alloc(size * size * 4);
    for (let i = 0; i < size * size; i++) {
      canvas[i * 4] = 99;     // R - primary color
      canvas[i * 4 + 1] = 102; // G
      canvas[i * 4 + 2] = 241; // B
      canvas[i * 4 + 3] = 255; // A
    }
    trayIcon = nativeImage.createFromBuffer(canvas, { width: size, height: size });
  }

  // Resize for tray (Windows typically uses 16x16)
  if (process.platform === 'win32') {
    trayIcon = trayIcon.resize({ width: 16, height: 16 });
  }

  tray = new Tray(trayIcon);
  tray.setToolTip('Ninja Toolkit v11');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Ninja Toolkit',
      click: () => {
        if (mainWindow) {
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Dashboard',
      click: () => {
        mainWindow?.webContents.send('hotkey:module', 'dashboard');
        mainWindow?.show();
      },
    },
    {
      label: 'NinjaShark',
      click: () => {
        mainWindow?.webContents.send('hotkey:module', 'ninjashark');
        mainWindow?.show();
      },
    },
    {
      label: 'Academy',
      click: () => {
        mainWindow?.webContents.send('hotkey:module', 'academy');
        mainWindow?.show();
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  // Double-click to show window (Windows)
  tray.on('double-click', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  console.log('[Main] System tray created');
}

// ============================================================================
// WINDOW CREATION
// ============================================================================

function createSplashWindow(): void {
  // Determine splash path - works in both dev and production
  // In dev: __dirname is .vite/build, so we need to go up 2 levels
  // In prod: it's in resources
  const splashPath = app.isPackaged
    ? path.join(process.resourcesPath, 'splash.html')
    : path.join(__dirname, '..', '..', 'assets', 'splash.html');

  splashWindow = new BrowserWindow({
    width: 400,
    height: 500,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: '#00000000',
  });

  // Try to load splash, fallback to showing main window directly if it fails
  splashWindow.loadFile(splashPath).catch((err) => {
    console.warn('[Main] Splash screen not found, skipping:', err.message);
    splashWindow?.close();
    splashWindow = null;
  });

  splashWindow.on('closed', () => {
    splashWindow = null;
  });

  console.log('[Main] Splash window created');
}

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
      sandbox: false, // Required for preload script to access process APIs
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

  // Show when ready, close splash
  mainWindow.once('ready-to-show', () => {
    // Give a small delay for polish - splash animation completes
    setTimeout(() => {
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
      }
      mainWindow?.show();
      mainWindow?.focus();
      console.log('[Main] Window ready and shown');
    }, 500);
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

  // Get a single question (original handler - updated)
  ipcMain.handle('academy:getQuestion', async (_event, examCode, difficulty) => {
    if (!moduleStatus.academy.loaded || !academyQuestionBank) {
      return { question: null, error: moduleStatus.academy.error || 'Academy not available' };
    }
    try {
      const questions = academyQuestionBank.getRandomQuestions(examCode, 1);
      return { question: questions[0] || null };
    } catch (error: any) {
      return { question: null, error: error.message };
    }
  });

  // Submit answer and record it
  ipcMain.handle('academy:submitAnswer', async (_event, questionId, answer, examCode) => {
    if (!academyQuestionBank) {
      return { correct: false, error: 'Academy not available' };
    }
    try {
      const question = academyQuestionBank.getQuestionById(questionId);
      if (!question) {
        return { correct: false, error: 'Question not found' };
      }
      const correct = question.correct === answer;

      // Record answer in gamification engine if available
      if (academyGamification) {
        academyGamification.recordAnswer(questionId, correct, examCode || question.exam);
      }

      return {
        correct,
        explanation: question.explanation,
        correctAnswer: question.correct,
        reference: question.reference
      };
    } catch (error: any) {
      return { correct: false, error: error.message };
    }
  });

  // Get progress summary
  ipcMain.handle('academy:getProgress', async () => {
    if (!academyGamification) {
      return { progress: 0, total: 0 };
    }
    try {
      return academyGamification.getProgressSummary();
    } catch (error: any) {
      return { progress: 0, total: 0, error: error.message };
    }
  });

  // Get certifications (exams list)
  ipcMain.handle('academy:getCertifications', async () => {
    if (!academyQuestionBank) return [];
    try {
      return academyQuestionBank.getExams();
    } catch (error: any) {
      return [];
    }
  });

  // NEW: Get all available exams
  ipcMain.handle('academy:getExams', async () => {
    if (!academyQuestionBank) {
      return { exams: [], error: 'Academy not available' };
    }
    try {
      const exams = academyQuestionBank.getExams();
      return { exams };
    } catch (error: any) {
      return { exams: [], error: error.message };
    }
  });

  // NEW: Get questions for a specific exam
  ipcMain.handle('academy:getExamQuestions', async (_event, examCode) => {
    if (!academyQuestionBank) {
      return { questions: [], error: 'Academy not available' };
    }
    try {
      const questions = academyQuestionBank.getExamQuestions(examCode);
      return { questions };
    } catch (error: any) {
      return { questions: [], error: error.message };
    }
  });

  // NEW: Get random questions for practice
  ipcMain.handle('academy:getRandomQuestions', async (_event, examCode, count = 10) => {
    if (!academyQuestionBank) {
      return { questions: [], error: 'Academy not available' };
    }
    try {
      const questions = academyQuestionBank.getRandomQuestions(examCode, count);
      return { questions };
    } catch (error: any) {
      return { questions: [], error: error.message };
    }
  });

  // NEW: Get user stats from gamification
  ipcMain.handle('academy:getUserStats', async () => {
    if (!academyGamification) {
      return { stats: null, error: 'Gamification not available' };
    }
    try {
      const stats = academyGamification.getUserStats();
      return { stats };
    } catch (error: any) {
      return { stats: null, error: error.message };
    }
  });

  // NEW: Get detailed progress summary
  ipcMain.handle('academy:getProgressSummary', async () => {
    if (!academyGamification) {
      return { summary: null, error: 'Gamification not available' };
    }
    try {
      const summary = academyGamification.getProgressSummary();
      return { summary };
    } catch (error: any) {
      return { summary: null, error: error.message };
    }
  });

  // NEW: Get all badges with earned status
  ipcMain.handle('academy:getAllBadges', async () => {
    if (!academyGamification) {
      return { badges: [], error: 'Gamification not available' };
    }
    try {
      const badges = academyGamification.getAllBadges();
      return { badges };
    } catch (error: any) {
      return { badges: [], error: error.message };
    }
  });

  // NEW: Record answer (explicit endpoint)
  ipcMain.handle('academy:recordAnswer', async (_event, questionId, correct, examCode) => {
    if (!academyGamification) {
      return { success: false, error: 'Gamification not available' };
    }
    try {
      academyGamification.recordAnswer(questionId, correct, examCode);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // -------------------------------------------------------------------------
  // Enterprise Integration Handlers (Event Bus, Health, Errors)
  // -------------------------------------------------------------------------

  // Log error from renderer
  ipcMain.handle('system:logError', async (_event, errorData) => {
    if (errorAggregator) {
      errorAggregator.logError(errorData);
    }
    console.error('[System] Error logged:', errorData.module, errorData.message);
    return { success: true };
  });

  // Get recent errors
  ipcMain.handle('system:getErrors', async (_event, filter = {}, limit = 100) => {
    if (!errorAggregator) {
      return { errors: [], stats: null };
    }
    return {
      errors: errorAggregator.getErrors(filter, limit),
      stats: errorAggregator.getStats()
    };
  });

  // Get system health status
  ipcMain.handle('system:getHealth', async () => {
    if (!healthMonitor) {
      return { status: 'unknown', modules: {} };
    }
    return healthMonitor.getStatus();
  });

  // Run health checks
  ipcMain.handle('system:runHealthCheck', async () => {
    if (!healthMonitor) {
      return { results: {}, error: 'Health monitor not available' };
    }
    try {
      const results = await healthMonitor.runChecks();
      return { results };
    } catch (error: any) {
      return { results: {}, error: error.message };
    }
  });

  // Get event history (for debugging)
  ipcMain.handle('system:getEventHistory', async (_event, filter = null, limit = 100) => {
    if (!eventBus) {
      return { events: [] };
    }
    return { events: eventBus.getHistory(filter, limit) };
  });

  // Module lifecycle - switch active module
  ipcMain.handle('module:switch', async (_event, moduleName, context = {}) => {
    if (moduleLifecycle) {
      moduleLifecycle.switchModule(moduleName, context);
    }

    // Broadcast to renderer for KageChat context update
    mainWindow?.webContents.send('module:switched', { module: moduleName, context });

    // Publish to event bus
    if (eventBus) {
      eventBus.publish('module:switched', { module: moduleName, context });
    }

    return { success: true, module: moduleName };
  });

  // Get active module
  ipcMain.handle('module:getActive', async () => {
    if (!moduleLifecycle) {
      return { module: null };
    }
    return { module: moduleLifecycle.getActiveModule() };
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

  // Initialize Academy subsystems
  if (QuestionBankManager) {
    try {
      academyQuestionBank = new QuestionBankManager();
      console.log('[Main] Academy QuestionBank initialized');
    } catch (error: any) {
      console.error('[Main] Academy QuestionBank initialization failed:', error.message);
    }
  }

  if (AcademyDatabaseManager && GamificationEngine) {
    try {
      academyDatabase = new AcademyDatabaseManager();
      academyGamification = new GamificationEngine(academyDatabase.db);
      console.log('[Main] Academy Gamification initialized');
    } catch (error: any) {
      console.error('[Main] Academy Gamification initialization failed:', error.message);
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

  // Show splash screen first
  createSplashWindow();

  // Initialize modules
  initializeModules();

  // Register IPC handlers
  registerIpcHandlers();

  // Create main window (splash will close when ready)
  createWindow();

  // Create system tray
  createTray();

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

  // Destroy tray
  if (tray) {
    tray.destroy();
    tray = null;
  }

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
