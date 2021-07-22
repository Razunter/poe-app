const fs = require('fs')
import path from 'path'

const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const jsonPath = 'w:\\web\\_own\\poe-app-frontend\\src\\_data\\'

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
