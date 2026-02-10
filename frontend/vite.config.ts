import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import viteCompression from 'vite-plugin-compression';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    ViteImageOptimizer({
      png: {
        quality: 80,
      },
      jpeg: {
        quality: 80,
      },
      jpg: {
        quality: 80,
      },
      tiff: {
        quality: 80,
      },
      // gif does not support lossless compression
      // https://sharp.pixelplumbing.com/api-output#gif
      gif: {},
      webp: {
        lossless: true,
      },
      avif: {
        lossless: true,
      },
    }),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
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
          'vendor-ui': ['framer-motion', '@tonconnect/ui-react'],
        },
      }
    },
    chunkSizeWarningLimit: 1000,
  },
})
