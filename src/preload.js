/**
 * Ninja Toolkit v11 - Preload Script
 * Secure IPC bridge between main and renderer processes
 *
 * This script exposes a safe subset of Electron APIs to the renderer
 * using contextBridge for security.
 *
 * CANONICAL API: window.electronAPI
 * - window.electronAPI.invoke(channel, ...args)
 * - window.electronAPI.send(channel, ...args)
 * - window.electronAPI.on(channel, callback)
 * - window.electronAPI.once(channel, callback)
 * - window.electronAPI.removeAllListeners(channel)
 */

const { contextBridge, ipcRenderer } = require('electron');

// ============================================================================
// CHANNEL ALLOWLISTS (Security)
// ============================================================================

const validInvokeChannels = [
  // System
  'system:getModuleStates',
  'system:getVersion',
  'system:getPlatform',
  'system:logError',
  'system:getErrors',
  'system:getHealth',
  'system:runHealthCheck',
  'system:getEventHistory',

  // Module Lifecycle
  'module:switch',
  'module:getActive',

  // MediaLoader (GLOBAL)
  'media:getRandomImage',
  'media:getRandomVideo',
  'media:getRandomImages',
  'media:getStats',
  'media:getAllMedia',
  'media:reload',

  // KageChat (GLOBAL)
  'kage:sendMessage',
  'kage:setContext',
  'kage:getProviders',

  // Module: NinjaShark
  'ninjashark:startCapture',
  'ninjashark:stopCapture',
  'ninjashark:getPackets',
  'ninjashark:export',

  // Module: PowerShell
  'powershell:execute',
  'powershell:getHistory',
  'powershell:createSession',

  // Module: PuTTY/Remote Access
  'putty:connect',
  'putty:disconnect',
  'putty:send',
  'putty:getSessions',

  // Module: Auvik/Network
  'auvik:scan',
  'auvik:getTopology',
  'auvik:snmpWalk',

  // Module: Security
  'security:scanTarget',
  'security:getThreats',
  'security:checkCompliance',
  'security:getRiskScore',

  // Module: MS Admin
  'msadmin:authenticate',
  'msadmin:getUsers',
  'msadmin:getLicenses',
  'msadmin:runScript',

  // Module: KageForge
  'kageforge:chat',
  'kageforge:switchProvider',
  'kageforge:getTokenUsage',
  'kageforge:getProviderStatus',

  // Module: Ticketing
  'ticketing:createTicket',
  'ticketing:searchTickets',
  'ticketing:updateTicket',
  'ticketing:getCompanies',
  'ticketing:analyzeTicket',

  // Module: Academy
  'academy:getQuestion',
  'academy:submitAnswer',
  'academy:getProgress',
  'academy:getCertifications',
  'academy:getExams',
  'academy:getExamQuestions',
  'academy:getRandomQuestions',
  'academy:getUserStats',
  'academy:getProgressSummary',
  'academy:getAllBadges',
  'academy:recordAnswer',
];

const validSendChannels = [
  'app:ready',
  'module:navigate',
  'kage:clearHistory',
];

const validReceiveChannels = [
  // MediaLoader events
  'media:reload',

  // Module lifecycle events
  'module:switched',
  'health:changed',
  'error:logged',

  // Hotkey events
  'hotkey:kageChat',
  'hotkey:module',

  // Menu events
  'menu:settings',
  'menu:aiSettings',
  'menu:docs',
  'menu:shortcuts',
  'menu:updates',

  // KageChat events
  'kage:clearHistory',
  'kage:response',

  // Module events
  'ninjashark:packet',
  'powershell:output',
  'putty:data',
  'auvik:deviceFound',
  'security:alert',
  'ticketing:notification',
];

// ============================================================================
// EXPOSE CANONICAL API: window.electronAPI
// ============================================================================

contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Invoke a channel and wait for response (async)
   * @param {string} channel - IPC channel name
   * @param {...any} args - Arguments to pass
   * @returns {Promise<any>} Response from main process
   */
  invoke: (channel, ...args) => {
    if (validInvokeChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
    console.warn(`[Preload] Blocked invoke to unauthorized channel: ${channel}`);
    return Promise.reject(new Error(`Unauthorized channel: ${channel}`));
  },

  /**
   * Send a message to main process (fire and forget)
   * @param {string} channel - IPC channel name
   * @param {...any} args - Arguments to pass
   */
  send: (channel, ...args) => {
    if (validSendChannels.includes(channel)) {
      ipcRenderer.send(channel, ...args);
    } else {
      console.warn(`[Preload] Blocked send to unauthorized channel: ${channel}`);
    }
  },

  /**
   * Listen for messages from main process
   * @param {string} channel - IPC channel name
   * @param {function} callback - Handler function
   * @returns {function} Unsubscribe function
   */
  on: (channel, callback) => {
    if (validReceiveChannels.includes(channel)) {
      const subscription = (_event, ...args) => callback(...args);
      ipcRenderer.on(channel, subscription);
      return () => ipcRenderer.removeListener(channel, subscription);
    }
    console.warn(`[Preload] Blocked listener on unauthorized channel: ${channel}`);
    return () => {};
  },

  /**
   * Listen for a single message
   * @param {string} channel - IPC channel name
   * @param {function} callback - Handler function
   */
  once: (channel, callback) => {
    if (validReceiveChannels.includes(channel)) {
      ipcRenderer.once(channel, (_event, ...args) => callback(...args));
    } else {
      console.warn(`[Preload] Blocked once listener on unauthorized channel: ${channel}`);
    }
  },

  /**
   * Remove all listeners for a channel
   * @param {string} channel - IPC channel name
   */
  removeAllListeners: (channel) => {
    if (validReceiveChannels.includes(channel)) {
      ipcRenderer.removeAllListeners(channel);
    }
  },

  // Platform information
  platform: process.platform,
  arch: process.arch,

  // Version info
  versions: {
    electron: process.versions.electron,
    node: process.versions.node,
    chrome: process.versions.chrome,
  },
});

// ============================================================================
// BACKWARD COMPATIBILITY: window.electron (deprecated)
// ============================================================================

// Expose legacy API for gradual migration
// TODO: Remove in v12.0.0
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel, ...args) => {
      console.warn(`[Preload] DEPRECATED: window.electron.ipcRenderer.invoke() - Use window.electronAPI.invoke() instead`);
      if (validInvokeChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, ...args);
      }
      return Promise.reject(new Error(`Unauthorized channel: ${channel}`));
    },
    send: (channel, ...args) => {
      console.warn(`[Preload] DEPRECATED: window.electron.ipcRenderer.send() - Use window.electronAPI.send() instead`);
      if (validSendChannels.includes(channel)) {
        ipcRenderer.send(channel, ...args);
      }
    },
    on: (channel, callback) => {
      console.warn(`[Preload] DEPRECATED: window.electron.ipcRenderer.on() - Use window.electronAPI.on() instead`);
      if (validReceiveChannels.includes(channel)) {
        const subscription = (_event, ...args) => callback(...args);
        ipcRenderer.on(channel, subscription);
        return () => ipcRenderer.removeListener(channel, subscription);
      }
      return () => {};
    },
    once: (channel, callback) => {
      console.warn(`[Preload] DEPRECATED: window.electron.ipcRenderer.once() - Use window.electronAPI.once() instead`);
      if (validReceiveChannels.includes(channel)) {
        ipcRenderer.once(channel, (_event, ...args) => callback(...args));
      }
    },
    removeAllListeners: (channel) => {
      if (validReceiveChannels.includes(channel)) {
        ipcRenderer.removeAllListeners(channel);
      }
    },
  },
  platform: process.platform,
  arch: process.arch,
  versions: {
    electron: process.versions.electron,
    node: process.versions.node,
    chrome: process.versions.chrome,
  },
});

// ============================================================================
// STARTUP LOGGING
// ============================================================================

console.log('[Preload] Ninja Toolkit v11 preload script loaded');
console.log('[Preload] Canonical API: window.electronAPI');
console.log('[Preload] Legacy API: window.electron (deprecated)');
console.log('[Preload] Channels:', {
  invoke: validInvokeChannels.length,
  send: validSendChannels.length,
  receive: validReceiveChannels.length,
});
