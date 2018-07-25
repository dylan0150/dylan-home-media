const nbs    = require('nbs_framework')
const config = require('./../config')

const auth = new nbs.Auth(config.auth)

module.exports = {

    POST: function(params) {
        delete params.password
        let token = auth.createToken(params, "aes")
        this.cookie('auth', token)
        this.respond({ ok: true })
    }

}