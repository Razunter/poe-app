import { Router } from 'express'
import { ApiClient } from '@twurple/api'
import { ClientCredentialsAuthProvider } from '@twurple/auth'

const router = Router()

router.use('/twitch', async (req, res) => {
  const TwitchAuthProvider = new ClientCredentialsAuthProvider(process.env.TwitchClientId, process.env.TwitchClientSecret)
  const TwitchApiClient = new ApiClient({ authProvider: TwitchAuthProvider })

  if (req.query.videoID) {
    await TwitchApiClient.videos.getVideoById(req.query.videoID).then((value) => {
      res.JSON(value)
    }, (error) => {
      throw new Error(error)
    })
  } else {
    throw new Error('No VideoID')
  }
})

export default router
