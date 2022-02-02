// eslint-disable-next-line canonical/filename-match-exported
import fs from 'fs'
import path from 'path'
import { Router } from 'express'
// eslint-disable-next-line import/no-unassigned-import
// import 'dotenv/config'

const router = Router()

const jsonPath = path.normalize(import.meta.env.VITE_jsonPath as string)

// Test route
router.use('/load', (request, response) => {
  fs.readFile(path.join(jsonPath, 'versions.json'), 'utf8', (error, fileContents) => {
    if (error) {
      // eslint-disable-next-line no-console
      console.error(error)
      return
    }

    const versionsData = JSON.parse(fileContents)
    let file = path.join(jsonPath, 'data-' + versionsData.currentVersion.replace('.', '-')) + '.json'
    if (!fs.existsSync(file)) {
      const dataFile = 'data-' + versionsData.versions[versionsData.versions.length - 1].version.replace('.', '-') + '.json'
      file = path.join(jsonPath, dataFile)
    }

    fs.readFile(file, 'utf8', (error2, fileContents2) => {
      if (error2) {
        // eslint-disable-next-line no-console
        console.error(error2)
        return
      }

      const data = JSON.parse(fileContents2)
      response.json(Object.assign(data, versionsData))
    })
  })
})

export default router
