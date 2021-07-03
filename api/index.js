import express from 'express'
// Require API routes
import load from './routes/load'
import save from './routes/save'

// Create express instance
const app = express()

// Import API Routes
app.use(load)
app.use(save)

// Export express app
module.exports = app

// Start standalone server if directly running
if (require.main === module) {
  const port = process.env.PORT || 3001
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`API server listening on port ${port}`)
  })
}
