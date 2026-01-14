import path from 'node:path'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'

import configWriter from './plugins/vite-plugin-config-writer'

export default defineConfig({
  plugins: [vue(), tailwindcss(), configWriter()],
  base: '/AIGen-UI/', // Deploying to https://github.com/gzdxhujiale/AIGen-UI
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // Proxy Coze API requests to bypass CORS
      '/api/coze': {
        target: 'https://api.coze.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/coze/, ''),
        headers: {
          'Origin': 'https://api.coze.cn',
        },
      },
    },
  },
})

