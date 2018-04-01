const http        = require('http')
const https       = require('https')

const crypto      = require('crypto')
const express     = require('express')
const aes         = require('aes256')
const bodyParser  = require('body-parser')
const uuid        = require('node-uuid')
const mailer      = require('nodemailer')
const wellknown   = require('nodemailer-wellknown')

const config      = require('./api/config')
const tk          = require('./api/toolkit')
const Handler     = require('./api/handler')
const tables      = require('./api/_tables.js')

console.log = function(str) {
	if ( str ) {
		var d = new Date()
		process.stdout.write( tk.parseDate(d)+" :: " )
	}
	console.info.apply(null, arguments)
}

let defer = new tk.Deferrer()
tables.init(defer)

const app = express()

app.use(express.static(config.webroot))
app.use(bodyParser.json())
app.use(function(request, response, next) {
	response.header("Access-Control-Allow-Origin","*")
	response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
	next()
})

app.options('*',    function(request, response) { response.status(200).end() })
app.get('/api/*',   function(request, response) { new Handler('/path/', '/api/', request, response, 'get')  })
app.post('/api/*',  function(request, response) { new Handler('/path/', '/api/', request, response, 'post') })
app.listen(config.host.port, defer.wait())

defer.once('done', function() {
	console.log("SERVER :: Listening on port "+config.host.port)
})