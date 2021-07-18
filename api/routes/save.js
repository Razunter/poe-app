const fs = require('fs')
const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const jsonFile = './api/data.json'

app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({
  limit: '50mb',
  extended: true
}))
app.use(express.json())

app.post('/save', (req, res) => {
  fs.writeFile(jsonFile, JSON.stringify(req.body, null, 2), function writeJSON (err) {
    if (err) {
      res.end('Error: ' + err)
    } else {
      fs.copyFile(jsonFile, 'w:\\web\\_own\\poe-app-frontend\\src\\_data\\data.json', (err) => {
        if (err) {
          throw err
        }
      })
      res.end('file saved successfully')
    }
  })
})

export default app
