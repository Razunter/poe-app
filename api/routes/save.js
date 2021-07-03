const fs = require('fs')
const express = require('express')
const app = express()

const jsonFile = './api/data.json'

app.use(express.json())

// Test route
app.post('/save', (req, res) => {
  fs.writeFile(jsonFile, JSON.stringify(req.body, null, 2), function writeJSON (err) {
    if (err) {
      console.log(err)
      res.end('Error: ' + err)
    } else {
      console.log('file saved successfully')
      res.end('file saved successfully')
    }
  })
}
)

export default app
