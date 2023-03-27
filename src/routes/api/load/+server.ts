// eslint-disable-next-line canonical/filename-match-exported
import type {RequestHandler} from './$types'
import {error as kitError} from '@sveltejs/kit'
import {env} from '$env/dynamic/private'
import {existsSync, readFileSync} from 'node:fs'
import path from 'path'
// eslint-disable-next-line import/no-unassigned-import
// import 'dotenv/config'

const jsonPath = path.normalize(env.jsonPath)

export const GET: RequestHandler = async () => {
  let versionsData
  let buildsData

  try {
    const versionsDataRaw = readFileSync(path.join(jsonPath, 'versions.json'), 'utf8')
    versionsData = JSON.parse(versionsDataRaw)
  } catch (error) {
    throw kitError(500, String(error))
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
    throw kitError(500, String(error))
  }

  const response = {
    status: 200,
    body: {},
  }

  response.body = Object.assign(buildsData, versionsData)

  return new Response(JSON.stringify(response.body), {
    status: response.status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      // 'access-control-allow-origin': '*',
    },
  })
}
