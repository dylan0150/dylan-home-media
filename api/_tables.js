const DB     = require('./db')
const ORM    = require('./orm')
const config = require('./config')

module.exports.init = function(defer) {

	const db_auth  = new DB(config.db.auth)
	const orm_auth = new ORM(db_auth)

		.table('users')
			.column('uuid', 'text_long', { notnull: true }, defer.wait())
			.column('date_created', 'datetime', { notnull: true }, defer.wait())
			.column('approved', 'int_1', {}, defer.wait())

		.table('users_email')
			.column('users_uuid', 'text_long', { notnull: true }, defer.wait())
			.column('data', 'text_long', { notnull: true }, defer.wait())
			.column('priority', 'int_11', {}, defer.wait())
			.column('validated', 'int_1', {}, defer.wait())
			.column('date_created', 'datetime', { notnull: true }, defer.wait())

		.table('users_password')
			.column('users_uuid', 'text_long', { notnull: true }, defer.wait())
			.column('hash', 'text_long', { notnull: true }, defer.wait())
			.column('salt', 'char_16', { notnull: true }, defer.wait())
			.column('date_created', 'datetime', { notnull: true }, defer.wait())

		.table('users_data')
			.column('users_uuid', 'text_long', { notnull: true }, defer.wait())
			.column('key', 'text_long', { notnull: true }, defer.wait())
			.column('data', 'text_long', {}, defer.wait())
			.column('encrypted', 'int_1', {}, defer.wait())
			.column('date_created', 'datetime', { notnull: true }, defer.wait())

		.table('memcache')
			.column('key', 'text_long', { notnull: true }, defer.wait())
			.column('data', 'text_long', {}, defer.wait())
			.column('date_created', 'datetime', { notnull: true }, defer.wait())
}