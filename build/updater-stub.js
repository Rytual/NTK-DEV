#!/usr/bin/env node
/**
 * Ninja Toolkit - Updater Stub
 * Per Prompt 12: Squirrel deltas user server, updater stub
 *
 * Handles auto-updates via Squirrel for Windows
 */

const { app, autoUpdater, dialog, BrowserWindow } = require('electron');
const path = require('path');
const os = require('os');

const UPDATE_SERVER_URL = 'https://updates.ninjatoolkit.com';
const UPDATE_CHECK_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours

class UpdaterStub {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.updateAvailable = false;
    this.updateDownloaded = false;
    this.enabled = process.platform === 'win32' && !process.env.ELECTRON_IS_DEV;
  }

  /**
   * Initialize auto-updater
   */
  initialize() {
    if (!this.enabled) {
      console.log('[Updater] Auto-updates disabled (dev mode or non-Windows)');
      return false;
    }

    const feedURL = `${UPDATE_SERVER_URL}/win32/${process.arch}/${app.getVersion()}`;

    try {
      autoUpdater.setFeedURL({ url: feedURL });
      this.setupEventHandlers();
      console.log('[Updater] Initialized with feed URL:', feedURL);
      return true;
    } catch (error) {
      console.error('[Updater] Failed to initialize:', error);
      return false;
    }
  }

  /**
   * Setup update event handlers
   */
  setupEventHandlers() {
    autoUpdater.on('error', (error) => {
      console.error('[Updater] Error:', error);
      this.sendStatus('error', error.message);
    });

    autoUpdater.on('checking-for-update', () => {
      console.log('[Updater] Checking for updates...');
      this.sendStatus('checking');
    });

    autoUpdater.on('update-available', () => {
      console.log('[Updater] Update available');
      this.updateAvailable = true;
      this.sendStatus('available');
    });

    autoUpdater.on('update-not-available', () => {
      console.log('[Updater] No updates available');
      this.sendStatus('not-available');
    });

    autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
      console.log('[Updater] Update downloaded:', releaseName);
      this.updateDownloaded = true;
      this.sendStatus('downloaded', { releaseNotes, releaseName });
      this.promptInstall(releaseName, releaseNotes);
    });

    // Squirrel events for Windows
    autoUpdater.on('before-quit-for-update', () => {
      console.log('[Updater] Preparing to quit for update...');
    });
  }

  /**
   * Send status to renderer
   */
  sendStatus(status, data = {}) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('updater-status', { status, ...data });
    }
  }

  /**
   * Check for updates
   */
  checkForUpdates() {
    if (!this.enabled) return;

    try {
      autoUpdater.checkForUpdates();
    } catch (error) {
      console.error('[Updater] Check failed:', error);
    }
  }

  /**
   * Start periodic update checks
   */
  startPeriodicChecks() {
    if (!this.enabled) return;

    // Initial check after 30 seconds
    setTimeout(() => this.checkForUpdates(), 30000);

    // Periodic checks
    setInterval(() => this.checkForUpdates(), UPDATE_CHECK_INTERVAL);
  }

  /**
   * Prompt user to install update
   */
  promptInstall(releaseName, releaseNotes) {
    const options = {
      type: 'info',
      title: 'Update Available',
      message: `Ninja Toolkit ${releaseName} is ready to install.`,
      detail: releaseNotes || 'Restart to apply the update.',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
      cancelId: 1
    };

    dialog.showMessageBox(this.mainWindow, options).then(({ response }) => {
      if (response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  }

  /**
   * Force quit and install
   */
  quitAndInstall() {
    if (this.updateDownloaded) {
      autoUpdater.quitAndInstall();
    }
  }

  /**
   * Get update status
   */
  getStatus() {
    return {
      enabled: this.enabled,
      updateAvailable: this.updateAvailable,
      updateDownloaded: this.updateDownloaded,
      version: app.getVersion(),
      platform: process.platform,
      arch: process.arch
    };
  }
}

/**
 * Handle Squirrel events for Windows installer
 */
function handleSquirrelEvent() {
  if (process.platform !== 'win32') return false;

  const squirrelEvent = process.argv[1];

  switch (squirrelEvent) {
    case '--squirrel-install':
    case '--squirrel-updated':
      // Create shortcuts, register handlers
      const { spawn } = require('child_process');
      const appFolder = path.resolve(process.execPath, '..');
      const rootFolder = path.resolve(appFolder, '..');
      const updateExe = path.resolve(path.join(rootFolder, 'Update.exe'));
      const exeName = path.basename(process.execPath);

      spawn(updateExe, ['--createShortcut', exeName], { detached: true });
      setTimeout(() => app.quit(), 1000);
      return true;

    case '--squirrel-uninstall':
      // Remove shortcuts, cleanup
      const { spawnSync } = require('child_process');
      const appFolder2 = path.resolve(process.execPath, '..');
      const rootFolder2 = path.resolve(appFolder2, '..');
      const updateExe2 = path.resolve(path.join(rootFolder2, 'Update.exe'));
      const exeName2 = path.basename(process.execPath);

      spawnSync(updateExe2, ['--removeShortcut', exeName2], { timeout: 10000 });
      setTimeout(() => app.quit(), 1000);
      return true;

    case '--squirrel-obsolete':
      // Old version being replaced
      app.quit();
      return true;

    case '--squirrel-firstrun':
      // First run after install - continue to app
      return false;
  }

  return false;
}

// Export for use in main process
module.exports = {
  UpdaterStub,
  handleSquirrelEvent
};

// Example usage in main.ts:
/*
const { handleSquirrelEvent, UpdaterStub } = require('./build/updater-stub');

// Handle Squirrel events first
if (handleSquirrelEvent()) {
  return; // App will quit
}

app.whenReady().then(() => {
  const mainWindow = createWindow();
  const updater = new UpdaterStub(mainWindow);
  updater.initialize();
  updater.startPeriodicChecks();

  // IPC handlers for renderer
  ipcMain.handle('updater:check', () => updater.checkForUpdates());
  ipcMain.handle('updater:status', () => updater.getStatus());
  ipcMain.handle('updater:install', () => updater.quitAndInstall());
});
*/
