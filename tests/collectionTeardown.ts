import { rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

export default function collectionTeardown() {
  const collectionPath = process.env.POE_TEST_JSON_PATH
  if (collectionPath?.startsWith(path.join(tmpdir(), 'poe-app-tests-'))) {
    rmSync(collectionPath, { recursive: true, force: true })
  }
}
