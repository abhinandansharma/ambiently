import { defineConfig } from 'tsup';

const shared = { format: ['esm', 'cjs'] as const, dts: true, sourcemap: true, minify: false, treeshake: true, external: ['react'], splitting: false };

export default defineConfig([
  { ...shared, entry: { index: 'src/index.ts' }, clean: true },
  { ...shared, entry: { react: 'src/react.ts' }, clean: false, treeshake: false, banner: { js: '"use client";' } },
]);
