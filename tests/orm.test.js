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
const TEST_TABLE2_NAME = `TEST_TABLE2_${Date.now()}`

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
        .droptable(`${TEST_TABLE_NAME}`, async err => {
            t.notOk(err)
            t.end()

            try {
                await orm.query(`SELECT * FROM ${TEST_TABLE_NAME}`)
            } catch (e) {
                err = e
            }
            t.ok(err)

            orm.done()
        })
})
test('ORM :: column -> dropcolumn', async t => {
    const orm = new ORM(test_config)
    t.deepEqual(orm.config, test_config)

    orm
        .extension('uuid-ossp')
        .table(`${TEST_TABLE2_NAME}`, 'public', err => {
            t.notOk(err)
        })
            .column('id', 'int', {}, err => {
                t.notOk(err)
                
                orm.done()
                t.end()
            })
})