const crypto = require('crypto')
const aes    = require('aes256')
const uuid   = require('node-uuid')
const jwt    = require('jsonwebtoken')

const config = require('./config')
const DB     = require('./db')
const tk     = require('./toolkit')

const db = new DB(config.db.auth)

module.exports = {

	createToken: function(user_uuid) {
		let data = {
			user_uuid   : user_uuid
		}
		return sign(data, config.security.jwt, config.session_expires)
	},

	refreshToken: function(token) {
		let data = this.validateToken(token)
		if ( decoded == null ) { return null }
		return createToken( data.user_uuid )
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
	},

	validateToken: function(token) {
		try {
			var decoded = jwt.verify( token, config.security.jwt, {
				algorithms: ["HS512"],
				maxAge: config.session_expires
			})
			return decoded.data
		} catch (e) {
			return null
		}
	}
}

function generateRandomString(len) {
	return crypto.randomBytes(Math.ceil(len/2)).toString('hex').slice(0,len)
}

function sha512(string, salt) {
	return crypto.createHmac('sha512', salt).update(string).digest('hex')
}

function sign(data, secret, expires) {
	return jwt.sign({data:data}, secret, {
		algorithm: "HS512",
		expiresIn: expires
	})
}