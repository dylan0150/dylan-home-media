const { Pool } = require('pg')
const pg       = require('pg')

class ORM {
    constructor({ host="localhost", user="postgres", password="postgres", database="postgres", port="5432" } = {}, logger=console) {
        this.config = { host, user, password, database, port }
        this.pg     = pg
        this.pool   = new Pool(this.config)
        
        this.pool.on('error', (error, client) => {
            logger.error(error)
            try {
                client.release()
            } catch (e) {
                logger.error(e)
            }
        })
    }

    parseStatement(statement, params) {
        if (Array.isArray(params)) return { sql: statement, values: params }
        let max_index = 1
        let values = []
        let keys = []
        let sql = statement.replace(/\:(\w+)/g, (txt, key) => {
            if (params.hasOwnProperty(key)) {
                const value = params[key]
                let index = keys.indexOf(key)
                if (index === -1) index = max_index++ && values.push(value)
                keys[index] = key
                return `$${index}`
            }
            return txt
        })
        return { sql, values }
    }

    async query(statement, params, client) {
        if (client === undefined) client = await this.pool.connect()
        const { sql, values } = this.parseStatement(statement, params)
        const { rows } = await client.query(sql, values)
        return rows
    }

    async transaction(callback) {
        const client = await this.pool.connect()
        try {
            await client.query('BEGIN')
            await callback((statement, params) => this.query(statement, params, client))
            await client.query('COMMIT')
        } catch (e) {
            await client.query('ROLLBACK')
            throw e;
        } finally {
            await client.release()
        }
    }
}

module.exports = ORM