import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    '@lgnixai/luckin-types',
    '@lgnixai/luckin-shared',
    '@lgnixai/luckin-core-legacy',
    'zustand',
    'immer'
  ]
})