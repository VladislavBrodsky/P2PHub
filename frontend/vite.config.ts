import { defineConfig, splitVendorChunkPlugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'
import { sentryVitePlugin } from "@sentry/vite-plugin"
import viteCompression from 'vite-plugin-compression'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'

// #comment: EMERGENCY FIX - Removal of manualChunks
// Reverting to Vite's default bundling strategy to resolve module execution order issues.
// The custom chunking was causing "undefined is not an object (evaluating 'yo.useState')" in production.
// Definitively removing all manualChunks and optimization plugins to restore a monolithic-like stable bundle.

// #comment: CACHE BUST - Forced re-evaluation to resolve stale asset references like promo_fixed.jpg
export default defineConfig({
  plugins: [
    react(),
    tailwind(),
    splitVendorChunkPlugin(),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
    ViteImageOptimizer({
      png: { quality: 80 },
      jpeg: { quality: 80 },
      jpg: { quality: 80 },
      webp: { lossy: true, quality: 80 },
      avif: { lossy: true, quality: 75 },
    }),
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
      }
    }
  },
})
