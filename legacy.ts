import sass, {
  Value,
  LegacyValue,
  types as legacy,
  LegacyFunction,
  LegacyAsyncFunction,
} from 'sass'
import {
  isQuoted,
  quoteString,
  unquoteString,
  parseStringLegacy,
  legacyToString,
  getAttr,
} from './utils'

/**
 * @namespace legacy
 * @description Identical methods that interface with Sass's legacy Javascript API for older versions of Sass. Use `require('sass-cast/legacy')`.
 */

/**
 *
 * Converts any Javascript object to an equivalent legacy Sass object.
 *
 * @memberof legacy
 * @param {*} value - the value to be converted
 * @param {Object} options
 * @param {boolean} [options.parseUnquotedStrings=false] - whether to parse unquoted strings for colors or numbers with units
 * @param {boolean|*[]} [options.resolveFunctions=false] - if true, resolve functions and attempt to cast their return values. if an array, pass as arguments when resolving
 * @param {string | null} [options.quotes="'"] - the type of quotes to use when quoting Sass strings (single or double)
 * @return {LegacyObject} - a {@link https://sass-lang.com/documentation/js-api/modules#LegacyValue legacy Sass object}
 */

type LegacySass<Input extends any> = Input extends boolean
  ? legacy.Boolean
  : Input extends number
  ? legacy.Number
  : Input extends string
  ? legacy.String
  : Input extends any[]
  ? legacy.List
  : Input extends object
  ? legacy.Map
  : LegacyValue

type ParseLegacyString<Input extends LegacyValue> = Input extends legacy.String
  ? legacy.String | legacy.Color | legacy.Number
  : Input

interface ToSassOptions {
  parseUnquotedStrings?: boolean
  resolveFunctions?: boolean | any[]
}

interface ToSassLegacyOptions extends ToSassOptions {
  quotes?: '"' | "'" | null
}

function toSass(v: null | undefined, o?: ToSassLegacyOptions): legacy.Null
function toSass(v: boolean, o?: ToSassLegacyOptions): legacy.Boolean
function toSass(v: number, o?: ToSassLegacyOptions): legacy.Number
function toSass(
  v: string,
  o?: ToSassLegacyOptions & { parseUnquotedStrings: true }
): legacy.String | legacy.Number | legacy.Color
function toSass(v: string, o?: ToSassLegacyOptions): legacy.String
function toSass(v: any[], o?: ToSassLegacyOptions): legacy.List
function toSass<F extends (...args: any) => any>(
  v: F,
  o?: ToSassOptions & {
    resolveFunctions: true | any[]
    parseUnquotedStrings: true
  }
): ParseLegacyString<LegacySass<ReturnType<F>>>
function toSass<F extends (...args: any) => any>(
  v: F,
  o?: ToSassOptions & { resolveFunctions: true | any[] }
): LegacySass<ReturnType<F>>
function toSass(v: object, o?: ToSassLegacyOptions): legacy.Map
function toSass(value: any, options: ToSassLegacyOptions = {}): LegacyValue {
  let {
    parseUnquotedStrings = false,
    resolveFunctions = false,
    quotes = "'",
  } = options
  const q = quotes && (quotes == '"' ? '"' : "'")
  if (value === null || value === undefined) {
    return sass.types.Null.NULL
  } else if (typeof value === 'boolean') {
    return value ? sass.types.Boolean.TRUE : sass.types.Boolean.FALSE
  } else if (typeof value === 'number') {
    return new sass.types.Number(value)
  } else if (typeof value === 'string') {
    // Valid JS strings can produce invalid Scss if unquoted,
    // so we want to wrap all strings in quotes,
    // except for strings that parse as colors or numbers.
    // Parsing these is expensive, so it must be enabled by an argument.
    if (parseUnquotedStrings && !isQuoted(value)) {
      let parsed = parseStringLegacy(value)
      if (
        parsed instanceof sass.types.Color ||
        parsed instanceof sass.types.Number
      ) {
        // if ('dartValue' in parsed && 'originalSpan' in (parsed.dartValue as any))
        //   (parsed.dartValue as any).originalSpan = null
        return parsed
      }
    }
    let quoted = q ? quoteString(value, q) : value
    return new sass.types.String(quoted)
  } else if (typeof value === 'object') {
    if (Array.isArray(value)) {
      let sassList = new sass.types.List(value.length)
      value.forEach((item, i) => {
        sassList.setValue(i, toSass(item, options))
      })
      return sassList
    } else {
      let newObj: [string, any][] = Object.entries(value)
      let sassMap = new sass.types.Map(newObj.length)
      newObj.forEach(([k, v], i) => {
        let quotedKey = new sass.types.String(quoteString(k, q ?? "'")) // can produce invalid Scss if unquoted
        sassMap.setKey(i, quotedKey)
        sassMap.setValue(i, toSass(v, options))
      })
      return sassMap
    }
  } else if (resolveFunctions && typeof value === 'function') {
    const args = Array.isArray(resolveFunctions) ? resolveFunctions : []
    return toSass(value(...args), options)
  }
  return sass.types.Null.NULL
}

