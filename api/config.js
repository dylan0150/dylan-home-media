const fs = require('fs')

module.exports.webroot = 'www';

module.exports.host = {
	local_ip: '192.168.2.115',
	public_ip: '148.252.220.10',
	name: 'no-reverse-dns.metronet-uk.com',
	port: 8080,
	secure_port: 443
};

module.exports.db = {
	auth: {
		host: 'localhost',
		user: 'home',
		password: fs.readFileSync(process.cwd()+'/.keys/db_home.txt','UTF-8').replace(/[\s\r\n]/g,''),
		database: 'home'
	},
	home: {
		host: 'localhost',
		user: 'home',
		password: fs.readFileSync(process.cwd()+'/.keys/db_home.txt','UTF-8').replace(/[\s\r\n]/g,''),
		database: 'home'
	}
}

module.exports.security = {
	//https://certbot.eff.org/#debianstretch-other
	//https://stackoverflow.com/questions/5998694/how-to-create-an-https-server-in-node-js#14272874
	aes256: fs.readFileSync(process.cwd()+'/.keys/aes256.txt','UTF-8').replace(/[\s\r\n]/g,'')
}
