const { Pool }     = require('pg')
const pg           = require('pg')
const EventEmitter = require('events')

class ORM extends EventEmitter {
    constructor({ host='localhost', user='postgres', password='postgres', database='postgres', port='5432' } = {}, logger=console) {
        super()

        this.pg      = pg
        this.config  = { host, user, password, database, port }
        this.pool    = new Pool(this.config)
        this.current = {}
        this.logger  = logger
        this.busy    = false
        this.queue   = []
        
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

    table (name, schema='public', callback) {
        this.current.table  = name
        this.current.schema = schema

        ;(async () => {
            await this.wait()
            let err
            try {
                await this.query('CREATE TABLE IF NOT EXISTS :table () WITH ( OIDS = FALSE );', { table: { table: name, schema: schema } })
            } catch (e) {
                err = e
                this.logger.error(e)
                this.emit('error', e)
            } finally {
                callback instanceof Function && callback(err)
                this.next()
            }
        })()

        return this
    }

    droptable (tablename, schema, callback) {
        let name = tablename || this.current.table
        ;(async () => {
            await this.wait()
            let err
            try {
                await this.query(`DROP TABLE IF EXISTS ${this.escapeTable(name, schema)}`)
            } catch (e) {
                err = e
                this.logger.error(e)
                this.emit('error', e)
            } finally {
                callback instanceof Function && callback(err)
                this.next()
            }
        })()

        return this
    }

    extension (name, callback) {
        ;(async () => {
            await this.wait()
            let err
            try {
                await this.query(/*sql*/`CREATE EXTENSION IF NOT EXISTS ${this.escapeIdentifier(name)}`)
            } catch (e) {
                err = e
                this.logger.error(e)
                this.emit('error', e)
            } finally {
                callback instanceof Function && callback(err)
                this.next()
            }
        })()

        return this
    }

    /**
     * Add a column to a table
     * 
     * .table('users')
     * .column('id', 'uuid', { default: { function: 'uuid_generate_v4' } })
     * 
     * @param {string} name
     * @param {string} type - type_[...params] IE: varchar_255 -> VARCHAR(255)
     * @param {object} options - { default, notnull } - default may be passed as { function: 'sql_method' }
     * @param {Function} callback - args(err)
     */
    column (name, type, options, callback) {
        if (!this.current.table) throw new Error('First select a table')
        const tname  = this.current.table
        const table  = this.escapeIdentifier(tname)
        const column = this.escapeIdentifier(name)
        type         = this.escapeType(type)

        ;(async () => {
            await this.wait()
            let err
            try {
                const columns = await this.query(/*sql*/`
                    SELECT *
                    FROM information_schema.columns
                    WHERE table_name = :tname
                    AND table_schema = :schema
                    AND column_name = :column
                ;`,{
                    tname,
                    schema: this.current.schema,
                    column: name
                })
                let sql
                if (columns.length) {
                    sql = /*sql*/`
                        ALTER TABLE ${table}
                        ALTER COLUMN ${column} SET DATA TYPE ${type}
                        ${options.default ? `, ALTER COLUMN ${column} SET DEFAULT ${this.escapeDefault(options.default)}` : ``}
                        ${options.notnull ? `, ALTER COLUMN ${column} SET NOT NULL` : ''}
                    `
                } else {
                    sql = /*sql*/`
                        ALTER TABLE ${table}
                        ADD COLUMN ${column} ${type}${options.notnull ? ' NOT NULL' : ''}${options.default ? ` DEFAULT ${this.escapeDefault(options.default)}` : ''}
                    `
                }
                await this.query(sql, options)
            } catch (e) {
                err = e
            } finally {
                callback instanceof Function && callback(err)
                this.next()
            }
        })()

        return this
    }

    /**
     * 
     * @param {string} type - {pk|fk|uq}
     * @param {object} options - {column|columns, reference_table, reference_column, reference_schema}
     * @param {Function} callback args(err)
     */
    constraint (type, options, callback) {
        let table = this.current.table
        ;(async () => {
            await this.wait()
            let err
            try {
                await this.query(/*sql*/`
                    ALTER TABLE :table
                    ${this.escapeConstraint(type, { ...options, table, schema: this.current.schema })}
                ;`,{
                    table: { table: table, schema: this.current.schema }
                })
            } catch (e) {
                err = e
            } finally {
                callback instanceof Function && callback(err)
                this.next()
            }
        })()
        return this
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
    escapeConstraint (type, { column, columns, reference_table, reference_schema, reference_column, on_update='NO ACTION', on_delete='NO ACTION', table, schema }) {
        let constraint_name
        reference_schema = reference_schema || schema
        switch (type.toLowerCase().replace(/\s/g,'').replace(/_/g,'')) {
            case 'pk':
            case 'primarykey':
                return `ADD PRIMARY KEY(${this.escapeIdentifier(column)})`

            case 'fk':
            case 'foreignkey':

                if (on_update.toLowerCase().includes('cas')) on_update = 'CASCADE'
                else if (on_update.toLowerCase().includes('res')) on_update = 'RESTRICT'
                else on_update = 'NO ACTION'

                if (on_delete.toLowerCase().includes('cas')) on_delete = 'CASCADE'
                else if (on_delete.toLowerCase().includes('res')) on_delete = 'RESTRICT'
                else on_delete = 'NO ACTION'

                constraint_name = `fk_${table}_${column}_${reference_table}_${reference_column}`.replace(/\s/,'')
                return `
                    ADD CONSTRAINT ${this.escapeIdentifier(constraint_name)}
                    FOREIGN KEY (${this.escapeIdentifier(column)})
                    REFERENCES ${this.escapeTable(reference_table, reference_schema)} (${this.escapeIdentifier(reference_column)}) MATCH SIMPLE
                    ON UPDATE ${on_update}
                    ON DELETE ${on_delete}
                `

            case 'uq':
            case 'unique':

                constraint_name = `uq_${table}_${column || columns.sort().join('_')}`
                let colstring = column ? this.escapeIdentifier(column) : columns.sort().map(col => this.escapeIdentifier(col)).join(', ')
                return `
                    ADD CONSTRAINT ${this.escapeIdentifier(constraint_name)}
                    UNIQUE(${colstring})
                `

            default: throw new TypeError(`Unrecongnised constraint ${type} ${JSON.stringify(options)}`)
        }
    }
    escapeType(type) {
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
        if (typeof value !== 'string') return value
        return `"${value.replace(/\"/g,'').replace(/\\^\\/g,'/')}"`
    }
    escapeDefault (value) {
        if (typeof value === 'string' || typeof value === 'number') return this.escapeIdentifier(value)
        if ( value.function ) {
            return `${value.function.replace(/[\"\'\s]/g,'')}()`
        }
        throw new TypeError(`Value ${value} not supported for DEFAULT parameter`)
    }

    next() {
        if (this.queue.length === 0) {
            this.busy = false
            return this.emit('ready')
        }
        return this.queue.shift().resolve()
    }

    async wait() {
        if (!this.busy) {
            this.busy = true
            return Promise.resolve()
        }
        return new Promise((resolve, reject) => {
            this.queue.push({resolve, reject})
        })
    }
    async query (statement, params, client) {
        if (client === undefined) client = this.pool
        const { sql, values } = this.parseStatement(statement, params)
        this.logger.debug('EXEC SQL ::', sql.replace(/\s\s/g,'').replace(/\n/g,'').trim(), values)
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