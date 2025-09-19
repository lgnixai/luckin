import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // 自定义插件来处理插件文件服务
    {
      name: 'plugin-server',
      configureServer(server) {
        server.middlewares.use('/plugins', (req, res, next) => {
          const pluginPath = path.resolve(__dirname, '../../plugins' + req.url);
          if (fs.existsSync(pluginPath) && fs.statSync(pluginPath).isFile()) {
            res.setHeader('Content-Type', 
              req.url?.endsWith('.html') ? 'text/html' :
              req.url?.endsWith('.js') ? 'application/javascript' :
              req.url?.endsWith('.css') ? 'text/css' :
              req.url?.endsWith('.json') ? 'application/json' :
              'text/plain'
            );
            res.setHeader('Access-Control-Allow-Origin', '*');
            const content = fs.readFileSync(pluginPath);
            res.end(content);
          } else {
            next();
          }
        });
      }
    }
  ],
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

