// eslint-disable-next-line canonical/filename-match-exported
import { error as kitError, type RequestHandler } from '@sveltejs/kit'
import { JSON_PATH } from '$env/static/private'
import { type BuildsDataType } from '$lib/BuildsData.ts'
import fs from 'node:fs'
import path from 'node:path'

const jsonPath = path.normalize(JSON_PATH)

export const POST = (async ({ request }) => {
  const data = (await request.json()) as BuildsDataType

  if (!data) {
    throw kitError(400, 'No data received')
  }

  const versionsData = {
    currentVersion: data.currentVersion,
    versions: data.versions,
  }

  const finalData: Partial<BuildsDataType> = structuredClone(data)
  delete finalData.currentVersion
  delete finalData.versions

  // Write versions
  try {
    await Promise.all([
      fs.promises.writeFile(path.join(jsonPath, 'versions.json'), JSON.stringify(versionsData, null, 2)),

      // Write data
      fs.promises.writeFile(
        path.join(jsonPath, 'data-' + versionsData.currentVersion.replace('.', '-') + '.json'),
        JSON.stringify(finalData, null, 2),
      ),
    ])
  } catch (error) {
    throw kitError(500, 'Error: ' + (error instanceof Error ? error.message : error))
  }

  return new Response('File saved successfully')
}) satisfies RequestHandler
