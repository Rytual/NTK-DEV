/**
 * Build script for Ninja Toolkit main process
 * Compiles src/main.ts to dist/main.cjs using esbuild
 */
import * as esbuild from 'esbuild';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// Ensure dist directory exists
if (!existsSync(join(projectRoot, 'dist'))) {
  mkdirSync(join(projectRoot, 'dist'), { recursive: true });
}

console.log('[Build] Compiling main process...');

try {
  await esbuild.build({
    entryPoints: [join(projectRoot, 'src/main.ts')],
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'cjs',
    outfile: join(projectRoot, 'dist/main.cjs'),
    external: [
      'electron',
      'electron-squirrel-startup',
      // Externalize native modules that would break
      'better-sqlite3',
      'node-pty',
      'cap',
      // Externalize other electron-specific
      'fsevents'
    ],
    banner: {
      js: `
// Polyfill for ESM compatibility in CJS output
const { createRequire: __createRequire } = require('module');
const { pathToFileURL: __pathToFileURL } = require('url');
const __import_meta_url = __pathToFileURL(__filename).href;
      `.trim()
    },
    define: {
      'import.meta.url': '__import_meta_url'
    },
    sourcemap: true,
    minify: false, // Keep readable for debugging
    treeShaking: true
  });

  console.log('[Build] Main process compiled to dist/main.cjs');

  // Copy preload.js to dist
  if (existsSync(join(projectRoot, 'src/preload.js'))) {
    copyFileSync(
      join(projectRoot, 'src/preload.js'),
      join(projectRoot, 'dist/preload.js')
    );
    console.log('[Build] Copied preload.js to dist/');
  }

  // Copy backend files to dist
  const backendFiles = ['mediaLoaderBridge.js', 'server.js', 'db-init.js'];
  mkdirSync(join(projectRoot, 'dist/backend'), { recursive: true });
  for (const file of backendFiles) {
    const src = join(projectRoot, 'src/backend', file);
    if (existsSync(src)) {
      copyFileSync(src, join(projectRoot, 'dist/backend', file));
      console.log(`[Build] Copied backend/${file} to dist/`);
    }
  }

  // Copy core/media folder to dist
  const coreMediaPath = join(projectRoot, 'src/core/media');
  if (existsSync(coreMediaPath)) {
    const coreMediaFiles = ['index.js', 'MediaLoader.js'];
    mkdirSync(join(projectRoot, 'dist/core/media'), { recursive: true });
    for (const file of coreMediaFiles) {
      const src = join(coreMediaPath, file);
      if (existsSync(src)) {
        copyFileSync(src, join(projectRoot, 'dist/core/media', file));
        console.log(`[Build] Copied core/media/${file} to dist/`);
      }
    }
  }

  console.log('[Build] Main process build complete!');

} catch (error) {
  console.error('[Build] Failed:', error);
  process.exit(1);
}
