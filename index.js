const express = require('express')
const config  = require('./api/config')

const app     = express()

app.use(express.static(config.webroot))
app.listen(config.host.port, function() {

})