const express    = require('express')
const bodyParser = require('body-parser')
const plexApi    = require('plex-api')

const app  = express()
const port = process.argv[2]

app.use(express.static('www'))
app.use(bodyParser.json())

app.listen(port, function() {
    console.log("listening on port "+port)
})