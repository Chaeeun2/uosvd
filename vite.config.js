import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    historyApiFallback: true,
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === 'admin' ? 'admin/assets/admin-[hash].js' : 'assets/[name]-[hash].js'
        },
        chunkFileNames: (chunkInfo) => {
          return chunkInfo.name === 'admin' ? 'admin/assets/admin-[hash].js' : 'assets/[name]-[hash].js'
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'admin.html') {
            return 'admin/index.html'
          }
          if (assetInfo.name.startsWith('admin')) {
            return 'admin/assets/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    },
  },
})
