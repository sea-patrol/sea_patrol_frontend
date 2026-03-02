import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
          registerType: 'autoUpdate',
          devOptions: { enabled: false },
          workbox: {
            globPatterns: ['**/*.{js,css,html,glb,webp,png}'],
            runtimeCaching: [
              {
                urlPattern: /.*\.glb$/,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'glb-cache',
                  expiration: { maxEntries: 30 },
                },
              },
            ],
          },
        })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  assetsInclude: ['**/*.glb', '**/*.gltf'],
  build: {
    outDir: 'dist',
    sourcemap: false, // отключить sourcemaps для уменьшения размера
    minify: 'esbuild', // минификация
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    include: ['src/**/*.test.{js,jsx}'],
    css: true,
  }
})
