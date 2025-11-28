/**
 * Ninja Toolkit v11 - Electron Forge Configuration
 * Complete build configuration for Windows EXE deployment
 */

const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: true,
    name: 'Ninja Toolkit',
    executableName: 'ninja-toolkit',
    appBundleId: 'com.ninja.toolkit.v11',
    appCategoryType: 'public.app-category.developer-tools',
    icon: './assets/icons/icon',
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
      /\.md$/,
      /\.log$/,
      /^\/art\/videos/,  // Large video files - users add their own
      /^\/art\/images/,  // Large image files - users add their own
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
        setupIcon: './assets/icons/icon.ico',
        iconUrl: 'https://raw.githubusercontent.com/ninja-toolkit/assets/main/icon.ico',
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
  ],
};
