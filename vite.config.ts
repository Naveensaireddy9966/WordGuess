import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import fs from 'fs';
import { cp } from 'fs/promises';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'copy-static-files',
        async writeBundle() {
          // Copy manifest.json and service-worker.js to dist root
          try {
            await cp(path.resolve(__dirname, 'manifest.json'), path.resolve(__dirname, 'dist/manifest.json'));
            await cp(path.resolve(__dirname, 'public/service-worker.js'), path.resolve(__dirname, 'dist/service-worker.js'));
          } catch (e) {
            console.warn('Could not copy static files:', e);
          }
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
