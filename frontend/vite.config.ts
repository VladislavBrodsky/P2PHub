import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import viteCompression from 'vite-plugin-compression';
// #comment: Commented out unused VitePWA import to address linting warnings (PWA configuration is currently inactive)
// import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    ViteImageOptimizer({
      png: { quality: 80 },
      jpeg: { quality: 80 },
      jpg: { quality: 80 },
      tiff: { quality: 80 },
      gif: {},
      webp: { quality: 75 },
      avif: { quality: 75 },
    }),
    viteCompression({ algorithm: 'gzip', ext: '.gz' }),
    viteCompression({ algorithm: 'brotliCompress', ext: '.br' }),
    /*
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Pintopay Partner Hub',
        short_name: 'P2PHub',
        description: 'The ultimate partner hub for Pintopay.',
        theme_color: '#0f172a',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
    */
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui': ['framer-motion', 'lucide-react', 'clsx', 'tailwind-merge'],
          'vendor-ton': ['@tonconnect/ui-react', '@telegram-apps/sdk-react'],
          'vendor-utils': ['axios', 'zustand', 'i18next', 'react-i18next'],
          'vendor-charts': ['recharts'],
        },
      }
    },
    chunkSizeWarningLimit: 1000,
  },
})
