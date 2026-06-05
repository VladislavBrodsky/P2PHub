import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'
import { sentryVitePlugin } from "@sentry/vite-plugin"

// #comment: EMERGENCY FIX - Removal of manualChunks
// Reverting to Vite's default bundling strategy to resolve module execution order issues.
// The custom chunking was causing "undefined is not an object (evaluating 'yo.useState')" in production.
// Definitively removing all manualChunks and optimization plugins to restore a monolithic-like stable bundle.

// #comment: CACHE BUST - Forced re-evaluation to resolve stale asset references like promo_fixed.jpg
export default defineConfig({
  plugins: [
    react(),
    tailwind(),
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
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/generated_media': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/images': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  publicDir: 'public',
  build: {
    outDir: 'dist',
    sourcemap: true,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1200,
    emptyOutDir: true,
    // #comment: Performance - Enable modern target for better tree-shaking and smaller output
    target: 'es2022',
    // #comment: Performance - Minify with esbuild (default, fast)
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // #comment: Performance - Stable asset naming for aggressive CDN/browser caching
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        manualChunks(id) {
          // #comment: Strategic splitting to reduce main bundle size while keeping execution order stable.
          if (id.includes('node_modules')) {
            if (id.includes('@telegram-apps') || id.includes('@tonconnect')) return 'vendor-tma';
            if (id.includes('recharts') || id.includes('framer-motion') || id.includes('lucide-react')) return 'vendor-ui';
            if (id.includes('i18next') || id.includes('react-i18next')) return 'vendor-i18n';
            return 'vendor'; // All other stable dependencies
          }
        }
      }
    }
  },
})
