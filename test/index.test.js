const { toSass, fromSass } = require('../index.js')
const sass = require('sass')

const number = (...args) => new sass.SassNumber(...args)
const string = (...args) => new sass.SassString(...args)
const color = (...args) => new sass.SassColor(...args)

describe('toSass', () => {
    it('should convert null and undefined', () => {
        expect(toSass(null)).toStrictEqual(sass.sassNull)
        expect(toSass(undefined)).toStrictEqual(sass.sassNull)
    })
    it('should convert booleans', () => {
        expect(toSass(true)).toStrictEqual(sass.sassTrue)
        expect(toSass(false)).toStrictEqual(sass.sassFalse)
    })
    it('should convert numbers', () => {
        expect(toSass(140)).toStrictEqual(number(140))
        expect(toSass(140.0)).toStrictEqual(number(140))
        expect(toSass(1.40)).toStrictEqual(number(1.4))
    })
    it('should convert strings', () => {
        expect(toSass('foo')).toStrictEqual(string('foo'))
        expect(toSass('foo bar baz')).toStrictEqual(string('foo bar baz'))
        expect(toSass("'quoted string'")).toStrictEqual(string("'quoted string'"))
        expect(toSass('"quoted string"')).toStrictEqual(string('"quoted string"'))
    })
    it('should include toString method on output values', () => {
        expect(toSass(undefined).toString()).toBe('null')
        expect(toSass(true).toString()).toBe('true')
        expect(toSass(false).toString()).toBe('false')
        expect(toSass(1.40).toString()).toBe('1.4')
        expect(toSass('quoted string').toString()).toBe('"quoted string"')
    })
    it('should convert arrays to lists', () => {
        expect(toSass([ 'foo', 4, false ]).toString()).toBe('"foo", 4, false')
        expect(toSass([ 'single item' ]).toString()).toBe('("single item",)')
    })
    it('should convert objects to maps', () => {
        expect(toSass({ foo: 'bar', baz: 4, 'lkjs:gs//': null }).toString())
            .toBe(`("foo": "bar", "baz": 4, "lkjs:gs//": null)`)
        expect(toSass({ 0: 'first', 1: 'last' }).toString())
            .toBe(`("0": "first", "1": "last")`)
        expect(toSass({ 'single': "item" }).toString())
            .toBe(`("single": "item")`)
    })
    it('should recursively convert arrays of arrays', () => {
        expect(toSass([ [ 2, 'foo' ], [ null ], [ 'foo', 'bar', 'baz' ] ]).toString())
            .toBe(`(2, "foo"), (null,), ("foo", "bar", "baz")`)
    })
    it('should recursively convert arrays of objects', () => {
        expect(toSass([ { foo: 'bar' }, { baz: null, 4: 'lkj' } ]).toString())
            .toBe(`("foo": "bar"), ("4": "lkj", "baz": null)`)
    })
    it('should recursively convert objects with array values', () => {
        expect(toSass({ foo: [ 'bar', 'baz' ], bar: [ true, false ] }).toString())
            .toBe(`("foo": ("bar", "baz"), "bar": (true, false))`)
    })
    it('should recursively convert objects with objects as values', () => {
        expect(toSass({ "nested object": { key: 'val', true: false } }).toString())
            .toBe(`("nested object": ("key": "val", "true": false))`)
    })
    it('should return null for a function', () => {
        expect(toSass(() => 'foo')).toStrictEqual(sass.sassNull)
    })

    describe('{ parseUnquotedStrings: true }', () => {
        let opt = { parseUnquotedStrings: true }
        it('should convert rgb strings to colors', () => {
            const result = toSass('rgb(100, 20, 255)', opt)
            const expected = color({ red: 100, green: 20, blue: 255 })
            expect(result.equals(expected))
        })
        it('should convert hex strings to colors', () => {
            const result = toSass('#e77acc', opt)
            const expected = color({ red: 231, green: 122, blue: 204 })
            expect(result.equals(expected))
        })
        it('should convert number strings to numbers with units', () => {
            expect(toSass('140px', opt))
                .toStrictEqual(number(140, 'px'))
            expect(toSass('0.45%', opt))
                .toStrictEqual(number(0.45, '%'))
        })
    })

    describe('{ resolveFunctions: true }', () => {
        it('should convert the result of a function', () => {
            const opt = { resolveFunctions: true }
            expect(toSass(() => 4, opt)).toStrictEqual(number(4))
            expect(toSass(() => 'foo', opt)).toStrictEqual(string('foo'))
        })
        it('should convert the result of a function using arguments', () => {
            const plus = (a, b) => a + b
            expect(toSass(plus, { resolveFunctions: [5, 7] })).toStrictEqual(number(12))
            expect(toSass(plus, { resolveFunctions: ['foo', 'bar'] })).toStrictEqual(string('foobar'))
        })
    })
})

