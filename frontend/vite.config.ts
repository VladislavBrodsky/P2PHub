import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
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
          'vendor-react': ['react', 'react-dom', 'framer-motion', 'zustand'],
          'vendor-tma': ['@telegram-apps/sdk', '@telegram-apps/sdk-react'],
          'vendor-ton': ['@tonconnect/ui-react'],
          'vendor-utils': ['axios', 'lucide-react', 'i18next', 'react-i18next']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  },
})
