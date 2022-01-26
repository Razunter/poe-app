import { Router } from 'express'
import axios from 'axios'

const router = Router()

router.use('/proxy/youtube', async (req, res) => {
  const YTapiKey = process.env.YTAPI
  await axios.get(`/youtube/v3/videos?id=${req.body.videoID}&key=${YTapiKey}&part=snippet`).then((value) => {
    res.end(JSON.stringify(value))
  }).catch((error) => {
    res.err(error)
  })
})

export default router
