/**
 * Ninja Toolkit v11 - Vite Configuration for Renderer Process
 * Compiles the React frontend application
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig((env) => {
  const { command, mode } = env;

  /** @type {import('vite').UserConfig} */
  const config = {
    root: path.resolve(__dirname, 'src'),
    mode,
    base: './',
    plugins: [react()],
    css: {
      postcss: {
        plugins: [
          tailwindcss(),
          autoprefixer(),
        ],
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@/core': path.resolve(__dirname, './src/core'),
        '@/modules': path.resolve(__dirname, './src/modules'),
        '@/components': path.resolve(__dirname, './src/components'),
        '@/lib': path.resolve(__dirname, './src/lib'),
        '@/types': path.resolve(__dirname, './src/types')
      },
      preserveSymlinks: true,
    },
    build: {
      outDir: path.resolve(__dirname, '.vite/renderer/main_window'),
      emptyOutDir: true,
      sourcemap: true,
      minify: command === 'build' ? 'esbuild' : false,
      rollupOptions: {
        input: path.resolve(__dirname, 'src/index.html'),
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'framer': ['framer-motion'],
            'icons': ['@heroicons/react', 'lucide-react'],
            'charts': ['recharts'],
          }
        }
      }
    },
    server: {
      port: 5173,
      strictPort: true,
    },
    optimizeDeps: {
      // Don't try to optimize these - they're for main process only
      exclude: ['electron', 'node-pty', 'better-sqlite3', 'cap', 'serialport']
    },
    clearScreen: false,
  };

  return config;
});
