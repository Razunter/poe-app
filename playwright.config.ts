import { testArtifactsDirectory } from './tests/testArtifacts.ts'
import { defineConfig } from '@playwright/test'
import { cpSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const collectionPath = process.env.POE_TEST_JSON_PATH ?? mkdtempSync(path.join(tmpdir(), 'poe-app-tests-'))
if (path.dirname(collectionPath) !== tmpdir() || !path.basename(collectionPath).startsWith('poe-app-tests-')) {
  throw new Error('Browser tests require a disposable collection directory')
}

process.env.POE_TEST_JSON_PATH = collectionPath
cpSync('tests/fixtures', collectionPath, { recursive: true })

export default defineConfig({
  testDir: './tests',
  workers: 1,
  outputDir: testArtifactsDirectory,
  globalSetup: fileURLToPath(new URL('tests/testArtifacts.ts', import.meta.url)),
  globalTeardown: './tests/collectionTeardown.ts',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'bun run build && bun run preview --host 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    env: {
      JSON_PATH: collectionPath,
      PUBLIC_ORIGIN: 'http://127.0.0.1:4173',
      YOUTUBE_API_KEY: '',
    },
  },
})
