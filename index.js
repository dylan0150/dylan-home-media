const express = require('express')
const bodyParser = require('body-parser')
const fs = require('fs')

const { command } = require('./lib/utils')

const apiKey = fs.readFileSync(`${__dirname}/lib/.keys/api`, 'UTF-8').replace(/\s/g,'')
const PORT = 80

const app = express()
app.use(
    express.static('www'),
    bodyParser.urlencoded({ extended: true }),
    bodyParser.json(),
)

app.get('/command', (req, res) => {
    const { key, sh } = req.query
    if (key !== apiKey) return res.status(403).end()

    return command(sh)
        .then(res => res.json(res).end())
        .catch(err => res.status(400).send(err).end())
})

app.listen(PORT)