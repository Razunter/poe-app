import { type BuildsData, BuildsDataFileSchema } from '#lib/schema/BuildsData.schema.ts'
import { GameVersionsSchema } from '#lib/schema/GameVersion.schema.ts'
import { compareVersions } from 'compare-versions'
import fs from 'node:fs'
import path from 'node:path'
import * as z from 'zod'

const DataFilenameSchema = z.string().regex(/^data-[^/\\]+\.json$/u)
const JournalSchema = z.object({
  dataFile: DataFilenameSchema,
  dataBefore: z.base64().nullable(),
  versionsBefore: z.base64().nullable(),
})

let pending: Promise<undefined> = Promise.resolve(undefined)

const serialized = async <T>(operation: () => Promise<T>): Promise<T> => {
  const previous = pending
  const deferred = Promise.withResolvers<undefined>()
  pending = deferred.promise
  await previous
  try {
    return await operation()
  } finally {
    deferred.resolve(undefined)
  }
}

const dataFilename = (version: string) => {
  return DataFilenameSchema.parse('data-' + version.replaceAll('.', '-') + '.json')
}

const readOptional = async (file: string): Promise<Buffer | null> => {
  try {
    return await fs.promises.readFile(file)
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return null
    }

    throw error
  }
}

const restore = async (file: string, previous: null | string) => {
  if (previous === null) {
    await fs.promises.rm(file, { force: true })
  } else {
    await fs.promises.writeFile(file + '.restore', Buffer.from(previous, 'base64'))
    await fs.promises.rename(file + '.restore', file)
  }
}

const recover = async (directory: string) => {
  const journalPath = path.join(directory, '.collection-save.json')
  try {
    const raw = await readOptional(journalPath)
    if (raw === null) {
      return
    }

    const journal = JournalSchema.parse(JSON.parse(raw.toString('utf8')))
    await restore(path.join(directory, journal.dataFile), journal.dataBefore)
    await restore(path.join(directory, 'versions.json'), journal.versionsBefore)
    await fs.promises.unlink(journalPath)
  } catch (error) {
    throw new Error(`Collection recovery failed; recovery material remains at ${journalPath}: ${String(error)}`, {
      cause: error,
    })
  }
}

export const loadCollection = (directory: string): Promise<BuildsData> => {
  return serialized(async () => {
    await recover(directory)
    const metadata = GameVersionsSchema.parse(
      JSON.parse(String(await fs.promises.readFile(path.join(directory, 'versions.json')))),
    )
    let raw = await readOptional(path.join(directory, dataFilename(metadata.currentVersion)))
    if (raw === null) {
      const releases = metadata.versions
        .map((release) => release.version)
        .filter((version) => version !== metadata.currentVersion)
        .toSorted((a, b) => compareVersions(b, a))
      for (const version of releases) {
        raw = await readOptional(path.join(directory, dataFilename(version)))
        if (raw !== null) {
          break
        }
      }
    }

    if (raw === null) {
      throw new Error(`No collection file found for ${metadata.currentVersion} or configured releases in ${directory}`)
    }

    const data = BuildsDataFileSchema.parse(JSON.parse(raw.toString('utf8')))
    return { ...data, ...metadata }
  })
}

export const saveCollection = (directory: string, data: BuildsData): Promise<void> => {
  return serialized(async () => {
    await recover(directory)
    const dataFile = dataFilename(data.currentVersion)
    const dataPath = path.join(directory, dataFile)
    const versionsPath = path.join(directory, 'versions.json')
    const journalPath = path.join(directory, '.collection-save.json')
    const dataStage = path.join(directory, '.collection-data.stage')
    const versionsStage = path.join(directory, '.collection-versions.stage')
    const dataBefore = await readOptional(dataPath)
    const versionsBefore = await readOptional(versionsPath)
    const journal = {
      dataFile,
      dataBefore: dataBefore?.toString('base64') ?? null,
      versionsBefore: versionsBefore?.toString('base64') ?? null,
    }

    await fs.promises.writeFile(dataStage, JSON.stringify({ buildList: data.buildList, types: data.types }, null, 2))
    await fs.promises.writeFile(
      versionsStage,
      JSON.stringify({ currentVersion: data.currentVersion, versions: data.versions }, null, 2),
    )
    await fs.promises.writeFile(journalPath + '.pending', JSON.stringify(journal))
    await fs.promises.rename(journalPath + '.pending', journalPath)

    try {
      await fs.promises.rename(dataStage, dataPath)
      await fs.promises.rename(versionsStage, versionsPath)
      // Unlink is the atomic commit point, so recovery never sees partly deleted backups.
      await fs.promises.unlink(journalPath)
    } catch (error) {
      try {
        await recover(directory)
      } catch (recoveryError) {
        throw new Error(`Save failed: ${String(error)}. ${String(recoveryError)}`, {
          cause: new AggregateError([error, recoveryError], 'Collection save and recovery failed'),
        })
      }

      throw error
    }
  })
}
