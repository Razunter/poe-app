import { query } from '$app/server'
import { JSON_PATH } from '$env/static/private'
import { type BuildsData, BuildsDataFileSchema } from '$lib/schema/BuildsData.schema.ts'
import { GameVersionsSchema } from '$lib/schema/GameVersion.schema.ts'
import { error as kitError } from '@sveltejs/kit'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const jsonPath = path.normalize(JSON_PATH)

const dataMaintenance = (data: BuildsData) => {
  const supportedVersions = data.versions.map((version) => {
    return version.version
  })

  // remove outdated versions
  for (const buildCategory of data.buildList) {
    for (const build of buildCategory.builds) {
      build.versions = build.versions.filter((version) => {
        return supportedVersions.includes(version)
      })
    }
  }

  return data
}

export const loadData = query(async () => {
  let versionsData
  let buildsData

  try {
    const versionsDataRaw = readFileSync(path.join(jsonPath, 'versions.json'), 'utf8')
    versionsData = GameVersionsSchema.parse(JSON.parse(versionsDataRaw))
  } catch (error) {
    throw kitError(500, String(error))
  }

  let file = path.join(jsonPath, 'data-' + versionsData.currentVersion.replaceAll('.', '-')) + '.json'
  if (!existsSync(file)) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we assume there is at least one version defined
    const dataFile = 'data-' + versionsData.versions.at(-1)!.version.replaceAll('.', '-') + '.json'
    file = path.join(jsonPath, dataFile)
  }

  try {
    const dataRaw = readFileSync(file, 'utf8')
    buildsData = BuildsDataFileSchema.parse(JSON.parse(dataRaw))
  } catch (error) {
    throw kitError(500, String(error))
  }

  return dataMaintenance(Object.assign(buildsData, versionsData))
})
