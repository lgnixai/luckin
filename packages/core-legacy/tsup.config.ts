import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false, // 暂时禁用 DTS 构建以避免 TypeScript 配置问题
  splitting: false,
  sourcemap: false, // 暂时禁用 sourcemap 以避免构建问题
  clean: true,
  external: ['react', 'react-dom'],
  treeshake: true,
})

