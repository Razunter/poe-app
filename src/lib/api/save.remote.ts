import { command } from '$app/server'
import { JSON_PATH } from '$env/static/private'
import { type BuildsData, BuildsDataSchema } from '$lib/schema/BuildsData.schema.ts'
import { error as kitError } from '@sveltejs/kit'
import fs from 'node:fs'
import path from 'node:path'

const jsonPath = path.normalize(JSON_PATH)

export const saveData = command(BuildsDataSchema, async (data: BuildsData) => {
  const versionsData = {
    currentVersion: data.currentVersion,
    versions: data.versions,
  }

  const finalData: Partial<BuildsData> = structuredClone(data)
  delete finalData.currentVersion
  delete finalData.versions

  // Write versions
  try {
    await Promise.all([
      fs.promises.writeFile(path.join(jsonPath, 'versions.json'), JSON.stringify(versionsData, null, 2)),

      // Write data
      fs.promises.writeFile(
        path.join(jsonPath, 'data-' + versionsData.currentVersion.replaceAll('.', '-') + '.json'),
        JSON.stringify(finalData, null, 2),
      ),
    ])
  } catch (error) {
    throw kitError(500, 'Error: ' + (error instanceof Error ? error.message : error))
  }
})
