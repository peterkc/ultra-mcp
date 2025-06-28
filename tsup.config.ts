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
  noExternal: [
    // Bundle all node_modules
    /^(?!node:).*/,
  ],
  esbuildOptions(options) {
    // Don't add banner since the source file already has shebang
  },
});