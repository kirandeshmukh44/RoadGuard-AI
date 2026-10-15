import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'AI Pothole Detection & Road Monitoring',
        short_name: 'PotholeDetect',
        description: 'Smart city infrastructure monitoring using AI/ML for pothole detection and road condition assessment',
        theme_color: '#f5f7f3',
        background_color: '#f5f7f3',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/pothole-72.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/pothole-96.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/pothole-128.png',
            sizes: '128x128',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/pothole-144.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/pothole-152.png',
            sizes: '152x152',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/pothole-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/pothole-384.png',
            sizes: '384x384',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/pothole-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        categories: ['utilities', 'productivity'],
        shortcuts: [
          {
            name: 'Detect Potholes',
            short_name: 'Detect',
            description: 'Upload image for AI pothole detection',
            url: '/detect',
            icons: [{ src: '/icons/detect-96.png', sizes: '96x96' }]
          },
          {
            name: 'Report Pothole',
            short_name: 'Report',
            description: 'Manually report a pothole',
            url: '/report',
            icons: [{ src: '/icons/report-96.png', sizes: '96x96' }]
          },
          {
            name: 'My Reports',
            short_name: 'Reports',
            description: 'View your pothole reports',
            url: '/my-reports',
            icons: [{ src: '/icons/reports-96.png', sizes: '96x96' }]
          }
        ],
        screenshots: [],
        prefer_related_applications: false
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            urlPattern: /^https:\/\/api\.mapbox\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mapbox-tiles',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          },
          {
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 1 day
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${process.env.API_PORT || 8005}`,
        changeOrigin: true,
      },
      '/uploads': {
        target: `http://127.0.0.1:${process.env.API_PORT || 8005}`,
        changeOrigin: true,
      },
      '/reports': {
        target: `http://127.0.0.1:${process.env.API_PORT || 8005}`,
        changeOrigin: true,
      },
      '/ws': {
        target: `ws://127.0.0.1:${process.env.API_PORT || 8005}`,
        ws: true,
      },
    },
  },
})
