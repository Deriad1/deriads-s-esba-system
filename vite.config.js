import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 9000,
    strictPort: false,
    hmr: {
      port: 9000
    },
    // Proxy API requests to production server
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying:', req.method, req.url);
          });
        }
      }
    }
  },
  build: {
    // ✅ PERFORMANCE FIX: Optimize bundle splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries (loaded on every page)
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],

          // PDF generation (lazy loaded only when printing)
          'vendor-pdf': ['jspdf', 'jspdf-autotable', 'pdf-lib'],

          // Excel handling (lazy loaded only for bulk upload)
          'vendor-excel': ['xlsx'],

          // Charts (lazy loaded only for analytics)
          'vendor-charts': ['recharts'],

          // Security and validation utilities
          'vendor-utils': ['dompurify', 'isomorphic-dompurify', 'sanitize-html', 'validator'],

          // Authentication libraries
          'vendor-auth': ['bcryptjs', 'jsonwebtoken']
        }
      }
    },
    // Warn if chunks exceed 500KB
    chunkSizeWarningLimit: 500,

    // Disable sourcemaps in production for smaller bundle
    sourcemap: false,

    // Use esbuild for faster minification (built-in, no extra dependency needed)
    minify: 'esbuild'
  }
})