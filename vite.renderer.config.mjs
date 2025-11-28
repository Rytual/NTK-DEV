/**
 * Ninja Toolkit v11 - Vite Configuration for Renderer Process
 * Compiles the React frontend application
 *
 * Performance Targets (Phase 8):
 * - Module swap: <100ms
 * - RAM usage: <500MB dev, <400MB prod
 * - Animation CPU: <5%
 * - Initial load: <2s
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Production build optimizations
const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig((env) => {
  const { command, mode } = env;

  /** @type {import('vite').UserConfig} */
  const config = {
    root: path.resolve(__dirname, 'src'),
    mode,
    base: './',
    plugins: [
      react({
        // Optimize React refresh in development
        fastRefresh: true,
      }),
    ],
    css: {
      postcss: {
        plugins: [
          tailwindcss(),
          autoprefixer(),
        ],
      },
      // Extract CSS in production for better caching
      devSourcemap: true,
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
      // Only generate sourcemaps in dev or when SOURCEMAP env is set
      sourcemap: command !== 'build' || process.env.SOURCEMAP === 'true',
      minify: command === 'build' ? 'esbuild' : false,
      // Target modern browsers for better optimization
      target: 'chrome120',
      // Inline small assets to reduce HTTP requests
      assetsInlineLimit: 8192, // 8KB
      // Chunk size warnings
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        input: path.resolve(__dirname, 'src/index.html'),
        output: {
          // Strategic chunk splitting for optimal loading
          manualChunks: {
            // Core React - loaded immediately
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            // Animation library - commonly used
            'framer': ['framer-motion'],
            // UI icons - shared across modules
            'icons': ['@heroicons/react', 'lucide-react'],
            // Charts - loaded when needed
            'charts': ['recharts'],
            // UI primitives - frequently used
            'ui-primitives': ['@radix-ui/react-tooltip', '@radix-ui/react-dialog'],
          },
          // Optimize chunk naming for better caching
          chunkFileNames: (chunkInfo) => {
            const name = chunkInfo.name || 'chunk';
            return `assets/${name}-[hash].js`;
          },
          assetFileNames: 'assets/[name]-[hash][extname]',
          entryFileNames: 'assets/[name]-[hash].js',
        },
        // Tree-shake unused exports
        treeshake: {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
        },
      },
      // CSS optimization
      cssCodeSplit: true,
      // Reduce console output
      reportCompressedSize: false,
    },
    server: {
      port: 5173,
      strictPort: true,
      // Warm up frequently used dependencies
      warmup: {
        clientFiles: [
          './renderer/App.tsx',
          './components/layout/Sidebar.tsx',
          './pages/Dashboard.tsx',
        ],
      },
    },
    optimizeDeps: {
      // Don't try to optimize these - they're for main process only
      exclude: ['electron', 'node-pty', 'better-sqlite3', 'cap', 'serialport'],
      // Pre-bundle frequently used dependencies
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'framer-motion',
        'clsx',
        'tailwind-merge',
      ],
    },
    // Performance hints
    esbuild: {
      // Drop console.log in production
      drop: command === 'build' ? ['console', 'debugger'] : [],
      // Legal comments extraction
      legalComments: 'none',
    },
    clearScreen: false,
  };

  return config;
});
