import { type BuildsData, BuildsDataSchema } from '#lib/schema/BuildsData.schema.ts'
import { saveCollection } from '#lib/server/collectionPersistence.ts'
import { JSON_PATH } from '$app/env/private'
import { command } from '$app/server'
import { error as kitError } from '@sveltejs/kit'

export const saveData = command(BuildsDataSchema, async (data: BuildsData) => {
  try {
    await saveCollection(JSON_PATH, data)
  } catch (error) {
    throw kitError(500, 'Error: ' + (error instanceof Error ? error.message : error))
  }
})
