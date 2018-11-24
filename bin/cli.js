const rls = require('readline-sync')
const tv  = require(`${__dirname}/../lib/tv`)
const orm = require(`${__dirname}/../lib/orm`)

const CLI = {

    get commands() {
        const methods = []

        for (const method in CLI) {
            if (method.indexOf('run') === 0) {
                methods.push({
                    method: method,
                    question: camelCaseToWords(method)
                })
            }
        }
        
        return methods
    },

    async runTest() {
        await tv.searchSeries('My Hero Academia', { year: 2016 })
            .then((...args) => console.log(args))
            .catch(err => console.error(err))

        await tv.searchMovies('The Avengers', { year: 2012 })
            .then((...args) => console.log(args))
            .catch(err => console.error(err))

        return true
    }
}

async function commandLoop() {
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

function camelCaseToWords(string) {
    return string
        .split(/(?=[A-Z])/)
        .slice(1)
        .join(' ')
}

commandLoop()