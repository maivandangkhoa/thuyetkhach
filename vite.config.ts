import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Expose PUBLIC_* (Firebase web config) to the client in addition to VITE_*.
  envPrefix: ['VITE_', 'PUBLIC_'],
  server: {
    port: 5174,
    open: false,
    proxy: {
      '/api': {
        target: 'http://localhost:8788',
        changeOrigin: true,
      },
    },
  },
})
