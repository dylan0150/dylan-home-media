const fs = require('fs')

module.exports = {
    host: {
        port: 8080
    },
    webroot: "www",
    response_headers: {

    },
    auth: {
        cookie_name: 'auth',
        keys: {
            aes: fs.readFileSync(process.cwd()+"/.keys/aes", 'UTF-8').replace(/\s/gi,'')
        },
        public_urls: ['/api/login','/api/register']
    }
}
