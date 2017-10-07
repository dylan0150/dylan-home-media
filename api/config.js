const os     = require('os')
const net    = os.networkInterfaces()
const dev_ip = '192.168.1.68'

exports.webroot = 'www';

let host = {};
if ( net.Ethernet != undefined ) {
	for (var i = net.Ethernet.length - 1; i >= 0; i--) {
		if (net.Ethernet[i].family == 'IPv4') {
			host = net.Ethernet[i]
			if ( host.address == dev_ip ) {
				host.port   = 8080
				exports.dev = true
			} else {
				host.port   = 80
				exports.dev = false
			}
		}
	}
}
exports.host = host