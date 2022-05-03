const { isQuoted, unquoteString, parseString, getAttr } = require('./utils.js');
const { List, OrderedMap } = require('immutable');
const sass = require('sass');

/**
 * Converts any Javascript object to an equivalent Sass value.
 *
 * ```javascript
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
 * ```
 *
 * This method is recursive and will convert the values of any array or object, as well as the array or object itself.
 *
 * @param {*} value - the value to be converted
 * @param {Object} options
 * @param {boolean} [options.parseUnquotedStrings=false] - whether to parse unquoted strings for colors or numbers with units
 * @return {Value} - a {@link https://sass-lang.com/documentation/js-api/classes/Value Sass value} 
 */

const toSass = (value, options={}) => {
    let {
        parseUnquotedStrings = false,
    } = options;
    if (value instanceof sass.Value) {
        return value;
    } else if (value === null || value === undefined) {
        return sass.sassNull;
    } else if (typeof value === 'boolean') {
        return value ? sass.sassTrue : sass.sassFalse;
    } else if (typeof value === 'number') {
        return new sass.SassNumber(value);
    } else if (typeof value === 'string') {
        // Valid JS strings can produce invalid Scss if unquoted,
        // so we want to wrap all strings in quotes,
        // except for strings that parse as colors or numbers.
        // Parsing these is expensive, so it must be enabled by an argument.
        if (parseUnquotedStrings && !isQuoted(value)) {
            let parsed = parseString(value);
            if (parsed instanceof sass.SassColor || parsed instanceof sass.SassNumber)
                return parsed;
        }
        return new sass.SassString(value);
    } else if (typeof value === 'object') {
        if (Array.isArray(value)) {
            let sassList = value.map(value => toSass(value, options));
            return new sass.SassList(sassList);
        } else {
            let sassMap = OrderedMap(value).mapEntries(([ key, value ]) => [
                new sass.SassString(key),
                toSass(value, options)
            ]);
            return new sass.SassMap(sassMap);
        }
    } else if (typeof value === 'function') {
        return toSass(value(), options);
    }
};

const colorProperties = [ 'red', 'green', 'blue', 'hue', 'lightness', 'saturation', 'whiteness', 'blackness', 'alpha' ];

/**
 * Converts Sass values to their Javascript equivalents.
 *
 * ```javascript
 * const { fromSass, toSass } = require('sass-cast');
 *
 * const sassString = toSass('a sass string object');
 * const string = fromSass(sassString);
 * // 'a sass string object'
 * ```
 *
 * @param {Value} object - a {@link https://sass-lang.com/documentation/js-api/classes/Value Sass value}
 * @param {Object} options
 * @param {boolean} [options.preserveUnits=false] - By default, only the values of numbers are returned, not their units. If true, `fromSass` will return numbers as a two-item Array, i.e. [ value, unit ]
 * @param {boolean} [options.rgbColors=false] - By default, colors are returned as strings. If true, `fromSass` will return colors as an object with `r`, `g`, `b`, and `a`, properties.
 * @return {*} - a Javascript value corresponding to the Sass input
 */

const fromSass = (object, options={}) => {
    let {
        preserveUnits = false,
        rgbColors = false
    } = options;
    if (object instanceof sass.SassBoolean) {
        return object.value;
    } else if (object instanceof sass.SassNumber) {
        if (preserveUnits) {
            return [ object.value, object.numeratorUnits.toArray(), object.denominatorUnits.toArray() ];
        }
        return object.value;
    } else if (object instanceof sass.SassColor) {
        if (rgbColors) {
            return colorProperties.reduce((colorObj, p) => {
                colorObj[p] = object[p];
                return colorObj;
            }, {});
        }
        return object.toString();
    } else if (object instanceof sass.SassString) {
        return unquoteString(object.text);
    } else if (object instanceof sass.SassList || object instanceof List) {
        let list = [];
        for (let i = 0, value = object.get(i); value !== undefined; i++, value = object.get(i)) {
            list.push(fromSass(value, options));
        }
        return list;
    } else if (object instanceof sass.SassMap) {
        return object.contents
            .mapEntries(([k, v]) => [ k.text, fromSass(v, options) ])
            .toObject();
    } else {
        return object.realNull;
    }
};

const sassFunctions = {
    'require($module, $properties: (), $parseUnquotedStrings: false)': args => {
        const moduleName = args[0].assertString('module').text;
        const properties = args[1].realNull && fromSass(args[1].asList);
        const parseUnquotedStrings = args[2].isTruthy;
        const options = { parseUnquotedStrings };
        const convert = data => toSass(
            properties ? getAttr(data, properties) : data,
            options
        );

        let mod = require(moduleName);
        if (typeof mod === 'function')
            mod = mod();
        if (mod instanceof Promise)
            return mod.then(convert);
        return convert(mod);
    },
};

module.exports = {
    toSass,
    fromSass,
    sassFunctions,
    legacy: require('./legacy.js')
};
