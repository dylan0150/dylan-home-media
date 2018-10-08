const sinon = require('sinon')
const test  = require('tape')
const ORM   = require(`${__dirname}/../lib/orm`)

const test_config = {
    host: 'localhost',
    user: 'postgres',
    password: '',
    database: 'homemedia',
    port: '5432'
}
const default_config = {
    host: 'localhost',
    user: 'postgres',
    password: 'postgres',
    database: 'postgres',
    port: '5432'
}
const TEST_TABLE_NAME = `TEST_TABLE_${Date.now()}`

test('ORM :: constructor defaults', t => {
    const orm = new ORM()

    t.deepEqual(orm.config, default_config)
    t.end()
})
test('ORM :: parseStatement', t => {
    const input = 'SELECT * FROM TEST WHERE name = :name AND id = :id AND key = :name'
    const expected_output = 'SELECT * FROM TEST WHERE name = $1 AND id = $2 AND key = $1'
    const expected_values = ['john', 1]

    const orm = new ORM()
    const { sql, values } = orm.parseStatement(input, { name: 'john', 'id': 1 })

    t.deepEqual(sql, expected_output)
    t.deepEqual(values, expected_values)
    t.end()
})
test('ORM :: connect', async t => {
    const orm = new ORM(test_config)
    t.deepEqual(orm.config, test_config)

    let err
    try {
        const client = await orm.pool.connect()
        await client.release()
        await orm.done()
    } catch (e) {
        err = e
        console.error(e)
    }
    t.notOk(err)

    t.end()
})
test('ORM :: table -> droptable', async t => {
    const orm = new ORM(test_config)
    t.deepEqual(orm.config, test_config)

    orm
        .table(`${TEST_TABLE_NAME}`, 'public', err => {
            t.notOk(err)
        })
        .droptable(`${TEST_TABLE_NAME}`, 'public', async err => {
            t.notOk(err)

            try {
                await orm.query(`SELECT * FROM ${TEST_TABLE_NAME}`)
            } catch (e) {
                err = e
            }
            t.ok(err)

            orm.done()
            t.end()
        })
})
test('ORM :: full journey', async t => {
    const orm = new ORM(test_config)
    t.deepEqual(orm.config, test_config)

    orm
        .extension('uuid-ossp')
        .table(`${TEST_TABLE_NAME}`, 'public', err => t.notOk(err))
            .column('id', 'int', { default: 0, notnull: true }, err => t.notOk(err))
            .constraint('pk', { column: 'id' }, err => t.notOk(err))
            .droptable(`${TEST_TABLE_NAME}`, 'public', err => {
                t.notOk(err)
                orm.done()
                t.end()
            })

        .table(`${TEST_TABLE_NAME}_2`, 'public', err => t.notOk(err))
            .column('id', 'int', { default: 0, notnull: true }, err => t.notOk(err))
            .column('fk_id', 'int', { default: 0, notnull: true }, err => t.notOk(err))
            .column('name_1', 'varchar_255', {}, err => t.notOk(err))
            .column('name_2', 'varchar_255', {}, err => t.notOk(err))
            .constraint('pk', { column: 'id' }, err => t.notOk(err))
            .constraint('fk', { column: 'fk_id', reference_table: TEST_TABLE_NAME, reference_column: 'id' }, err => t.notOk(err))
            .constraint('uq', { columns: ['name_1','name_2'] })
            .droptable(`${TEST_TABLE_NAME}_2`, 'public', err => {
                t.notOk(err)
                orm.done()
                t.end()
            })

        
})