/**
 * Converts legacy Sass objects to their Javascript equivalents.
 *
 * @memberof legacy
 * @param {LegacyObject} object - a {@link https://sass-lang.com/documentation/js-api/modules#LegacyValue legacy Sass object}
 * @param {Object} options
 * @param {boolean} [options.preserveUnits=false] - By default, only the values of numbers are returned, not their units. If true, `fromSass` will return numbers as a two-item Array, i.e. [ value, unit ]
 * @param {boolean} [options.rgbColors=false] - By default, colors are returned as strings. If true, `fromSass` will return colors as an object with `r`, `g`, `b`, and `a`, properties.
 * @param {boolean} [options.preserveQuotes=false] - By default, quoted Sass strings return their inner text as a string. If true, `fromSass` will preserve the quotes in the returned string value.
 * @return {*} - a Javascript value corresponding to the Sass input
 */

interface FromSassOptions {
  preserveUnits?: boolean
  preserveQuotes?: boolean
  rgbColors?: boolean
}

type LegacyNumberWithUnits = [number, string]
type LegacyColorObject = Record<'r' | 'g' | 'b' | 'a', number>

function fromSass(v: legacy.Boolean, o?: FromSassOptions): boolean
function fromSass(
  v: legacy.Number,
  o?: FromSassOptions & { preserveUnits: true }
): LegacyNumberWithUnits
function fromSass(v: legacy.Number, o?: FromSassOptions): number | string
function fromSass(
  v: legacy.Color,
  o?: FromSassOptions & { rgbColors: true }
): LegacyColorObject
function fromSass(v: legacy.Color, o?: FromSassOptions): string
function fromSass(v: legacy.String, o?: FromSassOptions): string
function fromSass(v: legacy.List, o?: FromSassOptions): any[]
function fromSass(v: legacy.Map, o?: FromSassOptions): object
function fromSass(v: LegacyValue, o?: FromSassOptions): any
function fromSass(object: LegacyValue, options: FromSassOptions = {}): any {
  let {
    preserveUnits = false,
    rgbColors = false,
    preserveQuotes = false,
  } = options
  if (object instanceof sass.types.Null) {
    return null
  } else if (object instanceof sass.types.Boolean) {
    return object.getValue()
  } else if (object instanceof sass.types.Number) {
    const unit = object.getUnit()
    if (preserveUnits) {
      return [object.getValue(), unit]
    } else if (unit) {
      return legacyToString(object)
    }
    return object.getValue()
  } else if (object instanceof sass.types.Color) {
    if (rgbColors) {
      const color: LegacyColorObject = {
        r: object.getR(),
        g: object.getG(),
        b: object.getB(),
        a: object.getA(),
      }
      return color
    }
    return legacyToString(object)
  } else if (object instanceof sass.types.String) {
    return preserveQuotes ? object.getValue() : unquoteString(object.getValue())
  } else if (object instanceof sass.types.List) {
    let list: any[] = []
    for (let i = 0; i < object.getLength(); i++) {
      let value = object.getValue(i)
      if (!value) break
      list.push(fromSass(value, options))
    }
    return list
  } else if (object instanceof sass.types.Map) {
    let map = {}
    for (let i = 0; i < object.getLength(); i++) {
      let key = object.getKey(i),
        value = object.getValue(i)
      let keyStr = unquoteString(legacyToString(key))
      map[keyStr] = fromSass(value, options)
    }
    return map
  } else {
    return object
  }
}

