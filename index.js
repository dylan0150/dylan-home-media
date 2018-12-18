const PORT = 80
const express = require('express')
const { command } = require('./lib/utils')
const bodyParser = require('body-parser')
const fs = require('fs')
const apiKey = fs.readFileSync(`${__dirname}/lib/.keys/api`, 'UTF-8').replace(/\s/g,'')

const app = express()
app.use(
    express.static('www'),
    bodyParser.urlencoded({ extended: true }),
    bodyParser.json(),
)

app.listen(PORT)