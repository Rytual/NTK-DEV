/**
 * Global MediaLoader Singleton
 *
 * This module provides a singleton instance of MediaLoader that can be shared
 * across all modules in the Ninja Toolkit application.
 *
 * Usage:
 *   const { getMediaLoader } = require('./core/media');
 *   const mediaLoader = getMediaLoader();
 *   const background = mediaLoader.getRandomImage();
 *
 * The singleton pattern ensures that:
 * - Only one instance of MediaLoader exists
 * - File watchers are not duplicated
 * - Media is loaded once and shared
 * - Events are centralized
 */

const MediaLoader = require('./MediaLoader.cjs');

let instance = null;

/**
 * Get the global MediaLoader instance
 * Creates the instance on first call, returns existing instance on subsequent calls
 *
 * @returns {MediaLoader} The global MediaLoader singleton
 */
function getMediaLoader() {
  if (!instance) {
    console.log('[MediaLoader Singleton] Creating new global instance');
    instance = new MediaLoader();
  }
  return instance;
}

/**
 * Reset the singleton instance (useful for testing)
 * WARNING: This will cleanup watchers and clear all loaded media
 */
function resetMediaLoader() {
  if (instance) {
    console.log('[MediaLoader Singleton] Resetting instance');
    instance.cleanup();
    instance = null;
  }
}

/**
 * Check if the singleton has been initialized
 * @returns {boolean} True if instance exists
 */
function isInitialized() {
  return instance !== null;
}

module.exports = {
  getMediaLoader,
  resetMediaLoader,
  isInitialized,
  MediaLoader // Export class for advanced usage (custom instances)
};
