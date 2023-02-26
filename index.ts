import sass, {
  Value,
  SassMap,
  SassList,
  SassColor,
  SassNumber,
  SassString,
  SassBoolean,
  CustomFunction,
} from 'sass'
import { List, OrderedMap } from 'immutable'
// import * as sass from 'sass'
import { isQuoted, unquoteString, parseString, getAttr } from './utils'

/**
 * Converts any Javascript object to an equivalent Sass value.
 *
 * This method is recursive and will convert the values of any array or object,
 * as well as the array or object itself.
 *
 * @example
 * const { toSass } = require('sass-cast');
 *
 * const string = toSass('a simple string');
 * // quoted SassString => '"a simple string"'
 *
 * const map = toSass({
 *   key: 'value',
 *   nested: {
 *     'complex//:key': [ null, 4 ],
 *   }
 * });
 * // SassMap => '("key": "value", "nested": ("complex//:key": (null, 4)))'
 *
 * @param {*} value - the value to be converted
 * @param {Object} options
 * @param {boolean} [options.parseUnquotedStrings=false] - whether to parse unquoted strings for colors or numbers with units
 * @param {boolean|*[]} [options.resolveFunctions=false] - if true, resolve functions and attempt to cast their return values. if an array, pass as arguments when resolving
 * @return {Value} - a {@link https://sass-lang.com/documentation/js-api/classes/Value Sass value}
 */

type Sass<Input extends any> = Input extends boolean
  ? SassBoolean
  : Input extends number
  ? SassNumber
  : Input extends string
  ? SassString
  : Input extends any[]
  ? SassList
  : Input extends object
  ? SassMap
  : Value

type ParseString<Input extends Value> = Input extends SassString
  ? SassString | SassColor | SassNumber
  : Input

interface ToSassOptions {
  parseUnquotedStrings?: boolean
  resolveFunctions?: boolean | any[]
}

function toSass(v: boolean, o?: ToSassOptions): SassBoolean
function toSass(v: number, o?: ToSassOptions): SassNumber
function toSass(
  v: string,
  o?: ToSassOptions & { parseUnquotedStrings: true }
): SassString | SassNumber | SassColor
function toSass(v: string, o?: ToSassOptions): SassString
function toSass(v: any[], o?: ToSassOptions): SassList
function toSass<F extends (...args: any) => any>(
  v: F,
  o?: ToSassOptions & {
    resolveFunctions: true | any[]
    parseUnquotedStrings: true
  }
): ParseString<Sass<ReturnType<F>>>
function toSass<F extends (...args: any) => any>(
  v: F,
  o?: ToSassOptions & { resolveFunctions: true | any[] }
): Sass<ReturnType<F>>
function toSass(v: object, o?: ToSassOptions): SassMap
function toSass(value: any, options: ToSassOptions = {}): Value {
  let { parseUnquotedStrings = false, resolveFunctions = false } = options
  if (value instanceof Value) {
    return value
  } else if (value === null || value === undefined) {
    console.log(value)
    return sass.sassNull
  } else if (typeof value === 'boolean') {
    console.log(value)
    return value ? sass.sassTrue : sass.sassFalse
  } else if (typeof value === 'number') {
    return new SassNumber(value)
  } else if (typeof value === 'string') {
    if (parseUnquotedStrings && !isQuoted(value)) {
      let parsed = parseString(value)
      if (parsed instanceof SassColor || parsed instanceof SassNumber)
        return parsed
    }
    return new SassString(value)
  } else if (typeof value === 'object') {
    if (Array.isArray(value)) {
      let sassList = value.map(value => toSass(value, options))
      return new SassList(sassList)
    } else {
      let sassMap = OrderedMap<any>(value).mapEntries(([key, value]) => [
        new SassString(key),
        toSass(value, options),
      ])
      return new SassMap(sassMap)
    }
  } else if (resolveFunctions && typeof value === 'function') {
    const args = Array.isArray(resolveFunctions) ? resolveFunctions : []
    return toSass(value(...args), options)
  }
  return sass.sassNull
}

const colorProperties = [
  'red',
  'green',
  'blue',
  'hue',
  'lightness',
  'saturation',
  'whiteness',
  'blackness',
  'alpha',
] as const

type ColorProperties = (typeof colorProperties)[number]

