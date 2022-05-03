delete require.cache[require.resolve('../index.js')]
const { toSass, fromSass } = require('../index.js')
const sass = require('sass')
const assert = require('assert').strict

const number = (...args) => new sass.SassNumber(...args)
const string = (...args) => new sass.SassString(...args)
const color = (...args) => new sass.SassColor(...args)

describe('toSass', () => {
    it('should convert null and undefined', () => {
        assert.deepEqual(toSass(null), sass.sassNull)
        assert.deepEqual(toSass(undefined), sass.sassNull)
    })
    it('should convert booleans', () => {
        assert.deepEqual(toSass(true), sass.sassTrue)
        assert.deepEqual(toSass(false), sass.sassFalse)
    })
    it('should convert numbers', () => {
        assert.deepEqual(toSass(140), number(140))
        assert.deepEqual(toSass(140.0), number(140))
        assert.deepEqual(toSass(1.40), number(1.4))
    })
    it('should convert strings', () => {
        assert.deepEqual(toSass('foo'), string('foo'))
        assert.deepEqual(toSass('foo bar baz'), string('foo bar baz'))
        assert.deepEqual(toSass("'quoted string'"), string("'quoted string'"))
        assert.deepEqual(toSass('"quoted string"'), string('"quoted string"'))
    })
    it('should include toString method on output values', () => {
        assert.equal(toSass(undefined).toString(), 'null')
        assert.equal(toSass(true).toString(), 'true')
        assert.equal(toSass(false).toString(), 'false')
        assert.equal(toSass(1.40).toString(), '1.4')
        assert.equal(toSass('quoted string').toString(), '"quoted string"')
    })
    it('should convert arrays to lists', () => {
        assert.equal(toSass([ 'foo', 4, false ]).toString(), '"foo", 4, false')
        assert.equal(toSass([ 'single item' ]).toString(), '("single item",)')
    })
    it('should convert objects to maps', () => {
        assert.equal(
            toSass({ foo: 'bar', baz: 4, 'lkjs:gs//': null }).toString(),
            `("foo": "bar", "baz": 4, "lkjs:gs//": null)`)
        assert.equal(
            toSass({ 0: 'first', 1: 'last' }).toString(),
            `("0": "first", "1": "last")`)
        assert.equal(
            toSass({ 'single': "item" }).toString(),
            `("single": "item")`)
    })
    it('should recursively convert arrays of arrays', () => {
        assert.equal(
            toSass([ [ 2, 'foo' ], [ null ], [ 'foo', 'bar', 'baz' ] ]).toString(),
            `(2, "foo"), (null,), ("foo", "bar", "baz")`)
    })
    it('should recursively convert arrays of objects', () => {
        assert.equal(
            toSass([ { foo: 'bar' }, { baz: null, 4: 'lkj' } ]).toString(),
            `("foo": "bar"), ("4": "lkj", "baz": null)`)
    })
    it('should recursively convert objects with array values', () => {
        assert.equal(
            toSass({ foo: [ 'bar', 'baz' ], bar: [ true, false ] }).toString(),
            `("foo": ("bar", "baz"), "bar": (true, false))`)
    })
    it('should recursively convert objects with objects as values', () => {
        assert.equal(
            toSass({ "nested object": { key: 'val', true: false } }).toString(),
            `("nested object": ("key": "val", "true": false))`)
    })

    describe('{ parseUnquotedStrings: true }', () => {
        let opt = { parseUnquotedStrings: true }
        it('should convert rgb strings to colors', () => {
            assert.deepEqual(
                toSass('rgb(100, 20, 255)', opt),
                color({ red: 100, green: 20, blue: 255 }))
        })
        it('should convert hex strings to colors', () => {
            assert.equal(
                toSass('#e77acc', opt).toString(),
                color({ red: 231, green: 122, blue: 204 }).toString())
        })
        it('should convert number strings to numbers with units', () => {
            assert.deepEqual(
                toSass('140px', opt),
                number(140, 'px'))
            assert.deepEqual(
                toSass('0.45%', opt).toString(),
                number(0.45, '%').toString())
        })
    })
})

describe('fromSass', () => {
    it('should convert null', () => {
        assert.equal(fromSass(sass.sassNull), null)
    })
    it('should convert booleans', () => {
        assert.equal(fromSass(sass.sassTrue), true)
        assert.equal(fromSass(sass.sassFalse), false)
    })
    it('should convert numbers', () => {
        assert.equal(fromSass(number(140)), 140)
        assert.equal(fromSass(number(140, 'px')), 140)
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
    it('should convert coerced lists to arrays', () => {
        assert.deepEqual(fromSass(toSass('single item').asList), [ 'single item' ])
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
        it('should return numbers with their units', () => {
            assert.deepEqual(
                fromSass(number(140, 'px'), opt),
                [ 140, ['px'], [] ])
            assert.deepEqual(
                fromSass(number(140), opt),
                [ 140, [], [] ])
            assert.deepEqual(
                fromSass(number(1.40, 'em'), opt),
                [ 1.4, ['em'], [] ])
            assert.deepEqual(
                fromSass(number(1.40, {
                    numeratorUnits: ['em'],
                    denominatorUnits: ['s']
                }), opt),
                [ 1.4, ['em'], ['s'] ])
        })
    })
    describe('{ rgbColors: true }', () => {
        let opt = { rgbColors: true }
        it('should return colors as rbga objects', () => {
            let input = { red: 240, green: 33, blue: 109 }
            let output = {
                ...input,
                hue: 337.9710144927536,
                lightness: 53.529411764705884,
                saturation: 87.34177215189872,
                whiteness: 12.941176470588237,
                blackness: 5.882352941176478,
                alpha: 1
            }
            assert.deepEqual(fromSass(color(input), opt), output)
            assert.deepEqual(
                fromSass(color({ ...input, alpha: 0.2 }), opt),
                { ...output, alpha: 0.2 })
        })
    })
})
