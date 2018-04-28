const fs = require('fs')

module.exports.webroot = 'www';

module.exports.host = {
	local_ip: '192.168.2.115',
	public_ip: '148.252.220.10',
	name: 'no-reverse-dns.metronet-uk.com',
	port: 8080,
	secure_port: 443
};

module.exports.session_expires = 60*60*24

module.exports.db = {
	host: 'localhost',
	user: 'home',
	password: fs.readFileSync(process.cwd()+'/.keys/db.txt','UTF-8').replace(/[\s\r\n]/g,''),
	database: 'home'
}
module.exports.response_headers = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept"
}

module.exports.keys = {
	//https://certbot.eff.org/#debianstretch-other
	//https://stackoverflow.com/questions/5998694/how-to-create-an-https-server-in-node-js#14272874
	aes: fs.readFileSync(process.cwd()+'/.keys/aes.txt','UTF-8').replace(/[\s\r\n]/g,'')
}
