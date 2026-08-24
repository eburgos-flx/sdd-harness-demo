import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  root: resolve(__dirname),
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [tailwindcss(), react()],
  server: { port: 4200, host: 'localhost' },
  build: {
    outDir: resolve(__dirname, '../../dist/apps/webapp'),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@shared-types': resolve(__dirname, '../../libs/shared-types/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [resolve(__dirname, 'src/test-setup.ts')],
    include: ['src/**/*.spec.{ts,tsx}'],
  },
});
