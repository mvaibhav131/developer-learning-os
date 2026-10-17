import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['esm'],
  target: 'node22',
  platform: 'node',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  // Workspace packages ship TypeScript source, so they must be bundled into the server.
  noExternal: [/^@dlos\//],
  // Some bundled CommonJS dependencies (yaml, sucrase) call require() for Node built-ins, which an ES module does not have.
  banner: {
    js: "import { createRequire as __dlosCreateRequire } from 'node:module';\nconst require = __dlosCreateRequire(import.meta.url);",
  },
});
