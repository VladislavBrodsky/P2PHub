import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// #comment: Simplified build configuration to resolve deployment EPERM issues
// and ensure compatibility with Railway monorepo structure.
// Removed non-essential plugins (compression, image-optimizer, pwa) 
// that were causing permission errors in the Docker environment.

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
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
    chunkSizeWarningLimit: 1200,
    emptyOutDir: false,
  },
})
