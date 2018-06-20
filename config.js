const fs = require('fs')

module.exports.auth = {
    keys: {
        aws: fs.readFileSync(process.cwd()+"/.keys/aws", 'UTF-8').replace(/\s/gi,'')
    }
}

module.exports.server = {
    host: {
        port: 8080
    },
    webroot: "www",
    response_headers: {

    }
}

module.exports.public_urls = ['/api/login','/api/register']