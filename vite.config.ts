/// <reference types="vitest" />
import { defineConfig } from 'vite'
import type { UserConfig } from 'vite'
import react from '@vitejs/plugin-react'

type TestConfig = {
  environment: string
  setupFiles: string
  globals: boolean
  css: boolean
  pool: string
  poolOptions: {
    threads: {
      singleThread: boolean
    }
  }
}

type AppConfig = UserConfig & {
  test: TestConfig
}

// https://vite.dev/config/
const config: AppConfig = {
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    globals: true,
    css: true,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
}

export default defineConfig(config)
