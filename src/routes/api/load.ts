// eslint-disable-next-line canonical/filename-match-exported
import { readFileSync, existsSync } from 'node:fs'
import path from 'path'
// eslint-disable-next-line import/no-unassigned-import
// import 'dotenv/config'

const jsonPath = path.normalize(import.meta.env.VITE_jsonPath as string)

/** @type {import('@sveltejs/kit').RequestHandler} */
export const GET = async () => {
  let versionsData
  let errorText = ''
  let buildsData

  try {
    const versionsDataRaw = readFileSync(path.join(jsonPath, 'versions.json'), 'utf8')
    versionsData = JSON.parse(versionsDataRaw)
  } catch (error) {
    errorText = String(error)
  }

  let file = path.join(jsonPath, 'data-' + versionsData.currentVersion.replace('.', '-')) + '.json'
  if (!existsSync(file)) {
    const dataFile = 'data-' + versionsData.versions[versionsData.versions.length - 1].version.replace('.', '-') + '.json'
    file = path.join(jsonPath, dataFile)
  }

  try {
    const dataRaw = readFileSync(file, 'utf8')
    buildsData = JSON.parse(dataRaw)
  } catch (error) {
    errorText += String(error)
  }

  const response = {
    status: 200,
    headers: {
      'access-control-allow-origin': '*',
    },
    body: {},
  }

  if (errorText) {
    response.status = 500
    response.body = {
      errorText,
    }
  } else {
    response.body = Object.assign(buildsData, versionsData)
  }

  return response
}
