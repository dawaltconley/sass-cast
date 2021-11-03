/*
 * Converting JS objects to Sass objects using Sass's JS API.
 *
 * Slower than regex or JS-native parsing methods like AS-Devs/json2scss-map,
 * but more-or-less guaranteed to be accurate, since the majority of
 * the conversion is handled by Sass itself.
 */

const sass = require('sass');

const isQuoted = str => /^['"].*['"]$/.test(str);

const quotedString = (str, q) => {
    if (isQuoted(str)) {
        q = str[0];
        str = str.slice(1, -1);
    }
    let r = new RegExp(q, 'g');
    let quoted = q + str.replace(r, '\\'+q) + q;
    return new sass.types.String(quoted);
};

// cribbed from davidkpiano/sassport
const parseString = obj => {
    let result;

    try {  
        sass.renderSync({
            data: `$_: ___((${obj}));`,
            functions: {
                '___($value)': (value) => {
                    result = value;
                    return value;
                }
            }
        });
    } catch(e) {
        return obj;
    }

    return result;
};

const castToSass = (obj, opt={}) => {
    let {
        parseUnquotedStrings = false,
        quotes = "'",
    } = opt;
    const q = quotes == '"' ? '"' : "'";
    if (obj === null || obj === undefined) {
        return sass.types.Null.NULL;
    } else if (typeof obj === 'boolean') {
        return obj
            ? sass.types.Boolean.TRUE
            : sass.types.Boolean.FALSE;
    } else if (typeof obj === 'number') {
        return new sass.types.Number(obj);
    } else if (typeof obj === 'string') {
        // Valid JS strings can produce invalid Scss if unquoted,
        // so we want to wrap all strings in quotes,
        // except for strings that parse as colors or numbers.
        // Parsing these is expensive, so it must be enabled by an argument.
        if (parseUnquotedStrings && !isQuoted(obj)) {
            let parsed = parseString(obj);
            if (parsed instanceof sass.types.Color || parsed instanceof sass.types.Number)
                return parsed;
        }
        return quotedString(obj, q);
    } else if (typeof obj === 'object') {
        if (Array.isArray(obj)) {
            let sassList = new sass.types.List(obj.length);
            obj.forEach((item, i) => {
                sassList.setValue(i, castToSass(item, opt));
            });
            return sassList;
        } else {
            let newObj = Object.entries(obj);
            let sassMap = new sass.types.Map(newObj.length);
            newObj.forEach(([ key, value ], i) => {
                sassMap.setKey(i, quotedString(key, q)); // can produce invalid Scss if unquoted
                sassMap.setValue(i, castToSass(value, opt));
            });
            return sassMap;
        }
    } else if (typeof obj === 'function') {
        return castToSass(obj(), opt);
    }
};

module.exports = castToSass;
