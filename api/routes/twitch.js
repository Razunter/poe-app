import { Router } from 'express'
import { ApiClient } from '@twurple/api'
import { ClientCredentialsAuthProvider } from '@twurple/auth'

const router = Router()

router.use('/proxy/twitch', async (req, res) => {
  const TwitchAuthProvider = new ClientCredentialsAuthProvider(process.env.TwitchClientId, process.env.TwitchClientSecret)
  const TwitchApiClient = new ApiClient({ authProvider: TwitchAuthProvider })

  await TwitchApiClient.videos.getVideoById(req.body.videoID).then((value) => {
    res.end(JSON.stringify(value))
  }, (error) => {
    res.err(error)
  })
})

export default router
