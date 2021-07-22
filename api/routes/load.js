import fs from 'fs'
import path from 'path'
import { Router } from 'express'

const router = Router()

const jsonPath = 'w:\\web\\_own\\poe-app-frontend\\src\\_data\\'

// Test route
router.use('/load', (req, res) => {
  fs.readFile(path.join(jsonPath, 'versions.json'), 'utf8', (err, fileContents) => {
    if (err) {
      console.error(err)
      return
    }
    const versionsData = JSON.parse(fileContents)
    let file = path.join(jsonPath, 'data-' + versionsData.currentVersion.replace('.', '-')) + '.json'
    if (!fs.existsSync(file)) {
      const dataFile = 'data-' + versionsData.versions[versionsData.versions.length - 1].version.replace('.', '-') + '.json'
      file = path.join(jsonPath, dataFile)
    }
    fs.readFile(file, 'utf8', (err, fileContents2) => {
      if (err) {
        console.error(err)
        return
      }
      const data = JSON.parse(fileContents2)
      res.end(JSON.stringify(Object.assign(data, versionsData)))
    })
  })
})

export default router
