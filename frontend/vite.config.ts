import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { sentryVitePlugin } from "@sentry/vite-plugin"

// #comment: Stability-focused configuration
// Disabled experimental optimizations (compression, image optimizer, granular manualChunks) 
// to resolve build errors (EPERM) and potential module loading issues causing the white screen.
// A monolithic vendor chunk strategy is safer for ensuring total dependency availability during startup.

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
  build: {
    outDir: 'dist',
    sourcemap: true,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor'; // Single vendor chunk for maximum reliability
          }
        },
      }
    },
    chunkSizeWarningLimit: 2000,
    emptyOutDir: true,
  },
})
