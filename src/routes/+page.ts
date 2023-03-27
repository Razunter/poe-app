import type {PageLoad} from './$types'
import {error as kitError} from '@sveltejs/kit'

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

  const data = await response.json()

  if (response.status !== 200) {
    throw kitError(500, data.message)
  }

  return {
    buildData: data,
  }
}
