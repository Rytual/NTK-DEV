import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Ninja Toolkit v11 - Vite Configuration
 * Complete 11-Module Integration with GLOBAL MediaLoader
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/core': path.resolve(__dirname, './src/core'),
      '@/modules': path.resolve(__dirname, './src/modules'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/types': path.resolve(__dirname, './src/types')
    }
  },
  server: {
    port: 5173,
    strictPort: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'framer': ['framer-motion'],
          'icons': ['@heroicons/react', 'lucide-react'],
          'charts': ['recharts'],
          'three': ['three']
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['node-pty', 'better-sqlite3', 'cap']
  },
  define: {
    '__APP_VERSION__': JSON.stringify('11.0.0')
  }
});
