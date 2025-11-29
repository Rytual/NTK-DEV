/**
 * Ninja Toolkit v11 - Electron Forge Configuration
 * Complete build configuration for Windows EXE deployment
 *
 * Phase 9: Production Build & Packaging
 * - Squirrel installer for Windows
 * - ZIP archive for portable distribution
 * - ASAR packaging for security
 * - Native module rebuild support
 * - Art directory bundling for backgrounds
 */

const path = require('path');
const fs = require('fs');

// Note: FusesPlugin removed as it conflicts with 'start' command in Electron Forge
// Fuses can be applied post-build using @electron/fuses directly if needed

// Check if icon exists and has content
const iconPath = path.join(__dirname, 'assets', 'icons', 'icon.ico');
const hasValidIcon = fs.existsSync(iconPath) && fs.statSync(iconPath).size > 0;

console.log('[Forge Config] Icon path:', iconPath);
console.log('[Forge Config] Icon valid:', hasValidIcon);

module.exports = {
  packagerConfig: {
    asar: true,
    name: 'Ninja Toolkit',
    executableName: 'ninja-toolkit',
    appBundleId: 'com.ninja.toolkit.v11',
    appCategoryType: 'public.app-category.developer-tools',
    // Always include icon now that it's generated
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
      /^\/docs\//,
      /\.md$/,
      /\.log$/,
    ],
    // Extra resources to include - art directory with all media
    extraResource: [
      './art',
      './assets',
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
        iconUrl: 'file://assets/icons/icon.ico',
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

      // Verify icon exists
      if (!hasValidIcon) {
        console.log('[Forge] Generating icons...');
        try {
          require('./scripts/generate-icons.cjs');
        } catch (e) {
          console.warn('[Forge] Could not generate icons:', e.message);
        }
      }
    },
    prePackage: async () => {
      console.log('[Forge] Pre-package: Validating build configuration...');

      // Verify art directory exists
      const artDir = path.join(__dirname, 'art');
      if (!fs.existsSync(artDir)) {
        fs.mkdirSync(artDir, { recursive: true });
        fs.mkdirSync(path.join(artDir, 'images'), { recursive: true });
        fs.mkdirSync(path.join(artDir, 'videos'), { recursive: true });
        console.log('[Forge] Created art directory structure');
      }

      // Count media files
      const imagesDir = path.join(artDir, 'images');
      const videosDir = path.join(artDir, 'videos');
      const imageCount = fs.existsSync(imagesDir)
        ? fs.readdirSync(imagesDir).filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f)).length
        : 0;
      const videoCount = fs.existsSync(videosDir)
        ? fs.readdirSync(videosDir).filter(f => /\.(mp4|webm|mov)$/i.test(f)).length
        : 0;

      console.log(`[Forge] Bundling ${imageCount} images and ${videoCount} videos`);
    },
    postPackage: async (config, result) => {
      console.log('[Forge] Post-package: Build complete');
      console.log(`[Forge] Output: ${result.outputPaths.join(', ')}`);

      // Verify art was copied
      for (const outputPath of result.outputPaths) {
        const resourcesPath = path.join(outputPath, 'resources', 'art');
        if (fs.existsSync(resourcesPath)) {
          console.log(`[Forge] Art directory verified at: ${resourcesPath}`);
        } else {
          console.warn(`[Forge] Warning: Art directory not found at: ${resourcesPath}`);
        }
      }
    },
  },
};
