const PORT = 80
const express = require('express')

const app = express()
app.use(express.static('www'))

app.listen(PORT)