// eslint-disable-next-line canonical/filename-match-exported
import { error, json, type RequestHandler } from '@sveltejs/kit'
import { ApiClient } from '@twurple/api'
import { AppTokenAuthProvider } from '@twurple/auth'
import { TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET } from '$env/static/private'

export const GET: RequestHandler = (async ({ url }) => {
  const videoID = url.searchParams.get('videoID')

  if (!videoID) {
    throw error(400, 'Error: No VideoID')
  }

  const TwitchAuthProvider = new AppTokenAuthProvider(TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET)
  const TwitchApiClient = new ApiClient({ authProvider: TwitchAuthProvider })

  try {
    const videoData = await TwitchApiClient.videos.getVideoById(videoID)

    return json(videoData)
  } catch (error_) {
    throw error(500, error_ instanceof Error ? error_.message : String(error_))
  }
}) satisfies RequestHandler