describe('fromSass', () => {
    it('should convert null', () => {
        expect(fromSass(sass.sassNull)).toBe(null)
    })
    it('should convert booleans', () => {
        expect(fromSass(sass.sassTrue)).toBe(true)
        expect(fromSass(sass.sassFalse)).toBe(false)
    })
    it('should convert numbers', () => {
        expect(fromSass(number(140))).toBe(140)
        expect(fromSass(number(140, 'px'))).toBe('140px')
        expect(fromSass(number(140.0))).toBe(140)
        expect(fromSass(number(1.40))).toBe(1.4)
    })
    it('should convert strings', () => {
        expect(fromSass(string('foo'))).toBe('foo')
        expect(fromSass(string('foo bar baz'))).toBe('foo bar baz')
        expect(fromSass(string("'quoted string'"))).toBe('quoted string')
        expect(fromSass(string('"quoted string"'))).toBe('quoted string')
    })
    it('should convert lists to arrays', () => {
        expect(fromSass(toSass([ 'foo', 4, false ]))).toStrictEqual([ 'foo', 4, false ])
        expect(fromSass(toSass([ 'single item' ]))).toStrictEqual([ 'single item' ])
    })
    it('should convert coerced lists to arrays', () => {
        expect(fromSass(toSass('single item').asList)).toStrictEqual([ 'single item' ])
    })
    it('should convert maps to objects', () => {
        let o = { foo: 'bar', baz: 4, 'lkjs:gs//': null }
        expect(fromSass(toSass(o))).toStrictEqual(o)
        o = { 0: 'first', 1: 'last' }
        expect(fromSass(toSass(o))).toStrictEqual(o)
        o = { 'single': "item" }
        expect(fromSass(toSass(o))).toStrictEqual(o)
    })
    it('should recursively convert lists of lists', () => {
        let a = [ [ 2, 'foo' ], [ null ], [ 'foo', 'bar', 'baz' ] ]
        expect(fromSass(toSass(a))).toStrictEqual(a)
    })
    it('should recursively convert lists of maps', () => {
        let a = [ { foo: 'bar' }, { baz: null, 4: 'lkj' } ]
        expect(fromSass(toSass(a))).toStrictEqual(a)
    })
    it('should recursively convert maps with list values', () => {
        let o = { foo: [ 'bar', 'baz' ], bar: [ true, false ] }
        expect(fromSass(toSass(o))).toStrictEqual(o)
    })
    it('should recursively convert maps with maps as values', () => {
        let o = { "nested map": { key: 'val', true: false } }
        expect(fromSass(toSass(o))).toStrictEqual(o)
    })

    describe('{ preserveUnits: true }', () => {
        let opt = { preserveUnits: true }
        it('should return numbers as an array of values and units', () => {
            expect(fromSass(number(140, 'px'), opt))
                .toStrictEqual([ 140, ['px'], [] ])
            expect(fromSass(number(140), opt))
                .toStrictEqual([ 140, [], [] ])
            expect(fromSass(number(1.40, 'em'), opt))
                .toStrictEqual([ 1.4, ['em'], [] ])
            expect(
                fromSass(number(1.40, {
                    numeratorUnits: ['em'],
                    denominatorUnits: ['s']
                }), opt),
            ).toStrictEqual([ 1.4, ['em'], ['s'] ])
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
            expect(fromSass(color(input), opt)).toStrictEqual(output)
            expect(fromSass(color({ ...input, alpha: 0.2 }), opt))
                .toStrictEqual({ ...output, alpha: 0.2 })
        })
    })
})

const assertEqual = (value, toOpt = {}, fromOpt = {}) =>
    expect(fromSass(toSass(value, toOpt), fromOpt)).toBe(value)
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
