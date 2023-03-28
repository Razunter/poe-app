import type {PageLoad} from './$types'
import {error as kitError} from '@sveltejs/kit'
import type {BuildsDataType} from '$lib/BuildsData'

export const prerender = true

export const load: PageLoad = async ({fetch}) => {
  const response = await fetch('/api/load', {
    method: 'GET',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
  })

  const data = await response.json() as BuildsDataType | Error

  if (response.status !== 200) {
    throw kitError(500, 'message' in data ? data.message : 'data')
  }

  return {
    buildData: data,
  }
}
