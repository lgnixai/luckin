import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    '@lginxai/luckin-types',
    '@lginxai/luckin-shared',
    '@lginxai/luckin-core-legacy',
    'zustand',
    'immer'
  ]
})