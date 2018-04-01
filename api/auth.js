const crypto      = require('crypto')
const aes         = require('aes256')
const uuid        = require('node-uuid')

const config = require('./config')
const DB     = require('./db')
const tk     = require('./toolkit')

const db = new DB(config.db.auth)

module.exports = {

	login: function(email, password, callback) {
		db.query("select users_uuid, validated from users_email where data = :email order by id desc", { email: email }, function(error, results, fields, query, connection) {
			if ( error ) {
				console.log(error)
				return callback({ ok: false, reason: "error" })
			}
			if ( results.length == 0 ) {
				return callback({ ok: false, reason: "email_nomatch" })
			}
			if ( !results[0].validated ) {
				return callback({ ok: false, reason: "email_invalid" })
			}
			db.query("select hash, salt, users_uuid from users_password where users_uuid = :uuid order by id desc limit 1", { uuid: results[0].users_uuid }, function(error, results, fields, query, connection) {
				if ( error || results.length != 1 ) {
					console.log(error)
					return callback({ ok: false, reason: "error" })
				}
				if ( sha512( password, results[0].salt ) != results[0].hash ) {
					return callback({ ok: false, reason: "password_nomatch" })
				}
				return callback({ ok: true })
			})
		})
	},

	register: function(email, password, callback) {
		let self = this;
		let defer = new tk.Deferrer()
		const uuid = uuid.v4()+"-"+uuid.v1()
		db.query("select users_uuid, validated from users_email where data = :email order by id desc", { email: email }, function(error, results, fields, query, connection) {
			if ( error ) {
				console.log(error)
				return callback({ ok: false, reason: "error" })
			}
			if ( results.length > 0 ) {
				return callback({ ok: false, reason: "email_existing" })
			}
			let hashdata = salthash(password)
			db.query("insert into users ( uuid, date_created ) values ( :uuid, now() )", { uuid: uuid }, defer.wait())
			db.query("insert into users_email ( users_uuid, data, priority, date_created ) values ( :uuid, :email, 1, now() )", { uuid: uuid, email: email }, defer.wait())
			db.query("insert into users_password ( users_uuid, salt, hash, date_created ) values ( :uuid, :salt, :hash, now() )", { uuid: uuid, salt: hashdata.salt, hash: hashdata.hash }, defer.wait())
			defer.once('done', function() {
				return callback({ ok: true })
			})
		})
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