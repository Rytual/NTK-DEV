/**
 * Ninja Toolkit v11 - Preload Script
 * Secure IPC bridge between main and renderer processes
 *
 * This script exposes a safe subset of Electron APIs to the renderer
 * using contextBridge for security.
 *
 * All modules access the same API surface:
 * - window.electron.ipcRenderer.invoke(channel, ...args)
 * - window.electron.ipcRenderer.send(channel, ...args)
 * - window.electron.ipcRenderer.on(channel, callback)
 */

const { contextBridge, ipcRenderer } = require('electron');

// Define allowed IPC channels for security
const validInvokeChannels = [
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

  // System
  'system:getModuleStates',
  'system:getVersion',
  'system:getPlatform',

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
  'academy:getCertifications'
];

const validSendChannels = [
  'app:ready',
  'module:navigate',
  'kage:clearHistory'
];

const validReceiveChannels = [
  // MediaLoader events
  'media:reload',

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
  'ticketing:notification'
];

// Expose protected APIs to renderer
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    /**
     * Invoke a channel and wait for response (async)
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
     */
    on: (channel, callback) => {
      if (validReceiveChannels.includes(channel)) {
        const subscription = (event, ...args) => callback(...args);
        ipcRenderer.on(channel, subscription);
        return () => ipcRenderer.removeListener(channel, subscription);
      }
      console.warn(`[Preload] Blocked listener on unauthorized channel: ${channel}`);
      return () => {};
    },

    /**
     * Listen for a single message
     */
    once: (channel, callback) => {
      if (validReceiveChannels.includes(channel)) {
        ipcRenderer.once(channel, (event, ...args) => callback(...args));
      } else {
        console.warn(`[Preload] Blocked once listener on unauthorized channel: ${channel}`);
      }
    },

    /**
     * Remove all listeners for a channel
     */
    removeAllListeners: (channel) => {
      if (validReceiveChannels.includes(channel)) {
        ipcRenderer.removeAllListeners(channel);
      }
    }
  },

  // Platform information
  platform: process.platform,
  arch: process.arch,

  // Version info
  versions: {
    electron: process.versions.electron,
    node: process.versions.node,
    chrome: process.versions.chrome
  }
});

// Notify when preload is ready
console.log('[Preload] Ninja Toolkit v11 preload script loaded');
console.log('[Preload] Exposed channels:', {
  invoke: validInvokeChannels.length,
  send: validSendChannels.length,
  receive: validReceiveChannels.length
});
