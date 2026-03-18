import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from "@sentry/vite-plugin"

// #comment: EMERGENCY FIX - Removal of manualChunks
// Reverting to Vite's default bundling strategy to resolve module execution order issues.
// The custom chunking was causing "undefined is not an object (evaluating 'yo.useState')" in production.
// Definitively removing all manualChunks and optimization plugins to restore a monolithic-like stable bundle.

// #comment: CACHE BUST - Forced re-evaluation to resolve stale asset references like promo_fixed.jpg
export default defineConfig({
  plugins: [
    react(),
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
  publicDir: 'public',
  build: {
    outDir: 'dist',
    sourcemap: true,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1200,
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // #comment: Strategic splitting to reduce main bundle size while keeping execution order stable.
          if (id.includes('node_modules')) {
            if (id.includes('@telegram-apps') || id.includes('@tonconnect')) return 'vendor-tma';
            if (id.includes('recharts') || id.includes('framer-motion') || id.includes('lucide-react')) return 'vendor-ui';
            return 'vendor'; // All other stable dependencies
          }
        }
      }
    }
  },
})

