import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { sentryVitePlugin } from "@sentry/vite-plugin"

// #comment: EMERGENCY FIX - Removal of manualChunks
// Reverting to Vite's default bundling strategy to resolve module execution order issues.
// The custom chunking was causing "undefined is not an object (evaluating 'yo.useState')" in production.
// Definitively removing all manualChunks and optimization plugins to restore a monolithic-like stable bundle.

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
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
  publicDir: 'app_assets',
  build: {
    outDir: 'dist',
    sourcemap: true,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1200,
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // 1. Heavy UI/Charts (Isolate)
          if (id.includes('node_modules/recharts')) {
            return 'vendor-charts';
          }
          // 2. Framer Motion (Isolate)
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-motion';
          }
          // 3. Lucide Icons (Isolate)
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          // 4. Telegram & Wallet (Isolate)
          if (id.includes('node_modules/@telegram-apps') || id.includes('node_modules/@tonconnect')) {
            return 'vendor-tma';
          }
        }
      }
    }
  },
})

