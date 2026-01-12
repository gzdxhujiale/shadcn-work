import path from 'node:path'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'

import configWriter from './plugins/vite-plugin-config-writer'

export default defineConfig({
  plugins: [vue(), tailwindcss(), configWriter()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
