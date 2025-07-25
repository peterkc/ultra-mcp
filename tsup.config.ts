import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cli.ts'],
  format: ['cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  minify: false,
  shims: true,
  target: 'node18',
  platform: 'node',
  external: [
    // Keep native dependencies external
    '@libsql/client',
    'better-sqlite3',
    // Keep other problematic packages external
    'conf',
  ],
  esbuildOptions(options) {
    // Don't add banner since the source file already has shebang
  },
});