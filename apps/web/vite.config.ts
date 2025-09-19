import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

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
      {
        find: '@lgnixai/luckin-core-legacy',
        replacement: path.resolve(__dirname, '../../packages/core-legacy/src'),
      },
      {
        find: '@lgnixai/luckin-shared',
        replacement: path.resolve(__dirname, '../../packages/shared/src'),
      },
      {
        find: '@lgnixai/luckin-types',
        replacement: path.resolve(__dirname, '../../packages/types/src'),
      },
    ],
  },
  server: {
    port: 3000,
  },
})

