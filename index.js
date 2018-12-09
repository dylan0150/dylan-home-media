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

app.get('/command', async (req, res) => {
    const { key, sh } = req.query
    if (key !== apiKey) return res.status(403).end()

    let err, result = await command(sh).catch(e => err = e)
    if (err) return res.status(400).send(err).end()
    return res.status(200).send(result).end()
})