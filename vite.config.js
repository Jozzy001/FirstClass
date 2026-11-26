import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-512-maskable.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png'],
      manifest: {
        name: 'FirstClass',
        short_name: 'FirstClass',
        description: 'Step-by-step lessons, past-question practice, timed tests and a CGPA tracker.',
        theme_color: '#14171C',
        background_color: '#FAFAF8',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        // The app bundles all course data (lessons + questions) in one file, which is larger than the
        // 2 MiB default. Allow precaching it so students can study offline.
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        // Cache course notes/questions data so students can keep reading
        // material they've already opened even when their data runs out.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firestore-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 14 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      }
    })
  ]
})
