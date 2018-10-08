const sinon = require('sinon')
const test  = require('tape')
const ORM   = require(`${__dirname}/../lib/orm`)

test('ORM :: constructor defaults', t => {
    const default_config = {
        host: 'localhost',
        user: 'postgres',
        password: 'postgres',
        database: 'postgres',
        port: '5432'
    }

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