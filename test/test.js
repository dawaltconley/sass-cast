const output = require('../index')
const { types, ...sass } = require('sass')
const assert = require('assert').strict

describe('output', () => {
    it('should convert null and undefined', () => {
        assert.deepEqual(output(null), sass.NULL)
        assert.deepEqual(output(undefined), sass.NULL)
    })
    it('should convert booleans', () => {
        assert.deepEqual(output(true), sass.TRUE)
        assert.deepEqual(output(false), sass.FALSE)
    })
    it('should convert numbers', () => {
        let expect = n => new types.Number(n)
        assert.deepEqual(output(140), expect(140))
        assert.deepEqual(output(140.0), expect(140))
        assert.deepEqual(output(1.40), expect(1.4))
    })
    it('should convert strings to quoted strings', () => {
        let expect = s => new types.String(s)
        assert.deepEqual(output('foo'), expect("'foo'"))
        assert.deepEqual(output('foo bar baz'), expect("'foo bar baz'"))
        assert.deepEqual(output("'quoted string'"), expect("'quoted string'"))
        assert.deepEqual(output('"quoted string"'), expect('"quoted string"'))
    })
    it('should convert arrays to lists', () => {
        assert.equal(output([ 'foo', 4, false ]).toString(), "'foo', 4, false")
        assert.equal(output([ 'single item' ]).toString(), "('single item',)")
    })
    it('should convert objects to maps', () => {
        assert.equal(
            output({ foo: 'bar', baz: 4, 'lkjs:gs//': null }).toString(),
            "('foo': 'bar', 'baz': 4, 'lkjs:gs//': null)")
        assert.equal(
            output({ 0: 'first', 1: 'last' }).toString(),
            "('0': 'first', '1': 'last')")
        assert.equal(
            output({ 'single': "item" }).toString(),
            "('single': 'item')")
    })
    it('should recursively convert arrays of arrays', () => {
        assert.equal(
            output([ [ 2, 'foo' ], [ null ], [ 'foo', 'bar', 'baz' ] ]).toString(),
            "(2, 'foo'), (null,), ('foo', 'bar', 'baz')")
    })
    it('should recursively convert arrays of objects', () => {
        assert.equal(
            output([ { foo: 'bar' }, { baz: null, 4: 'lkj' } ]).toString(),
            "('foo': 'bar'), ('4': 'lkj', 'baz': null)")
    })
    it('should recursively convert objects with array values', () => {
        assert.equal(
            output({ foo: [ 'bar', 'baz' ], bar: [ true, false ] }).toString(),
            "('foo': ('bar', 'baz'), 'bar': (true, false))")
    })
    it('should recursively convert objects with objects as values', () => {
        assert.equal(
            output({ "nested object": { key: 'val', true: false } }).toString(),
            "('nested object': ('key': 'val', 'true': false))")
    })

    describe('{ parseUnquotedStrings: true }', () => {
        let opt = { parseUnquotedStrings: true }
        it('should convert rgb strings to colors', () => {
            let expect = (...args) => new types.Color(...args)
            assert.deepEqual(
                output('rgb(100, 20, 255)', opt),
                expect(100, 20, 255))
        })
        it('should convert hex strings to colors', () => {
            let expect = (...args) => new types.Color(...args)
            assert.equal(
                output('#e77acc', opt).toString(),
                expect(0xffe77acc).toString())
        })
        it('should convert number strings to numbers with units', () => {
            let expect = (...args) => new types.Number(...args)
            assert.deepEqual(
                output('140px', opt),
                expect(140, 'px'))
            assert.deepEqual(
                output('0.45%', opt),
                expect(0.45, '%'))
        })
    })
})
