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

const unquotedString = str => isQuoted(str) ? str.slice(1, -1) : str;

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

const toSass = (obj, opt={}) => {
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
                sassList.setValue(i, toSass(item, opt));
            });
            return sassList;
        } else {
            let newObj = Object.entries(obj);
            let sassMap = new sass.types.Map(newObj.length);
            newObj.forEach(([ key, value ], i) => {
                sassMap.setKey(i, quotedString(key, q)); // can produce invalid Scss if unquoted
                sassMap.setValue(i, toSass(value, opt));
            });
            return sassMap;
        }
    } else if (typeof obj === 'function') {
        return toSass(obj(), opt);
    }
};

const fromSass = (obj, opt={}) => {
    let {
        preserveUnits = false,
        rgbColors = false
    } = opt;
    if (obj instanceof sass.types.Null) {
        return null;
    } else if (obj instanceof sass.types.Boolean) {
        return obj.value;
    } else if (obj instanceof sass.types.Number) {
        if (preserveUnits) {
            return [ obj.getValue(), obj.getUnit() ];
        }
        return obj.getValue();
    } else if (obj instanceof sass.types.Color) {
        if (rgbColors) {
            return {
                r: obj.getR(),
                g: obj.getG(),
                b: obj.getB(),
                a: obj.getA()
            };
        }
        return obj.toString();
    } else if (obj instanceof sass.types.String) {
        return unquotedString(obj.toString());
    } else if (obj instanceof sass.types.List) {
        let list = [];
        for (let i = 0; i < obj.getLength(); i++) {
            let value = obj.getValue(i);
            value = fromSass(value);
            list.push(value);
        }
        return list;
    } else if (obj instanceof sass.types.Map) {
        let map = {};
        for (let i = 0; i < obj.getLength(); i++) {
            let key = obj.getKey(i), value = obj.getValue(i);
            key = unquotedString(key.toString());
            map[key] = fromSass(value);
        }
        return map;
    } else {
        return obj;
    }
};

module.exports = {
    toSass,
    fromSass
};
