import { defineConfig } from '@playwright/test'
import path from 'node:path'

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://127.0.0.1:4173',
  },
  webServer: {
    command: 'bun run build && bun run preview --host 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    env: {
      JSON_PATH: path.resolve('tests/fixtures'),
      PUBLIC_ORIGIN: 'http://127.0.0.1:4173',
      YOUTUBE_API_KEY: '',
    },
  },
})
