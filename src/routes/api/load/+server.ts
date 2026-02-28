import { JSON_PATH } from '$env/static/private'
import { json, error as kitError, type RequestHandler } from '@sveltejs/kit'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const jsonPath = path.normalize(JSON_PATH)

export const GET: RequestHandler = async () => {
  let versionsData
  let buildsData

  try {
    const versionsDataRaw = readFileSync(path.join(jsonPath, 'versions.json'), 'utf8')
    versionsData = JSON.parse(versionsDataRaw)
  } catch (error) {
    throw kitError(500, String(error))
  }

  let file = path.join(jsonPath, 'data-' + versionsData.currentVersion.replaceAll('.', '-')) + '.json'
  if (!existsSync(file)) {
    const dataFile = 'data-' + versionsData.versions.at(-1).version.replaceAll('.', '-') + '.json'
    file = path.join(jsonPath, dataFile)
  }

  try {
    const dataRaw = readFileSync(file, 'utf8')
    buildsData = JSON.parse(dataRaw)
  } catch (error) {
    throw kitError(500, String(error))
  }

  const response = {
    status: 200,
    body: {},
  }

  response.body = Object.assign(buildsData, versionsData)

  return json(response.body)
}
