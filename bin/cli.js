const rls = require('readline-sync')
const tv  = require(`${__dirname}/../lib/tv`)
const orm = require(`${__dirname}/../lib/orm`)

class CLI {

    static log(...args) {
        console.log.apply(console, args)
    }

    static get commands() {
        return Object.getOwnPropertyNames(CLI)
            .filter(method => method.indexOf('run') === 0)
            .map(method => {
                return {
                    method: method,
                    question: method
                        .split(/(?=[A-Z])/)
                        .slice(1)
                        .join(' ')
                }
            })
    }

    static async commandLoop() {
        let ok = true
        while (ok) {
            let index = rls.keyInSelect(
                CLI.commands.map(command => command.question),
                'Welcome to Dylan\'s Home Media Server command line interface, what would you like to do? ',
                {
                    guide: false,
                    cancel: 'Done'
                }
            )
            if (index === -1) break
            let method = CLI.commands[index].method
            ok = await CLI[method]()
        }
        process.exit()
    }

    static async runTest() {
        return true
    }
}

if (require.main === module) CLI.commandLoop()

module.exports = CLI