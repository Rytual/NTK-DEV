/**
 * Ninja Toolkit v11 - Vite Configuration for Main Process
 * Compiles src/main.ts for Electron's main process
 *
 * ARCHITECTURE NOTE:
 * Backend modules are CommonJS (.cjs) files that are copied to the build output.
 * main.ts uses require() with try/catch for graceful fallbacks.
 */

import { defineConfig } from 'vite';
import { builtinModules } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';

// Node.js built-in modules to externalize
const builtins = [
  'electron',
  ...builtinModules.map((m) => [m, `node:${m}`]).flat()
];

// Native modules that require native compilation - must be external
const nativeModules = [
  'better-sqlite3',
  'node-pty',
  'cap',
  'serialport',
  'electron-store',
  'keytar',
  'snmp-native'
];

/**
 * Custom plugin to copy backend modules to build output
 */
function copyBackendPlugin() {
  return {
    name: 'copy-backend-modules',
    writeBundle() {
      const srcDir = path.resolve(process.cwd(), 'src');
      const outDir = path.resolve(process.cwd(), '.vite/build');

      // Directories to copy
      const dirs = ['backend', 'core', 'modules'];

      // Copy each directory
      dirs.forEach(dir => {
        const srcPath = path.join(srcDir, dir);
        const destPath = path.join(outDir, dir);

        if (fs.existsSync(srcPath)) {
          copyDirSync(srcPath, destPath);
          console.log(`[copy-backend] Copied ${dir}/ to build output`);
        }
      });
    }
  };
}

/**
 * Recursively copy directory
 */
function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules, renderer, and components directories
      if (['node_modules', 'renderer', 'components', 'types'].includes(entry.name)) continue;
      copyDirSync(srcPath, destPath);
    } else {
      // Copy .cjs, .json, and .mjs files
      const ext = path.extname(entry.name).toLowerCase();
      if (['.cjs', '.json', '.mjs'].includes(ext)) {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

export default defineConfig((env) => {
  const { command } = env;

  /** @type {import('vite').UserConfig} */
  const config = {
    plugins: [
      copyBackendPlugin()
    ],
    build: {
      lib: {
        entry: 'src/main.ts',
        fileName: () => '[name].cjs',
        formats: ['cjs'],
      },
      rollupOptions: {
        external: (id) => {
          // Always externalize electron and node builtins
          if (builtins.includes(id)) return true;

          // Always externalize native modules
          if (nativeModules.includes(id)) return true;

          // Externalize our backend modules (they'll be copied)
          if (id.includes('.cjs')) return true;
          if (id.startsWith('./backend/') || 
              id.startsWith('./core/') || 
              id.startsWith('./modules/')) {
            return true;
          }

          // Externalize node_modules packages
          if (!id.startsWith('.') && !id.startsWith('/') && !path.isAbsolute(id)) {
            return true;
          }

          return false;
        },
        output: {
          interop: 'auto',
          exports: 'auto',
        },
      },
      outDir: '.vite/build',
      emptyOutDir: false,
      watch: command === 'serve' ? {} : null,
      minify: command === 'build',
      sourcemap: true,
    },
    resolve: {
      mainFields: ['module', 'jsnext:main', 'jsnext'],
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.cjs', '.mjs'],
    },
    clearScreen: false,
  };

  return config;
});
