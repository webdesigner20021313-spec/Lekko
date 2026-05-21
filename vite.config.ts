import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS ? '/Lekko/' : '/',
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    allowedHosts: ['.ngrok-free.app', '.ngrok.app', '.ngrok.io'],
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/hub': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
