delete require.cache
const { toSass, fromSass } = require('../legacy')
const { types, ...sass } = require('sass')
const assert = require('assert').strict

const number = (...args) => new types.Number(...args)
const string = (...args) => new types.String(...args)
const color = (...args) => new types.Color(...args)

describe('legacy', () => {
    describe('toSass', () => {
        it('should convert null and undefined', () => {
            assert.deepEqual(toSass(null), sass.NULL)
            assert.deepEqual(toSass(undefined), sass.NULL)
        })
        it('should convert booleans', () => {
            assert.deepEqual(toSass(true), sass.TRUE)
            assert.deepEqual(toSass(false), sass.FALSE)
        })
        it('should convert numbers', () => {
            assert.deepEqual(toSass(140), number(140))
            assert.deepEqual(toSass(140.0), number(140))
            assert.deepEqual(toSass(1.40), number(1.4))
        })
        it('should convert strings to quoted strings', () => {
            assert.deepEqual(toSass('foo'), string("'foo'"))
            assert.deepEqual(toSass('foo bar baz'), string("'foo bar baz'"))
            assert.deepEqual(toSass("'quoted string'"), string("'quoted string'"))
            assert.deepEqual(toSass('"quoted string"'), string('"quoted string"'))
        })
        it('able to convert strings to unquoted strings', () => {
            assert.deepEqual(toSass('foo', { quotes: null }), string('foo'))
            assert.deepEqual(toSass('foo bar baz', { quotes: '' }), string('foo bar baz'))
            assert.deepEqual(toSass("'quoted string'", { quotes: null }), string("'quoted string'"))
            assert.deepEqual(toSass('"quoted string"', { quotes: ''}), string('"quoted string"'))
        })
        it('should convert arrays to lists', () => {
            assert.equal(toSass([ 'foo', 4, false ]).dartValue.toString(), "'foo', 4, false")
            assert.equal(toSass([ 'single item' ]).dartValue.toString(), "('single item',)")
        })
        it('should convert objects to maps', () => {
            assert.equal(
                toSass({ foo: 'bar', baz: 4, 'lkjs:gs//': null }).dartValue.toString(),
                "('foo': 'bar', 'baz': 4, 'lkjs:gs//': null)")
            assert.equal(
                toSass({ 0: 'first', 1: 'last' }).dartValue.toString(),
                "('0': 'first', '1': 'last')")
            assert.equal(
                toSass({ 'single': "item" }).dartValue.toString(),
                "('single': 'item')")
        })
        it('should recursively convert arrays of arrays', () => {
            assert.equal(
                toSass([ [ 2, 'foo' ], [ null ], [ 'foo', 'bar', 'baz' ] ]).dartValue.toString(),
                "(2, 'foo'), (null,), ('foo', 'bar', 'baz')")
        })
        it('should recursively convert arrays of objects', () => {
            assert.equal(
                toSass([ { foo: 'bar' }, { baz: null, 4: 'lkj' } ]).dartValue.toString(),
                "('foo': 'bar'), ('4': 'lkj', 'baz': null)")
        })
        it('should recursively convert objects with array values', () => {
            assert.equal(
                toSass({ foo: [ 'bar', 'baz' ], bar: [ true, false ] }).dartValue.toString(),
                "('foo': ('bar', 'baz'), 'bar': (true, false))")
        })
        it('should recursively convert objects with objects as values', () => {
            assert.equal(
                toSass({ "nested object": { key: 'val', true: false } }).dartValue.toString(),
                "('nested object': ('key': 'val', 'true': false))")
        })
        it('should return null for a function', () => {
            assert.equal(toSass(() => 'foo'), sass.NULL)
        })

        describe('{ parseUnquotedStrings: true }', () => {
            let opt = { parseUnquotedStrings: true }
            it('should convert rgb strings to colors', () => {
                assert.equal(
                    toSass('rgb(100, 20, 255)', opt).toString(),
                    color(100, 20, 255).toString())
            })
            it('should convert hex strings to colors', () => {
                assert.equal(
                    toSass('#e77acc', opt).toString(),
                    color(0xffe77acc).toString())
            })
            it('should convert number strings to numbers with units', () => {
                assert.deepEqual(
                    toSass('140px', opt),
                    number(140, 'px'))
                assert.deepEqual(
                    toSass('0.45%', opt),
                    number(0.45, '%'))
            })
        })

        describe('{ resolveFunctions: true }', () => {
            it('should convert the result of a function', () => {
                const opt = { resolveFunctions: true }
                assert.deepEqual(toSass(() => 4, opt), number(4))
                assert.deepEqual(toSass(() => 'foo', opt), string("'foo'"))
            })
            it('should convert the result of a function using arguments', () => {
                const plus = (a, b) => a + b
                assert.deepEqual(toSass(plus, { resolveFunctions: [5, 7] }), number(12))
                assert.deepEqual(toSass(plus, { resolveFunctions: ['foo', 'bar'] }), string("'foobar'"))
            })
        })
    })

    describe('fromSass', () => {
        it('should convert null', () => {
            assert.equal(fromSass(sass.NULL), null)
        })
        it('should convert booleans', () => {
            assert.equal(fromSass(sass.TRUE), true)
            assert.equal(fromSass(sass.FALSE), false)
        })
        it('should convert numbers', () => {
            assert.equal(fromSass(number(140)), 140)
            assert.equal(fromSass(number(140, 'px')), '140px')
            assert.equal(fromSass(number(140.0)), 140)
            assert.equal(fromSass(number(1.40)), 1.4)
        })
        it('should convert strings', () => {
            assert.equal(fromSass(string('foo')), 'foo')
            assert.equal(fromSass(string('foo bar baz')), 'foo bar baz')
            assert.equal(fromSass(string("'quoted string'")), 'quoted string')
            assert.equal(fromSass(string('"quoted string"')), 'quoted string')
        })
        it('should convert lists to arrays', () => {
            assert.deepEqual(fromSass(toSass([ 'foo', 4, false ])), [ 'foo', 4, false ])
            assert.deepEqual(fromSass(toSass([ 'single item' ])), [ 'single item' ])
        })
        it('should convert maps to objects', () => {
            let o = { foo: 'bar', baz: 4, 'lkjs:gs//': null }
            assert.deepEqual(fromSass(toSass(o)), o)
            o = { 0: 'first', 1: 'last' }
            assert.deepEqual(fromSass(toSass(o)), o)
            o = { 'single': "item" }
            assert.deepEqual(fromSass(toSass(o)), o)
        })
        it('should recursively convert lists of lists', () => {
            let a = [ [ 2, 'foo' ], [ null ], [ 'foo', 'bar', 'baz' ] ]
            assert.deepEqual(fromSass(toSass(a)), a)
        })
        it('should recursively convert lists of maps', () => {
            let a = [ { foo: 'bar' }, { baz: null, 4: 'lkj' } ]
            assert.deepEqual(fromSass(toSass(a)), a)
        })
        it('should recursively convert maps with list values', () => {
            let o = { foo: [ 'bar', 'baz' ], bar: [ true, false ] }
            assert.deepEqual(fromSass(toSass(o)), o)
        })
        it('should recursively convert maps with maps as values', () => {
            let o = { "nested map": { key: 'val', true: false } }
            assert.deepEqual(fromSass(toSass(o)), o)
        })

        describe('{ preserveUnits: true }', () => {
            let opt = { preserveUnits: true }
            it('should return numbers as an array of values and units', () => {
                assert.deepEqual(
                    fromSass(number(140, 'px'), opt),
                    [ 140, 'px' ])
                assert.deepEqual(
                    fromSass(number(140), opt),
                    [ 140, '' ])
                assert.deepEqual(
                    fromSass(number(1.40, 'em'), opt),
                    [ 1.4, 'em' ])
            })
        })
        describe('{ rgbColors: true }', () => {
            let opt = { rgbColors: true }
            it('should return colors as rbga objects', () => {
                assert.deepEqual(
                    fromSass(color(240, 33, 109), opt),
                    { r: 240, g: 33, b: 109, a: 1 })
                assert.deepEqual(
                    fromSass(color(240, 33, 109, 0.2), opt),
                    { r: 240, g: 33, b: 109, a: 0.2 })
                assert.deepEqual(
                    fromSass(color(0xafe77acc), opt),
                    { r: 231, g: 122, b: 204, a: 0.6862745098039216 })
            })
        })
    })
})

const assertEqual = (value, toOpt = {}, fromOpt = {}) =>
    assert.equal(fromSass(toSass(value, toOpt), fromOpt), value)
describe('converting to and from sass', () => {
    it('should preserve null', () => {
        assertEqual(null)
    })
    it('should preserve booleans', () => {
        assertEqual(true)
        assertEqual(false)
    })
    it('should preserve numbers', () => {
        assertEqual(140)
        assertEqual('140px', { parseUnquotedStrings: true })
        assertEqual(140.0)
        assertEqual(1.40)
    })
    it('should preserve strings', () => {
        assertEqual('foo')
        assertEqual('foo bar baz')
        assertEqual("'quoted string'", {}, { preserveQuotes: true })
        assertEqual('"quoted string"', {}, { preserveQuotes: true })
    })
    it('should preserve colors', () => {
        assertEqual('#6414ff', { parseUnquotedStrings: true })
    })
})
