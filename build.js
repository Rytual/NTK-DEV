const esbuild = require('esbuild');
const { writeFileSync } = require('fs');

esbuild.build({
  entryPoints: ['src/main.js'],
  bundle: true,
  external: ['electron'],
  outfile: 'dist/main.js',
  platform: 'node',
  target: 'node18',
  format: 'cjs',
}).then(() => {
  esbuild.build({
    entryPoints: ['src/renderer.js'],
    bundle: true,
    outfile: 'dist/renderer.js',
    format: 'iife',
  }).then(() => {
    console.log('Build complete! EXE in dist/');
  });
});
