import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import viteCompression from 'vite-plugin-compression';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import { sentryVitePlugin } from "@sentry/vite-plugin";

// #comment: Simplified build configuration to resolve deployment EPERM issues
// and ensure compatibility with Railway monorepo structure.
// Removed non-essential plugins (compression, image-optimizer, pwa) 
// that were causing permission errors in the Docker environment.

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // #comment: Re-enabled compression with safer settings to avoid EPERM
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      deleteOriginFile: false // Safety against EPERM
    }),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      deleteOriginFile: false
    }),
    // #comment: Image optimization with extensive configuration for maximum savings
    ViteImageOptimizer({
      png: { quality: 80 },
      jpeg: { quality: 80 },
      jpg: { quality: 80 },
      tiff: { quality: 80 },
      gif: {},
      webp: { quality: 75, lossless: false },
      avif: { quality: 75, lossless: false },
      cache: false, // Disable cache to prevent permission issues
      // logStats: false, // Reduce noise
    }),
    // Sentry Vite plugin for source map uploads
    sentryVitePlugin({
      authToken: process.env.SENTRY_API_KEY,
      org: "web3-fintech",
      project: "p2phub-frontend",
      disable: !process.env.SENTRY_API_KEY, // Only run if API key is present
    }),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          // #comment: Split vendor-ui into lighter chunks
          'vendor-ui-core': ['clsx', 'tailwind-merge'],
          'vendor-framer': ['framer-motion'],
          'vendor-icons': ['lucide-react'],
          // #comment: Isolated heavy libraries
          'vendor-ton': ['@tonconnect/ui-react', '@telegram-apps/sdk-react'],
          'vendor-charts': ['recharts'],
          'vendor-utils': ['axios', 'zustand', 'i18next', 'react-i18next'],
        },
      }
    },
    chunkSizeWarningLimit: 1200,
    emptyOutDir: true, // Re-enable emptyOutDir for clean builds
  },
})
