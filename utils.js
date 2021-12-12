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
    let quoted = q + str.replace(r, '\\'+q) + q;
    return new sass.types.String(quoted);
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
 * @return {LegacyObject}
 */
const parseString = str => {
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

module.exports = {
    isQuoted,
    quoteString,
    unquoteString,
    parseString
};
