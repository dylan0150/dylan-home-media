const fs = require('fs')

module.exports.webroot = 'www';

module.exports.host = {
	local_ip: '192.168.1.68',
	public_ip: '80.229.29.4',
	name: 'dylan0150.plus.com',
	port: 80,
	secure_port: 443
};

module.exports.db = {
	auth: {
		host: 'localhost',
		user: 'home',
		password: 'superhomepassword123',
		database: 'home'
	},
	home: {
		host: 'localhost',
		user: 'home',
		password: 'superhomepassword123',
		database: 'home'
	}
}

module.exports.security = {
	//https://certbot.eff.org/#debianstretch-other
	//https://stackoverflow.com/questions/5998694/how-to-create-an-https-server-in-node-js#14272874
	aes256: fs.readFileSync(process.cwd()+'/.keys/aes256.txt','UTF-8').replace(/[\s\r\n]/g,'')
}
