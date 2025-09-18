import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 9000, // Use port 9000 instead
    strictPort: false, // Allow fallback to another port if 9000 is busy
  }
})