const fs = require('fs')

module.exports.GET = function(params) {
	if ( typeof params.key == "undefined" ) {
		return this.respond({ ok: false }, 403)
	}
	var secret = fs.readFileSync("./.keys/reset.txt", "UTF-8")

	if ( secret !== params.key ) {
		return this.respond({ ok: false }, 403)
	}

	this.respond({ ok:true })
}