/**
 * Ninja Academy - Main Entry Point
 *
 * Microsoft Certification Training Platform
 * Honest implementation with real features, no fake data
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Import backend engines
const DatabaseManager = require('./backend/engines/DatabaseManager');
const GamificationEngine = require('./backend/engines/GamificationEngine');
const MediaLoader = require('./backend/engines/MediaLoader');
const { QuestionBankManager } = require('./backend/engines/QuestionBank');

// Global references
let mainWindow = null;
let databaseManager = null;
let gamificationEngine = null;
let mediaLoader = null;
let questionBankManager = null;

/**
 * Create main window
 */
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    backgroundColor: '#0a0e27',
    show: false,
    icon: path.join(__dirname, '../assets/icon.png')
  });

  // Load the index.html
  mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Initialize backend systems
 */
function initializeBackend() {
  console.log('[NinjaAcademy] Initializing backend systems...');

  // Initialize database
  const dbPath = path.join(app.getPath('userData'), 'ninja-academy.db');
  databaseManager = new DatabaseManager(dbPath);

  // Initialize gamification engine
  gamificationEngine = new GamificationEngine(databaseManager.getDatabase());

  // Initialize media loader
  mediaLoader = new MediaLoader();

  // Initialize question bank
  questionBankManager = new QuestionBankManager();

  console.log('[NinjaAcademy] Backend systems initialized');
  console.log('[NinjaAcademy] Questions available:', questionBankManager.totalQuestions);
  console.log('[NinjaAcademy] Media loader stats:', mediaLoader.getStats());
}

/**
 * Setup IPC handlers
 */
function setupIPC() {
  // Question Bank Handlers
  ipcMain.handle('get-exams', async () => {
    return questionBankManager.getExams();
  });

  ipcMain.handle('get-exam-questions', async (event, examCode) => {
    return questionBankManager.getExamQuestions(examCode);
  });

  ipcMain.handle('get-random-questions', async (event, examCode, count) => {
    return questionBankManager.getRandomQuestions(examCode, count);
  });

  ipcMain.handle('get-exam-stats', async (event, examCode) => {
    return questionBankManager.getExamStats(examCode);
  });

  // Gamification Handlers
  ipcMain.handle('get-user-progress', async () => {
    return gamificationEngine.getUserProgress();
  });

  ipcMain.handle('get-user-stats', async () => {
    return gamificationEngine.getUserStats();
  });

  ipcMain.handle('get-progress-summary', async () => {
    return gamificationEngine.getProgressSummary();
  });

  ipcMain.handle('get-all-badges', async () => {
    return gamificationEngine.getAllBadges();
  });

  ipcMain.handle('record-answer', async (event, questionId, correct, examCode) => {
    gamificationEngine.recordAnswer(questionId, correct, examCode);
    return gamificationEngine.getUserStats();
  });

  // Database Handlers
  ipcMain.handle('get-answer-history', async (event, limit) => {
    return databaseManager.getAnswerHistory(1, limit);
  });

  ipcMain.handle('get-exam-statistics', async (event, examCode) => {
    return databaseManager.getExamStatistics(1, examCode);
  });

  ipcMain.handle('get-all-exam-statistics', async () => {
    return databaseManager.getAllExamStatistics(1);
  });

  ipcMain.handle('start-study-session', async (event, examCode) => {
    return databaseManager.startStudySession(1, examCode);
  });

  ipcMain.handle('end-study-session', async (event, sessionId, questions, correct, xp) => {
    return databaseManager.endStudySession(sessionId, questions, correct, xp);
  });

  ipcMain.handle('get-study-analytics', async (event, days) => {
    return databaseManager.getStudyAnalytics(1, days);
  });

  ipcMain.handle('get-performance-trends', async (event, days) => {
    return databaseManager.getPerformanceTrends(1, days);
  });

  // Notes Handlers
  ipcMain.handle('save-note', async (event, examCode, domain, title, content) => {
    return databaseManager.saveNote(1, examCode, domain, title, content);
  });

  ipcMain.handle('update-note', async (event, noteId, title, content) => {
    return databaseManager.updateNote(noteId, title, content);
  });

  ipcMain.handle('get-notes', async (event, examCode) => {
    return databaseManager.getNotes(1, examCode);
  });

  // Bookmark Handlers
  ipcMain.handle('bookmark-question', async (event, questionId, examCode, note) => {
    return databaseManager.bookmarkQuestion(1, questionId, examCode, note);
  });

  ipcMain.handle('remove-bookmark', async (event, questionId) => {
    return databaseManager.removeBookmark(1, questionId);
  });

  ipcMain.handle('get-bookmarked-questions', async (event, examCode) => {
    return databaseManager.getBookmarkedQuestions(1, examCode);
  });

  // Settings Handlers
  ipcMain.handle('get-user-settings', async () => {
    return databaseManager.getUserSettings(1);
  });

  ipcMain.handle('update-user-settings', async (event, settings) => {
    return databaseManager.updateUserSettings(1, settings);
  });

  // Media Handlers
  ipcMain.handle('get-random-image', async () => {
    return mediaLoader.getRandomImage();
  });

  ipcMain.handle('get-random-video', async () => {
    return mediaLoader.getRandomVideo();
  });

  ipcMain.handle('get-media-stats', async () => {
    return mediaLoader.getStats();
  });

  // Export Handler
  ipcMain.handle('export-user-data', async () => {
    return databaseManager.exportUserData(1);
  });

  console.log('[NinjaAcademy] IPC handlers registered');
}

/**
 * App ready event
 */
app.whenReady().then(() => {
  initializeBackend();
  setupIPC();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

/**
 * Quit when all windows are closed
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Cleanup
    if (mediaLoader) mediaLoader.cleanup();
    if (databaseManager) databaseManager.close();
    app.quit();
  }
});

/**
 * Before quit
 */
app.on('before-quit', () => {
  console.log('[NinjaAcademy] Shutting down...');
  if (mediaLoader) mediaLoader.cleanup();
  if (databaseManager) databaseManager.close();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('[NinjaAcademy] Uncaught exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('[NinjaAcademy] Unhandled rejection:', error);
});

console.log('[NinjaAcademy] Starting Ninja Academy...');
console.log('[NinjaAcademy] Version: 10.3.0');
console.log('[NinjaAcademy] Platform:', process.platform);
console.log('[NinjaAcademy] Electron:', process.versions.electron);
console.log('[NinjaAcademy] Node:', process.versions.node);