/**
 * Converts Sass values to their Javascript equivalents.
 *
 * @example
 * const { fromSass, toSass } = require('sass-cast');
 *
 * const sassString = toSass('a sass string object');
 * const string = fromSass(sassString);
 * // 'a sass string object'
 *
 * @param {Value} object - a {@link https://sass-lang.com/documentation/js-api/classes/Value Sass value}
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

type NumberWithUnits = [number, string[], string[]]
type ColorObject = Record<ColorProperties, number>

function fromSass(v: SassBoolean, o?: FromSassOptions): boolean
function fromSass(
  v: SassNumber,
  o?: FromSassOptions & { preserveUnits: true }
): NumberWithUnits
function fromSass(v: SassNumber, o?: FromSassOptions): number | string
function fromSass(
  v: SassColor,
  o?: FromSassOptions & { rgbColors: true }
): ColorObject
function fromSass(v: SassColor, o?: FromSassOptions): string
function fromSass(v: SassString, o?: FromSassOptions): string
function fromSass(v: SassList | List<Value>, o?: FromSassOptions): any[]
function fromSass(v: SassMap, o?: FromSassOptions): object
function fromSass(v: Value, o?: FromSassOptions): null | typeof v
function fromSass(
  object: Value | List<Value>,
  options: FromSassOptions = {}
): any {
  let {
    preserveUnits = false,
    rgbColors = false,
    preserveQuotes = false,
  } = options
  if (object instanceof sass.SassBoolean) {
    return object.value
  } else if (object instanceof sass.SassNumber) {
    if (preserveUnits) {
      return [
        object.value,
        object.numeratorUnits.toArray(),
        object.denominatorUnits.toArray(),
      ]
    } else if (object.numeratorUnits.size || object.denominatorUnits.size) {
      return object.toString()
    }
    return object.value
  } else if (object instanceof sass.SassColor) {
    if (rgbColors) {
      return colorProperties.reduce((colorObj, p) => {
        colorObj[p] = object[p]
        return colorObj
      }, {})
    }
    return object.toString()
  } else if (object instanceof sass.SassString) {
    return preserveQuotes ? object.text : unquoteString(object.text)
  } else if (object instanceof sass.SassList || List.isList(object)) {
    let list: any[] = []
    for (
      let i = 0, value = object.get(i);
      value !== undefined;
      i++, value = object.get(i)
    ) {
      list.push(fromSass(value, options))
    }
    return list
  } else if (object instanceof sass.SassMap) {
    return object.contents
      .mapEntries(([k, v]) => [
        k instanceof SassString ? k.text : k.toString(),
        fromSass(v, options),
      ])
      .toObject()
  } else {
    return object.realNull
  }
}

/**
 * An object defining Sass utility functions.
 *
 * @example <caption>Pass to sass using the JS API</caption>
 * const { sassFunctions } = require('sass-cast');
 * const sass = require('sass');
 *
 * sass.compile('main.scss', { functions: sassFunctions });
 */
const sassFunctions: { [fn: string]: CustomFunction<'async'> } = {
  /**
   * Sass function for importing data from Javascript or JSON files.
   * Calls the CommonJS `require` function under the hood.
   *
   * #### Examples
   *
   * ```scss
   * // import config info from tailwindcss
   * $tw: require('./tailwind.config.js', $parseUnquotedStrings: true);
   * $tw-colors: map.get($tw, theme, extend, colors);
   * ```
   * @name require
   * @memberof sassFunctions
   * @param  $module - Path to the file or module. Relative paths are relative to the Node process running Sass compilation.
   * @param  [$properties=()] - List of properties, if you only want to parse part of the module data.
   * @param  [$parseUnquotedStrings=false] - Passed as an option to {@link #tosass toSass}.
   * @param  [$resolveFunctions=false] - Passed as an option to {@link #tosass toSass}.
   * @return - a {@link https://sass-lang.com/documentation/js-api/classes/Value Sass value}
   */
  'require($module, $properties: (), $parseUnquotedStrings: false, $resolveFunctions: false)':
    args => {
      const moduleName = args[0].assertString('module').text
      const properties = args[1].realNull && fromSass(args[1].asList)
      const parseUnquotedStrings = args[2].isTruthy
      const resolveFunctions = args[3].isTruthy
      const options: ToSassOptions = {
        parseUnquotedStrings,
        resolveFunctions,
      }
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
