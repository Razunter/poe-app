import express from 'express'
// Require API routes
import load from './routes/load'
import save from './routes/save'

// Create express instance
const app = express()

// Import API Routes
app.use(load)
app.use(save)

export default app

const port = process.env.PORT || 3601
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API server listening on port ${port}`)
})
