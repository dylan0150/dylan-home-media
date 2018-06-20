const nbs    = require('nbs_framework')
const config = require('./../config')

const auth = new nbs.Auth(config.auth)

module.exports = {

    POST: function(params) {
        let token = auth.createToken(params, "aws")
        delete params.password
        this.cookie('auth', token)
        this.respond({ ok: true })
    }

}