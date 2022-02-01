// eslint-disable-next-line canonical/filename-match-exported
import { ApiClient } from '@twurple/api'
import { ClientCredentialsAuthProvider } from '@twurple/auth'
import { Router } from 'express'
// eslint-disable-next-line import/no-unassigned-import
// import 'dotenv/config'

const router = Router()

router.use('/twitch', (request, ressponse) => {
  const TwitchAuthProvider = new ClientCredentialsAuthProvider(import.meta.env.VITE_TwitchClientId as string, import.meta.env.VITE_TwitchClientSecret as string)
  const TwitchApiClient = new ApiClient({ authProvider: TwitchAuthProvider })

  if (request.query.videoID) {
    TwitchApiClient.videos.getVideoById(request.query.videoID as string).then((value) => {
      ressponse.json(value)
    }, (error) => {
      ressponse.send('Error: ' + error)
    })
  } else {
    ressponse.send('Error: No VideoID')
  }
})

export default router
