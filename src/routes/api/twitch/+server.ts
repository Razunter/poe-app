// eslint-disable-next-line canonical/filename-match-exported
import { ApiClient } from '@twurple/api'
import { AppTokenAuthProvider } from '@twurple/auth'
import { env } from '$env/dynamic/private'
import { Router } from 'express'

const router = Router()

router.use('/twitch', (request, response) => {
  const TwitchAuthProvider = new AppTokenAuthProvider(env.TwitchClientId, env.TwitchClientSecret)
  const TwitchApiClient = new ApiClient({ authProvider: TwitchAuthProvider })

  if (request.query.videoID) {
    TwitchApiClient.videos.getVideoById(request.query.videoID as string).then((value) => {
      response.json(value)
    }, (error) => {
      response.send('Error: ' + error)
    })
  } else {
    response.send('Error: No VideoID')
  }
})

export default router
