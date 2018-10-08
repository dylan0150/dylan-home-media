const { Pool }     = require('pg')
const pg           = require('pg')
const EventEmitter = require('events')

class ORM extends EventEmitter {
    constructor({ host='localhost', user='postgres', password='postgres', database='postgres', port='5432' } = {}, logger=console) {
        super()

        this.pg      = pg
        this.config  = { host, user, password, database, port }
        this.tables  = {}
        this.pool    = new Pool(this.config)
        this.current = {}
        this.logger  = logger
        
        this.pool.on('error', (error, client) => {
            logger.error(error)
            try {
                client.release()
            } catch (e) {
                logger.error(e)
            }
        })
    }

    static get ALLOWED_FIELDS() {
        return [
            'year',
            'month',
            'day',
            'hour',
            'second',
            'year to month',
            'day to hour',
            'day to second',
            'hour to minute',
            'hour to second',
            'minute to second',
        ]
    }

    parseType(type) {
        const parts = type.split('_')
        switch (parts[0].toLowerCase()) {
            case 'bigint':
            case 'int':
            case 'int4':
            case 'int8':
            case 'bigserial':
            case 'serial8':
            case 'boolean':
            case 'bool':
            case 'box':
            case 'bytea':
            case 'cidr':
            case 'circle':
            case 'date':
            case 'float8':
            case 'inet':
            case 'json':
            case 'jsonb':
            case 'line':
            case 'lseg':
            case 'macaddr':
            case 'money':
            case 'path':
            case 'pg_lsn':
            case 'point':
            case 'polygon':
            case 'real':
            case 'float4':
            case 'smallint':
            case 'int2':
            case 'smallserial':
            case 'serial':
            case 'serial2':
            case 'serial4':
            case 'text':
            case 'tsquery':
            case 'tsvector':
            case 'txid_snapshot':
            case 'uuid':
            case 'xml':
            case 'double precision':
                return parts[0].toLowerCase()
            
            case 'bit varying':
            case 'character varying':
            case 'varchar':
            case 'char':
            case 'varbit':
            case 'boolean':
            case 'character':
            case 'time':
            case 'time with time zone':
            case 'time without time zone':
            case 'timestamp':
            case 'timestamptz':
            case 'timestamp with time zone':
            case 'timestamp without time zone':
                if (parts.length === 1) return parts[0]
                if (isNaN(Number(parts[1]))) throw new TypeError(`Variable ${parts[1]} is not supported for type ${parts[0]}`)
                return `${parts[0]}(${parts[1]})`

            case 'numeric':
            case 'decimal':
                if (parts.length === 1) return parts[0]
                if (isNaN(Number(parts[1]))) throw new TypeError(`Variable ${parts[1]} is not supported for type ${parts[0]}`)
                if (parts.length === 2) return `${parts[0]}(${parts[1]})`
                if (isNaN(Number(parts[2]))) throw new TypeError(`Variable ${parts[2]} is not supported for type ${parts[0]}`)
                return `${parts[0]}(${parts[1]},${parts[2]})`
            
            case 'interval':
                if (parts.length === 1) return parts[0]
                if (parts.length === 2 && !isNaN(Number(parts[1]))) return `${parts[0]}(${parts[1]})`
                let has_second = false
                let fields = parts[1]
                    .split(',')
                    .map(field => {
                        let f = field.toLowerCase()
                        if (f === 'second') has_second = true
                        if (!ALLOWED_FIELDS.includes(f)) throw new TypeError(`Field ${f} is not supported for type ${parts[0]}`)
                    })
                    .join(',')
                if (parts.length === 2) return `${parts[0]} ${fields}`
                if (!has_second) throw new TypeError(`Fields ${fields} must include 'SECOND' for type ${parts[0]} with precision ${parts[2]}`)
                if (isNaN(Number(parts[2]))) throw new TypeError(`Variable ${parts[2]} is not supported for type ${parts[0]}`)
                return `${parts[0]} ${fields}(${parts[2]})`

            default: throw new TypeError(`Type ${parts[0]} is not supported`)
        }
    }

