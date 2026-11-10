import { BuildsDataSchema } from '#lib/schema/BuildsData.schema.ts'
import { saveCollection } from '#lib/server/collectionPersistence.ts'
import fs from 'node:fs'
import path from 'node:path'

const main = async () => {
  const [directory, boundary, rawData] = process.argv.slice(2)
  if (!directory || !boundary || !rawData) {
    throw new Error('Expected directory, interruption boundary and data')
  }

  const rename = fs.promises.rename
  fs.promises.rename = async (source, destination) => {
    await rename(source, destination)
    const filename = path.basename(destination.toString())
    if (
      (boundary === 'data' && filename.startsWith('data-') && filename.endsWith('.json')) ||
      (boundary === 'versions' && filename === 'versions.json')
    ) {
      process.exit(23)
    }
  }

  if (boundary === 'staging') {
    const writeFile = fs.promises.writeFile
    fs.promises.writeFile = async (file, ...arguments_) => {
      await writeFile(file, ...arguments_)
      if (file.toString().endsWith('.pending')) {
        await writeFile(file, '{')
        process.exit(23)
      }
    }
  }

  await saveCollection(directory, BuildsDataSchema.parse(JSON.parse(rawData)))
  throw new Error('Save did not reach the requested interruption boundary')
}

void main().catch((error: unknown) => {
  process.stderr.write((error instanceof Error ? (error.stack ?? error.message) : String(error)) + '\n')
  process.exitCode = 1
})
