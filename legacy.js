const { isQuoted, quoteString, unquoteString, parseStringLegacy, legacyToString, getAttr } = require('./utils.js');
const sass = require('sass');

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

const toSass = (value, options={}) => {
    let {
        parseUnquotedStrings = false,
        resolveFunctions = false,
        quotes = "'",
    } = options;
    const q = quotes && (quotes == '"' ? '"' : "'");
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
            let parsed = parseStringLegacy(value);
            if (parsed instanceof sass.types.Color || parsed instanceof sass.types.Number) {
                if (parsed.dartValue && parsed.dartValue.originalSpan)
                    parsed.dartValue.originalSpan = null;
                return parsed;
            }
        }
        let quoted = quoteString(value, q);
        return new sass.types.String(quoted);
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
            newObj.forEach(([k, v], i) => {
                let quotedKey = new sass.types.String(quoteString(k, q));  // can produce invalid Scss if unquoted
                sassMap.setKey(i, quotedKey);
                sassMap.setValue(i, toSass(v, options));
            });
            return sassMap;
        }
    } else if (resolveFunctions && typeof value === 'function') {
        const args = Array.isArray(resolveFunctions) ? resolveFunctions : [];
        return toSass(value(...args), options);
    }
    return sass.types.Null.NULL;
};

/**
 * Converts legacy Sass objects to their Javascript equivalents.
 *
 * @memberof legacy
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
        // return object.dartValue ? object.dartValue.toString() : object.toString();
        return legacyToString(object);
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
            key = unquoteString(legacyToString(key));
            map[key] = fromSass(value, options);
        }
        return map;
    } else {
        return object;
    }
};

/**
 * An object defining legacy Sass utility functions.
 * @memberof legacy
 * @see {@link sassFunctions}
 */
const sassFunctions = {
    /**
     * Legacy Sass function for importing data from Javascript or JSON files.
     * @memberof legacy.sassFunctions
     * @alias require
     * @see {@link require}
     */
    'require($module, $properties: (), $parseUnquotedStrings: false, $resolveFunctions: false, $quotes: false)': ($module, $properties, $parseUnquotedStrings, $resolveFunctions, $quotes) => {
        const moduleName = unquoteString($module.getValue());
        let properties = fromSass($properties);
        if (properties && !Array.isArray(properties))
            properties = [ properties ];
        const parseUnquotedStrings = $parseUnquotedStrings.getValue();
        const resolveFunctions = $resolveFunctions.getValue();
        const quotes = $quotes.getValue()
        const options = {
            parseUnquotedStrings,
            resolveFunctions,
            quotes
        };
        const convert = data => toSass(
            properties ? getAttr(data, properties) : data,
            options
        );

        let mod, paths = [ moduleName, `${process.cwd()}/${moduleName}` ];
        for (let path of paths) {
            try {
                mod = require(path);
                break;
            } catch(e) {
                if (e.code !== 'MODULE_NOT_FOUND') 
                    throw e;
                continue;
            }
        }
        if (!mod) throw new Error(`Couldn't find module: ${moduleName}`);

        if (resolveFunctions && typeof mod === 'function')
            mod = mod();
        if (mod instanceof Promise)
            return mod.then(convert);
        return convert(mod);
    },
};

module.exports = {
    toSass,
    fromSass,
    sassFunctions
};
