// eslint-disable-next-line canonical/filename-match-exported
import cors from 'cors'
import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
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
app.use('/forum/', createProxyMiddleware({
  target: 'https://www.pathofexile.com',
  changeOrigin: true,
}))
app.use('/guides/', createProxyMiddleware({
  target: 'https://www.poe-vault.com',
  changeOrigin: true,
}))

const port = 3_601
app.listen(3_601, () => {
  // eslint-disable-next-line no-console
  console.log(`API server listening on port ${port}`)
})

export const viteNodeApp = app
