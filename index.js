const nbs     = require('nbs_framework')
const plexApi = require('plex-api')
const config  = require('./config')

const auth    = new nbs.Auth(config.auth)
const server  = new nbs.Server(config.server)

server.app.use(function(request, response, next) {
    if ( !config.public_urls.includes(request.url) ) {
        request.userData = auth.refreshToken( request.cookies['auth'], "aws" )
        if ( request.userData == undefined || request.userData == null ) {
            return response.status(403).end()
        }
    }
    
    next()
})

server.route('post', '/api/login')