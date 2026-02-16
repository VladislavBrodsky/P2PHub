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
  publicDir: 'public_safe',
  build: {
    outDir: 'dist',
    sourcemap: true,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui': ['framer-motion', 'lucide-react', 'clsx', 'tailwind-merge'],
          'vendor-utils': ['axios', 'i18next', 'react-i18next'],
          'sentry': ['@sentry/react'],
          'recharts': ['recharts'],
          'tonconnect': ['@tonconnect/ui-react'],
          'telegram': ['@telegram-apps/sdk-react'],
          'tanstack': ['@tanstack/react-query'],
          'avatars': ['/src/data/avatars.ts'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    emptyOutDir: true,
  },
})
