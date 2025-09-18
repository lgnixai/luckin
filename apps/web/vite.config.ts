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
        find: '@lginxai/luckin-core',
        replacement: path.resolve(__dirname, '../../packages/core/src'),
      },
      {
        find: '@lginxai/luckin-ui',
        replacement: path.resolve(__dirname, '../../packages/ui/src'),
      },
      {
        find: '@lginxai/luckin-core-legacy',
        replacement: path.resolve(__dirname, '../../packages/core-legacy/src'),
      },
    ],
  },
  server: {
    port: 3000,
  },
})

