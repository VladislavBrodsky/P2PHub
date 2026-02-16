import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { sentryVitePlugin } from "@sentry/vite-plugin"
import viteCompression from 'vite-plugin-compression'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'

// #comment: Performance-optimized configuration
// Re-enabled compression and image optimization with safe settings to avoid EPERM.
// Implemented granular manualChunks for better cache hitting and smaller entry bundles.

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // #comment: Gzip compression for faster delivery on legacy browsers
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      deleteOriginFile: false,
      threshold: 1024,
      verbose: false
    }),
    // #comment: Brotli compression (superior to gzip)
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      deleteOriginFile: false,
      threshold: 1024,
      verbose: false
    }),
    // #comment: Build-time image optimization
    ViteImageOptimizer({
      png: { quality: 80 },
      jpeg: { quality: 80 },
      webp: { quality: 75 },
      avif: { quality: 75 },
      cache: false,
    }),
    // Sentry Vite plugin for error tracking and source map uploads
    sentryVitePlugin({
      authToken: process.env.SENTRY_API_KEY,
      org: "web3-fintech",
      project: "p2phub-frontend",
      disable: !process.env.SENTRY_API_KEY,
    }),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Highly specialized bundles for heavy libraries
            if (id.includes('recharts') || id.includes('d3')) {
              return 'vendor-charts';
            }
            if (id.includes('@tonconnect') || id.includes('@telegram-apps')) {
              return 'vendor-ton';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-framer';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
              return 'vendor-react';
            }
            // Group remaining small utilities
            return 'vendor-utils';
          }
        },
      }
    },
    chunkSizeWarningLimit: 1200,
    emptyOutDir: true,
  },
})
