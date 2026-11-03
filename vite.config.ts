import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { port: 5183, host: '127.0.0.1' },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    target: 'es2020',
    chunkSizeWarningLimit: 2000
  }
});
