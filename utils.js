const sass = require('sass');

/**
 * Check if string is quoted
 * @private
 * @param {string} str
 * @return {boolean}
 */
const isQuoted = str => /^['"].*['"]$/.test(str);

/**
 * Surrounds a string with quotes
 * @private
 * @param {string} str
 * @param {string} q - quotes, double or single
 * @return {string}
 */
const quoteString = (str, q) => {
    if (isQuoted(str)) {
        q = str[0];
        str = str.slice(1, -1);
    }
    let r = new RegExp(q, 'g');
    return q + str.replace(r, '\\'+q) + q;
};

/**
 * Unquotes a string
 * @private
 * @param {string} str
 * @return {string}
 */
const unquoteString = str => isQuoted(str) ? str.slice(1, -1) : str;

/**
 * Parse a string as a Sass object
 * cribbed from davidkpiano/sassport
 *
 * @private
 * @param {string} str
 * @return {Value}
 */
const parseString = str => {
    let result;

    try {  
        sass.compileString(`$_: ___(${str});`, {
            functions: {
                '___($value)': (args) => {
                    result = args[0];
                    return result;
                }
            }
        });
    } catch(e) {
        return str;
    }

    return result;
};

/**
 * Parse a string as a legacy Sass object
 * cribbed from davidkpiano/sassport
 *
 * @private
 * @param {string} str
 * @return {LegacyObject}
 */
const parseStringLegacy = str => {
    let result;

    try {  
        sass.renderSync({
            data: `$_: ___((${str}));`,
            functions: {
                '___($value)': (value) => {
                    result = value;
                    return value;
                }
            }
        });
    } catch(e) {
        return str;
    }

    return result;
};

/**
 * Function to handle 'toString()' methods with legacy API.
 *
 * @private
 * @param {LegacyObject} obj
 * @return {string}
 */
const legacyToString = obj => (obj.dartValue || obj).toString();

module.exports = {
    isQuoted,
    quoteString,
    unquoteString,
    parseString,
    parseStringLegacy,
    legacyToString
};
