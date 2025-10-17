import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa';

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
  assetsInclude: ['**/*.glb', '**/*.gltf'],
  build: {
    outDir: 'dist',
    sourcemap: false, // отключить sourcemaps для уменьшения размера
    minify: 'esbuild', // минификация
  }
})
