// eslint-disable-next-line canonical/filename-match-exported
import cors from 'cors'
import express from 'express'
// Require API routes
import load from './routes/load'
import save from './routes/save'
import twitch from './routes/twitch'
import youtube from './routes/youtube'

// Create express instance
const app = express()
app.use(cors())

// Import API Routes
app.use(load)
app.use(save)
app.use(youtube)
app.use(twitch)

const port = 3_601
app.listen(3_601, () => {
  // eslint-disable-next-line no-console
  console.log(`API server listening on port ${port}`)
})

export const viteNodeApp = app
