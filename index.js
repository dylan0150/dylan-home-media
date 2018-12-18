const PORT = 80
const express = require('express')
const bodyParser = require('body-parser')

const app = express()
app.use(
    express.static('www'),
    bodyParser.urlencoded({ extended: true }),
    bodyParser.json(),
)

app.listen(PORT)