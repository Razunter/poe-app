// eslint-disable-next-line canonical/filename-match-exported
import {env} from '$env/dynamic/private'
import axios from 'axios'
import {Router} from 'express'

const youtube = Router()

youtube.use('/youtube', (request, response) => {
  const YTapiKey = env.YTAPI
  if (request.query.videoID) {
    const url = `https://www.googleapis.com/youtube/v3/videos?id=${request.query.videoID as string}&key=${YTapiKey}&part=snippet`
    axios.get(url).then((axiosResponse) => {
      response.json(axiosResponse.data)
    }).catch((error) => {
      throw new Error(error)
    })
  } else {
    throw new Error('No VideoID')
  }
})

export default youtube
