/**
 * Ninja Toolkit v11 - Vite Configuration for Main Process
 * Compiles src/main.ts for Electron's main process
 */

import { defineConfig, mergeConfig } from 'vite';
import { builtinModules } from 'node:module';

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
  'keytar'
];

// All external dependencies
const external = [...builtins, ...nativeModules];

export default defineConfig((env) => {
  const { command, mode } = env;

  /** @type {import('vite').UserConfig} */
  const config = {
    build: {
      lib: {
        entry: 'src/main.ts',
        fileName: () => '[name].cjs',
        formats: ['cjs'],
      },
      rollupOptions: {
        external,
      },
      outDir: '.vite/build',
      emptyOutDir: false,
      watch: command === 'serve' ? {} : null,
      minify: command === 'build',
      sourcemap: true,
    },
    resolve: {
      // Load the Node.js entry
      mainFields: ['module', 'jsnext:main', 'jsnext'],
    },
    clearScreen: false,
  };

  return config;
});
