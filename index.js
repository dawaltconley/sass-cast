const { isQuoted, quoteString, unquoteString, parseString } = require('./utils.js');
const sass = require('sass');

/**
 * Converts any Javascript object to an equivalent Sass object.
 * The return value will be an object from the [legacy function API](https://sass-lang.com/documentation/js-api/modules/types),
 * which can be stored as a string using the `toString()` method.
 *
 * ```javascript
 * const { toSass } = require('sass-cast');
 * 
 * const string = toSass('a simple string');
 * // quoted SassString => "'a simple string'"
 * 
 * const map = toSass({
 *   key: 'value',
 *   nested: {
 *     'complex//:key': [ null, 4 ],
 *   }
 * });
 * // SassMap => "('key': 'value', 'nested': ('complex//:key': (null, 4)))"
 *
 * This method is recursive and will convert the values of any array or object, as well as the array or object itself.
 * ```
 *
 * @param {*} value - the value to be converted
 * @param {Object} options
 * @param {boolean} [options.parseUnquotedStrings=false] - whether to parse unquoted strings for colors or numbers with units
 * @param {string} [options.quotes="'"] - the type of quotes to use when quoting Sass strings (single or double)
 * @return {LegacyObject} - a {@link https://sass-lang.com/documentation/js-api/modules#LegacyValue legacy Sass object}
 */

const toSass = (value, options={}) => {
    let {
        parseUnquotedStrings = false,
        quotes = "'",
    } = options;
    const q = quotes == '"' ? '"' : "'";
    if (value === null || value === undefined) {
        return sass.types.Null.NULL;
    } else if (typeof value === 'boolean') {
        return value
            ? sass.types.Boolean.TRUE
            : sass.types.Boolean.FALSE;
    } else if (typeof value === 'number') {
        return new sass.types.Number(value);
    } else if (typeof value === 'string') {
        // Valid JS strings can produce invalid Scss if unquoted,
        // so we want to wrap all strings in quotes,
        // except for strings that parse as colors or numbers.
        // Parsing these is expensive, so it must be enabled by an argument.
        if (parseUnquotedStrings && !isQuoted(value)) {
            let parsed = parseString(value);
            if (parsed instanceof sass.types.Color || parsed instanceof sass.types.Number)
                return parsed;
        }
        return quoteString(value, q);
    } else if (typeof value === 'object') {
        if (Array.isArray(value)) {
            let sassList = new sass.types.List(value.length);
            value.forEach((item, i) => {
                sassList.setValue(i, toSass(item, options));
            });
            return sassList;
        } else {
            let newObj = Object.entries(value);
            let sassMap = new sass.types.Map(newObj.length);
            newObj.forEach(([ key, value ], i) => {
                sassMap.setKey(i, quoteString(key, q)); // can produce invalid Scss if unquoted
                sassMap.setValue(i, toSass(value, options));
            });
            return sassMap;
        }
    } else if (typeof value === 'function') {
        return toSass(value(), options);
    }
};

/**
 * Converts legacy Sass objects to their Javascript equivalents.
 *
 * ```javascript
 * const { fromSass, toSass } = require('sass-cast');
 *
 * const sassString = toSass('a sass string object');
 * const string = fromSass(sassString);
 * // 'a sass string object'
 * ```
 *
 * @param {LegacyObject} object - a {@link https://sass-lang.com/documentation/js-api/modules#LegacyValue legacy Sass object}
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
    if (object instanceof sass.types.Null) {
        return null;
    } else if (object instanceof sass.types.Boolean) {
        return object.value;
    } else if (object instanceof sass.types.Number) {
        if (preserveUnits) {
            return [ object.getValue(), object.getUnit() ];
        }
        return object.getValue();
    } else if (object instanceof sass.types.Color) {
        if (rgbColors) {
            return {
                r: object.getR(),
                g: object.getG(),
                b: object.getB(),
                a: object.getA()
            };
        }
        return object.toString();
    } else if (object instanceof sass.types.String) {
        return unquoteString(object.getValue());
    } else if (object instanceof sass.types.List) {
        let list = [];
        for (let i = 0; i < object.getLength(); i++) {
            let value = object.getValue(i);
            value = fromSass(value, options);
            list.push(value);
        }
        return list;
    } else if (object instanceof sass.types.Map) {
        let map = {};
        for (let i = 0; i < object.getLength(); i++) {
            let key = object.getKey(i), value = object.getValue(i);
            key = unquoteString(key.toString());
            map[key] = fromSass(value, options);
        }
        return map;
    } else {
        return object;
    }
};

module.exports = {
    toSass,
    fromSass
};
