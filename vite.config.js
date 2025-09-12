import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://script.google.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/macros/s/AKfycbwNjCfGGotnOsri6UHI10Jallh4jNfB8M4RoIPpuYf8MCLddhMb6LMxp4ftbbDwWJDsbA/exec')
      }
    }
  }
})