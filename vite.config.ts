import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
const baseConfig: any = {
  plugins: [react()],
}

// Attach vitest config without breaking TS when vitest types are absent
baseConfig.test = {
  environment: 'jsdom',
  setupFiles: './src/setupTests.ts',
  globals: true,
  css: true,
  pool: 'threads',
  maxThreads: 1,
  minThreads: 1,
  poolOptions: {
    threads: {
      singleThread: true,
    },
  },
}

export default defineConfig(baseConfig)
