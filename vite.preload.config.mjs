/**
 * Ninja Toolkit v11 - Vite Configuration for Preload Script
 * Compiles src/preload.js for Electron's preload context
 */

import { defineConfig } from 'vite';
import { builtinModules } from 'node:module';

// Node.js built-in modules to externalize
const builtins = [
  'electron',
  ...builtinModules.map((m) => [m, `node:${m}`]).flat()
];

export default defineConfig((env) => {
  const { command } = env;

  /** @type {import('vite').UserConfig} */
  const config = {
    build: {
      rollupOptions: {
        external: builtins,
        input: 'src/preload.js',
        output: {
          format: 'cjs',
          // Preload should not be split into chunks
          inlineDynamicImports: true,
          entryFileNames: '[name].cjs',
          chunkFileNames: '[name].cjs',
          assetFileNames: '[name].[ext]',
        },
      },
      outDir: '.vite/build',
      emptyOutDir: false,
      watch: command === 'serve' ? {} : null,
      minify: command === 'build',
      sourcemap: true,
    },
    clearScreen: false,
  };

  return config;
});
