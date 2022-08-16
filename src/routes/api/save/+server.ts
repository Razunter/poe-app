// eslint-disable-next-line canonical/filename-match-exported
import fs from 'fs'
import path from 'path'
import bodyParser from 'body-parser'
import express from 'express'
// eslint-disable-next-line import/no-unassigned-import
// import 'dotenv/config'

const app = express()

const jsonPath = path.normalize(import.meta.env.VITE_jsonPath as string)

app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({
  limit: '50mb',
  extended: true,
}))
app.use(express.json())

app.post('/save', (request, response) => {
  const data = request.body
  const versionsData = {
    currentVersion: data.currentVersion,
    versions: data.versions,
  }
  delete data.currentVersion
  delete data.versions

  // Write versions
  fs.writeFile(path.join(jsonPath, 'versions.json'), JSON.stringify(versionsData, null, 2), (error) => {
    if (error) {
      response.send('Error: ' + error.message)
    }
  })

  // Write data
  fs.writeFile(path.join(jsonPath, 'data-' + versionsData.currentVersion.replace('.', '-') + '.json'), JSON.stringify(data, null, 2), (error) => {
    if (error) {
      response.send('Error: ' + error.message)
    }
  })

  response.send('file saved successfully')
})

export default app
