/**
 * MediaLoader Bridge for Electron IPC
 *
 * This module bridges the Node.js MediaLoader with the Electron renderer process.
 * Allows React components to access the global media system via IPC.
 */

const { ipcMain } = require('electron');
const { getMediaLoader } = require('../core/media/index.cjs');

/**
 * Initialize MediaLoader IPC handlers
 * Call this from the main Electron process
 */
function initializeMediaLoaderBridge() {
  console.log('[MediaLoader Bridge] Initializing IPC handlers...');

  const mediaLoader = getMediaLoader();

  // Handler: Get random image
  ipcMain.handle('media:getRandomImage', () => {
    const result = mediaLoader.getRandomImage();
    console.log('[MediaLoader Bridge] Requested random image:', result.type, result.filename || result.name);
    return result;
  });

  // Handler: Get random video
  ipcMain.handle('media:getRandomVideo', () => {
    const result = mediaLoader.getRandomVideo();
    console.log('[MediaLoader Bridge] Requested random video:', result ? result.filename : 'none');
    return result;
  });

  // Handler: Get multiple random images
  ipcMain.handle('media:getRandomImages', (event, count) => {
    const results = mediaLoader.getRandomImages(count);
    console.log('[MediaLoader Bridge] Requested', count, 'random images');
    return results;
  });

  // Handler: Get statistics
  ipcMain.handle('media:getStats', () => {
    return mediaLoader.getStats();
  });

  // Handler: Get all media
  ipcMain.handle('media:getAllMedia', () => {
    return mediaLoader.getAllMedia();
  });

  // Handler: Reload media
  ipcMain.handle('media:reload', () => {
    mediaLoader.reload();
    return { success: true };
  });

  // Send events to renderer when media changes
  mediaLoader.on('reload', (changes) => {
    // Broadcast to all windows
    const windows = require('electron').BrowserWindow.getAllWindows();
    windows.forEach(win => {
      win.webContents.send('media:reload', changes);
    });
  });

  console.log('[MediaLoader Bridge] IPC handlers registered successfully');
}

/**
 * Cleanup bridge handlers
 */
function cleanupMediaLoaderBridge() {
  console.log('[MediaLoader Bridge] Cleaning up...');

  ipcMain.removeHandler('media:getRandomImage');
  ipcMain.removeHandler('media:getRandomVideo');
  ipcMain.removeHandler('media:getRandomImages');
  ipcMain.removeHandler('media:getStats');
  ipcMain.removeHandler('media:getAllMedia');
  ipcMain.removeHandler('media:reload');

  const { getMediaLoader } = require('../core/media/index.cjs');
  const mediaLoader = getMediaLoader();
  mediaLoader.cleanup();

  console.log('[MediaLoader Bridge] Cleanup complete');
}

module.exports = {
  initializeMediaLoaderBridge,
  cleanupMediaLoaderBridge
};
