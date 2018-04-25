const fs     = require('fs')
const auth   = require('./auth')
const config = require('./config')

function RequestHandler(path, request, response, method) {
  var self = this;
  console.log("REQ :: "+request.method+" :: "+request.url.split('?')[0])
	this.path = path.split('?')[0]
  try {
    this.endpoint = require('.'+this.path )
  } catch (e) {
    response.status(404).end()
  }
  this.method   = method
	this.params   = this.parseParams( request.url )
  this.body     = request.body
	this.request  = request
	this.response = response
  this.status   = 200
  auth.validateRequest( this, function(ok, status, sessionData) {
    self.status = status
    if ( !ok ) { self.respond(null) }
    self.sessionData = sessionData
    self[self.method]()
  })
}
RequestHandler.prototype.get = function() {
  if ( this.params.method ) {
    this.endpoint[this.params.method](this.params, this.headers.userData, this)
  } else {
    this.endpoint.get(this.params, this.headers.userData, this)
  }
  return this
}
RequestHandler.prototype.post = function() {
  for ( var key in this.body ) {
    this.params[key] = this.body[key]
  }
  if ( this.params.method ) {
    this.endpoint[this.params.method](this.params, this.headers.userData, this)
  } else {
    this.endpoint.post(this.params, this.headers.userData, this)
  }
  return this
}
RequestHandler.prototype.parseParams = function(url) {
  var obj = {}
  if (url.split('?').length > 1) {
    var params = url.split('?')[1].split('&')
    for (var i = 0; i < params.length; i++) {
      obj[params[i].split('=')[0]] = params[i].split('=')[1]
    }
  }
  return obj
}
RequestHandler.prototype.respond = function(response, status) {
  if ( status != undefined ) { this.status = status }
  this.response.status(this.status)
  this.response.send(response)
  this.response.end()
}

module.exports = RequestHandler