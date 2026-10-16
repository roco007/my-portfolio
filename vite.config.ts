import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  },
  server: {
    port: 3000,
    open: false,
    host: true, // Exposes server on local network IP (0.0.0.0)
  },
  preview: {
    port: 3000,
    host: true,
  },
});
