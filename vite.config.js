import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  root: 'app-src',
  publicDir: false,
  base: './',
  build: {
    outDir: '../www',
    emptyOutDir: true,
    rollupOptions: {
      input: fileURLToPath(new URL('./app-src/index.html', import.meta.url))
    }
  }
});