    escapeTable(table, schema) {
        if (schema) return `${this.escapeIdentifier(schema)}.${this.escapeIdentifier(table)}`
        return this.escapeIdentifier(table)
    }

    escapeIdentifier (value) {
        return `"${value.replace('"','').replace(/\\^\\/g,'/')}"`
    }

    parseStatement (statement, params) {
        if (Array.isArray(params)) return { sql: statement, values: params }
        let max_index = 1
        let values = []
        let keys = []
        let sql = statement.replace(/\:(\w+)/g, (txt, key) => {
            if (params.hasOwnProperty(key)) {
                let value = params[key]
                if ( typeof value !== 'string' ) {
                    if (value.identifier) return this.escapeIdentifier(value.value)
                    if (value.table) return this.escapeTable(value.table, value.schema)
                }
                let index = keys.indexOf(key)
                if (index === -1) index = max_index++ && values.push(value)
                keys[index] = key
                return `$${index}`
            }
            return txt
        })
        return { sql, values }
    }

    table (name, schema, callback) {
        this.tables[name] = { ready: false }
        this.current.table = name
        this.current.schema = schema

        ;(async () => {
            let err
            try {
                await this.query('CREATE TABLE IF NOT EXISTS :table () WITH ( OIDS = FALSE );', { table: { table: name, schema: schema } })
                if (this.tables[name] !== null) this.tables[name].ready = true
            } catch (e) {
                err = e
                this.logger.error(e)
                this.emit('error', e)
            } finally {
                this.emit(`table_ready_${name}`)
                this.emit('table_ready', name)
                callback instanceof Function && callback(err)
            }
        })()

        return this
    }

    droptable (tablename, callback) {
        let name = tablename || this.current.table
        this.tables[name] = null

        ;(async () => {
            let err
            try {
                let rows = await this.query('SELECT * from information_schema.tables where table_name = :name', { name })
                if (rows.length) await this.query('DROP TABLE :name', { name: { value: name, identifier: true } })
            } catch (e) {
                err = e
                this.logger.error(e)
                this.emit('error', e)
            } finally {
                this.emit(`table_dropped_${name}`)
                this.emit('table_dropped', name)
                callback instanceof Function && callback(err)
            }
        })()

        return this
    }

    column (name, type, options, callback) {
        if (!this.current.table) throw new Error('First select a table')
        const tname  = this.current.table
        const table  = this.escapeIdentifier(tname)
        const column = this.escapeIdentifier(name)
        type = this.parseType(type)

        ;(async () => {
            let err
            try {
                if (!this.tables[tname].ready) await this.wait(`table_ready_${tname}`, `table_dropped_${tname}`)
                const columns = await this.query(`
                    SELECT *
                    FROM information_schema.columns
                    WHERE table_name = :tname
                    AND table_schema = :schema
                ;`,{
                    tname,
                    schema: this.current.schema
                })
                const params = {
                    ...options
                }
                const sql = `
                    ALTER TABLE ${table}
                    ${columns.length ? `ALTER COLUMN ${column} SET DATA TYPE ${type}` : `ADD COLUMN ${column} ${type}`}
                    ;
                `
                await this.query(sql, params)
            } catch (e) {
                err = e
            } finally {
                callback(err)
            }
        })()

        return this
    }

    async wait(event, error) {
        return new Promise((resolve, reject) => {

            const onsuccess = (...args) => {
                this.removeListener(error, onerror)
                resolve(args)
            }
            const onerror = (...args) => {
                this.removeListener(event, onsuccess)
                reject(args)
            }

            this.once(event, onsuccess)
            this.once(error, onerror)
        })
    }

    async query (statement, params, client) {
        if (client === undefined) client = this.pool
        const { sql, values } = this.parseStatement(statement, params)
        this.logger.debug("EXEC SQL ::", sql.replace(/\s\s/g,'').replace(/\n/g,'').trim(), values)
        const { rows } = await client.query(sql, values)
        return rows
    }

    async transaction (callback) {
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

    async done () {
        return await this.pool.end()
    }
}

module.exports = ORM