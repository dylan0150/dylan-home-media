const nbs    = require('nbs_framework')
const config = require('./api/config')

const server = new nbs.Server(config)

server.route("get", "/reset*", require("./reset") )

server.once("ready", function() {
	console.log("Ready")
})