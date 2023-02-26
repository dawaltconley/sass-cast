import type { Value, LegacyValue } from 'sass'
import * as sass from 'sass'

/**
 * Check if string is quoted
 * @private
 * @param {string} str
 * @return {boolean}
 */
const isQuoted = (str: string): boolean => /^['"].*['"]$/.test(str)

/**
 * Surrounds a string with quotes
 * @private
 * @param {string} str
 * @param {string} q - quotes, double or single
 * @return {string}
 */
const quoteString = (str: string, q: string): string => {
  if (!q) return str
  if (isQuoted(str)) {
    q = str[0]
    str = str.slice(1, -1)
  }
  let r = new RegExp(q, 'g')
  return q + str.replace(r, '\\' + q) + q
}

/**
 * Unquotes a string
 * @private
 * @param {string} str
 * @return {string}
 */
const unquoteString = (str: string): string =>
  isQuoted(str) ? str.slice(1, -1) : str

/**
 * Parse a string as a Sass object
 * cribbed from davidkpiano/sassport
 *
 * @private
 * @param {string} str
 * @return {Value}
 */
const parseString = (str: string): Value | string => {
  let result: Value

  try {
    sass.compileString(`$_: ___(${str});`, {
      functions: {
        '___($value)': args => {
          result = args[0]
          return result
        },
      },
    })
  } catch (e) {
    return str
  }

  return result!
}

/**
 * Parse a string as a legacy Sass object
 * cribbed from davidkpiano/sassport
 *
 * @private
 * @param {string} str
 * @return {LegacyObject}
 */
const parseStringLegacy = (str: string): LegacyValue => {
  let result: LegacyValue

  try {
    sass.renderSync({
      data: `$_: ___((${str}));`,
      functions: {
        '___($value)': value => {
          result = value
          return value
        },
      },
    })
  } catch (e) {
    return str
  }

  return result!
}

/**
 * Function to handle 'toString()' methods with legacy API.
 *
 * @private
 * @param {LegacyObject} obj
 * @return {string}
 */
const legacyToString = (obj: LegacyValue): string =>
  'dartValue' in obj ? (obj.dartValue as Value).toString() : obj.toString()

/**
 * Return a value from an object and a list of keys.
 * @private
 * @param {Object|Array} obj
 * @param {*[]} attrs
 */
const getAttr = (obj: object | any[], attrs: (string | number)[]): any =>
  attrs.reduce((o, attr) => o[attr], obj)

export {
  isQuoted,
  quoteString,
  unquoteString,
  parseString,
  parseStringLegacy,
  legacyToString,
  getAttr,
}
