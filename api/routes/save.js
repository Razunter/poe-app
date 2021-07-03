const express = require('express')
const app = express()

const jsonFile = './api/data.json'

app.use(express.json())

// Test route
app.post('/save', (req, res) => {
  console.log(req.body)
  res.json(req.body)
  // fs.writeFile(jsonFile, JSON.stringify(req.file.buffer, null, 2), function
  // writeJSON (err) { if (err) { console.log(err) res.end('Error: ' + err) }
  // else { console.log('file saved successfully') res.end('file saved
  // successfully') } })
})

export default app
