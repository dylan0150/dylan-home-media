const { exec } = require('child_process')

class Utils {
    static async command (cmd, {log, error}) {
        return new Promise((resolve, reject) => {
            const sub = exec(cmd)
            let result = ''
            let err    = ''
    
            sub.stdout.on('data', data => {
                result += data.toString()
                if (log) log(data.toString())
            })
            sub.stderr.on('data', data => {
                err += data.toString()
                if (error) error(data.toString())
                else if (log) log(`ERROR :: ${data.toString()}`)
            })
            process.on('exit', sub.kill)
    
            sub.on('close', code => {
                process.removeListener('exit', sub.kill)
                if (code === 0) {
                    resolve(result)
                } else {
                    reject(err)
                }
            })
        })
    }
}

module.exports = Utils