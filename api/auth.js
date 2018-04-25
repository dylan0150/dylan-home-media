const crypto      = require('crypto')
const aes         = require('aes256')
const uuid        = require('node-uuid')

const config = require('./config')
const DB     = require('./db')
const tk     = require('./toolkit')

const db = new DB(config.db.auth)

module.exports = {

	createSession: function( uuid ) {
		/*
			{
				user_uuid: "",
				secret: "",
				date_created: ""
			}
			
		*/ // -> json encrypted with sha512
	},

	validateRequest: function(handler, callback) {
		if ( config.open_urls && config.open_urls.includes( handler.path ) ) {
			callback(true, 200)
		}
		/*
			decrypt session cookie errors -> callback(false, 400)
			check cookie hasn't expired -> callback(false, 401)
			check secret doesn't match stored secret (memcache) -> callback(false, 403)
			callback(true, 200, (memcache) -> sessionData )
		*/
		callback(false, 500)
	},

	encrypt: function(string) {
		return aes.encrypt( config.security.aes256, string )
	},

	decrypt: function(string) {
		return aes.decrypt( config.security.aes256, string )
	},

	salthash: function(value) {
		var salt = generateRandomString(16)
		return {
			salt: salt,
			hash: sha512(value,salt)
		}
	},

	validateEmail: function(email_string) {
		var regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
		return regex.test(email_string)
	}
}

function generateRandomString(len) {
	return crypto.randomBytes(Math.ceil(len/2)).toString('hex').slice(0,len)
}

function sha512(string, salt) {
	return crypto.createHmac('sha512', salt).update(string).digest('hex')
}