function assert<T extends Function>(value: LegacyValue, type: T): value is T {
  // return value instanceof type
  if (!(value instanceof type)) throw new Error('Bad value')
  return true
}

const expected = (type: string, name: string, actual: string) =>
  new Error(`Expected ${type} for ${name} found ${actual}`)

/**
 * An object defining legacy Sass utility functions.
 * @memberof legacy
 * @see {@link sassFunctions}
 */
const sassFunctions: { [fn: string]: LegacyFunction<'async'> } = {
  /**
   * Legacy Sass function for importing data from Javascript or JSON files.
   * @memberof legacy.sassFunctions
   * @alias require
   * @see {@link require}
   */
  'require($module, $properties: (), $parseUnquotedStrings: false, $resolveFunctions: false, $quotes: null)':
    (
      $module: LegacyValue,
      $properties: LegacyValue,
      $parseUnquotedStrings: LegacyValue,
      $resolveFunctions: LegacyValue,
      $quotes: LegacyValue
    ) => {
      // let foo = assert($module, legacy.String)
      // let foo = assertString($module)
      const moduleName =
        $module instanceof legacy.String
          ? unquoteString($module.getValue())
          : expected('string', '$module', typeof $module)
      let properties: any[],
        p = fromSass($properties)
      if (p && Array.isArray(p)) properties = p
      else properties = [p]
      const parseUnquotedStrings =
        $parseUnquotedStrings instanceof legacy.Boolean
          ? $parseUnquotedStrings.getValue()
          : expected(
              'boolean',
              '$parseUnquotedStrings',
              typeof $parseUnquotedStrings
            )
      // assertBoolean($parseUnquotedStrings, '$parseUnquotedStrings') &&
      // $parseUnquotedStrings.getValue()
      const resolveFunctions =
        $resolveFunctions instanceof legacy.List
          ? fromSass($resolveFunctions)
          : $resolveFunctions instanceof legacy.Boolean
          ? $resolveFunctions.getValue()
          : expected(
              'boolean or list',
              '$resolveFunctions',
              typeof $resolveFunctions
            )
      // : assertBoolean($resolveFunctions, '$resolveFunctions') &&
      //   $resolveFunctions.getValue()
      const quotes =
        $quotes === legacy.Null.NULL
          ? null
          : $quotes instanceof legacy.String
          ? $quotes.getValue()
          : expected('null or string', '$quotes', typeof $quotes)

      if (moduleName instanceof Error) throw moduleName
      if (parseUnquotedStrings instanceof Error) throw parseUnquotedStrings
      if (resolveFunctions instanceof Error) throw resolveFunctions
      if (quotes instanceof Error) throw quotes

      const options: ToSassLegacyOptions = {
        parseUnquotedStrings,
        resolveFunctions,
        quotes: "'",
      }
      if (quotes === '"' || quotes === null) options.quotes = quotes
      const convert = (data: object | any[]) =>
        toSass(properties ? getAttr(data, properties) : data, options)

      let mod: any,
        paths = [moduleName, `${process.cwd()}/${moduleName}`]
      for (let path of paths) {
        try {
          mod = require(path)
          break
        } catch (e) {
          if (e.code !== 'MODULE_NOT_FOUND') throw e
          continue
        }
      }
      if (!mod) throw new Error(`Couldn't find module: ${moduleName}`)

      if (resolveFunctions && typeof mod === 'function') mod = mod()
      if (mod instanceof Promise) return mod.then(convert)
      return convert(mod)
    },
}

module.exports = {
  toSass,
  fromSass,
  sassFunctions,
}
