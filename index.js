const nbs     = require('nbs_framework')
const plexApi = require('plex-api')
const config  = require('./config')

const server  = new nbs.Server(config)

server.initAuth()
server.route('post', '/api/login')