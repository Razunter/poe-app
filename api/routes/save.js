import fs from 'fs'
import path from 'path'
import express from 'express'
import bodyParser from 'body-parser'

const app = express()

const jsonPath = path.normalize(process.env.jsonPath)

app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({
  limit: '50mb',
  extended: true
}))
app.use(express.json())

app.post('/save', (req, res) => {
  const data = req.body
  const versionsData = {
    currentVersion: data.currentVersion,
    versions: data.versions
  }
  delete data.currentVersion
  delete data.versions

  // Write versions
  fs.writeFile(path.join(jsonPath, 'versions.json'), JSON.stringify(versionsData, null, 2), function writeJSON (err) {
    if (err) {
      res.end('Error: ' + err)
    }
  })

  // Write data
  fs.writeFile(path.join(jsonPath, 'data-' + versionsData.currentVersion.replace('.', '-') + '.json'), JSON.stringify(data, null, 2), function writeJSON (err) {
    if (err) {
      res.end('Error: ' + err)
    }
  })

  res.end('file saved successfully')
})

export default app
