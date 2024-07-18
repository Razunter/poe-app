import type { PageLoad } from './$types'
import { error as kitError } from '@sveltejs/kit'
import type { BuildsDataType } from '$lib/BuildsData.ts'

const dataMaintenance = (data: BuildsDataType) => {
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

export const load: PageLoad = async ({ fetch }) => {
  const response = await fetch('/api/load', {
    method: 'GET',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
  })

  const data = (await response.json()) as BuildsDataType | Error

  if (response.status !== 200 || data instanceof Error) {
    throw kitError(500, 'message' in data ? data.message : 'data')
  }

  const cleanedData = dataMaintenance(data)

  return {
    buildsData: cleanedData,
  }
}
