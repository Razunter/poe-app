import { defineEnvVars } from '@sveltejs/kit/env'

export const variables = defineEnvVars({
  YOUTUBE_API_KEY: { static: true },
  JSON_PATH: { static: true },
})
