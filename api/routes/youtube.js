import { Router } from 'express'
import axios from 'axios'

const router = Router()

router.use('/youtube', async (req, res) => {
  const YTapiKey = process.env.YTAPI
  if (req.query.videoID) {
    const url = `https://www.googleapis.com/youtube/v3/videos?id=${req.query.videoID}&key=${YTapiKey}&part=snippet`
    await axios.get(url).then((response) => {
      res.json(response.data)
    }).catch((error) => {
      throw new Error(error)
    })
  } else {
    throw new Error('No VideoID')
  }
})

export default router
