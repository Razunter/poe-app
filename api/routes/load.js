import fs from 'fs'
import { Router } from 'express'

const router = Router()

const jsonFile = './api/data.json'

// Test route
router.use('/load', (req, res) => {
  fs.readFile(jsonFile, 'utf8', (err, fileContents) => {
    if (err) {
      console.error(err)
      return
    }
    try {
      res.end(fileContents)
    } catch (err) {
      console.error(err)
    }
  })
})

export default router
