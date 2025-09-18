import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /^@\/(.*)$/,
        replacement: path.resolve(__dirname, '../../packages/ui/src/$1'),
      },
      {
        find: '@',
        replacement: path.resolve(__dirname, './src'),
      },
      {
        find: '@lgnixai/luckin-core',
        replacement: path.resolve(__dirname, '../../packages/core/src'),
      },
      {
        find: '@lgnixai/luckin-ui',
        replacement: path.resolve(__dirname, '../../packages/ui/src'),
      },
      // legacy alias no longer needed after compat migration
    ],
  },
  server: {
    port: 3000,
  },
})

