import { loadCollection } from '#lib/server/collectionPersistence.ts'
import { JSON_PATH } from '$app/env/private'
import { query } from '$app/server'
import { error as kitError } from '@sveltejs/kit'

export const loadData = query(async () => {
  try {
    return await loadCollection(JSON_PATH)
  } catch (error) {
    throw kitError(500, String(error))
  }
})
