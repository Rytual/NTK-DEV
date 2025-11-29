/**
 * Ninja Toolkit v11 - Electron Forge Configuration
 * Complete build configuration for Windows EXE deployment
 *
 * Phase 9: Production Build & Packaging
 * - Squirrel installer for Windows
 * - ZIP archive for portable distribution
 * - ASAR packaging for security
 * - Native module rebuild support
 */

const path = require('path');
const fs = require('fs');

// Note: FusesPlugin removed as it conflicts with 'start' command in Electron Forge
// Fuses can be applied post-build using @electron/fuses directly if needed

// Check if icon exists and has content
const iconPath = path.join(__dirname, 'assets', 'icons', 'icon.ico');
const hasValidIcon = fs.existsSync(iconPath) && fs.statSync(iconPath).size > 0;

module.exports = {
  packagerConfig: {
    asar: true,
    name: 'Ninja Toolkit',
    executableName: 'ninja-toolkit',
    appBundleId: 'com.ninja.toolkit.v11',
    appCategoryType: 'public.app-category.developer-tools',
    // Only include icon if it exists and is valid
    ...(hasValidIcon && { icon: './assets/icons/icon' }),
    win32metadata: {
      CompanyName: 'Ninja Toolkit Team',
      FileDescription: 'Ninja Toolkit v11 - Complete MSP Management Platform',
      ProductName: 'Ninja Toolkit',
      InternalName: 'NinjaToolkit',
      OriginalFilename: 'ninja-toolkit.exe',
    },
    // Ignore development files in packaged app
    ignore: [
      /^\/\.git/,
      /^\/\.claude/,
      /^\/\.vscode/,
      /^\/\.vs/,
      /^\/node_modules\/\.cache/,
      /^\/docs\//,
      /^\/scripts\//,
      /\.md$/,
      /\.log$/,
      /^\/art\/videos/,  // Large video files - users add their own
      /^\/art\/images/,  // Large image files - users add their own
    ],
    // Extra resources to include
    extraResource: [
      './art',
      './assets/splash.html',
    ],
  },
  rebuildConfig: {
    // Ensure native modules are rebuilt for target platform
    force: true,
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'NinjaToolkit',
        authors: 'Ninja Toolkit Team',
        description: 'Complete MSP Management Platform with 11 Integrated Modules',
        noMsi: true,
        // Only include icon if valid
        ...(hasValidIcon && { setupIcon: './assets/icons/icon.ico' }),
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32'],
    },
  ],
  plugins: [
    // Vite plugin for building main, preload, and renderer
    {
      name: '@electron-forge/plugin-vite',
      config: {
        // Build config for main process
        build: [
          {
            entry: 'src/main.ts',
            config: './vite.main.config.mjs',
          },
          {
            entry: 'src/preload.js',
            config: './vite.preload.config.mjs',
          },
        ],
        // Renderer process config
        renderer: [
          {
            name: 'main_window',
            config: './vite.renderer.config.mjs',
          },
        ],
      },
    },
    // Note: FusesPlugin removed - conflicts with 'electron-forge start'
    // For production builds, apply fuses post-package with @electron/fuses CLI
  ],
  // Hooks for build process
  hooks: {
    generateAssets: async () => {
      console.log('[Forge] Generating assets...');
    },
    prePackage: async () => {
      console.log('[Forge] Pre-package: Validating build configuration...');
    },
    postPackage: async (config, result) => {
      console.log('[Forge] Post-package: Build complete');
      console.log(`[Forge] Output: ${result.outputPaths.join(', ')}`);
    },
  },
};
