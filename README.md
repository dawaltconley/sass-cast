# sass-cast

Convert Javascript objects to Sass objects and vice versa.

This module uses Sass's Javascript API to handle conversions.
This is slower than regex or JS-native parsing methods like the
[node-sass-utils](https://www.npmjs.com/package/node-sass-utils) `castToSass()` method
or [json2scss-map](https://www.npmjs.com/package/json2scss-map).
But it is more-or-less guaranteed to be accurate, since the majority of
the conversion is handled by Sass itself.

## Usage

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

#### Table of Contents

*   [toSass](#tosass)
    *   [Parameters](#parameters)
    *   [Examples](#examples)
*   [fromSass](#fromsass)
    *   [Parameters](#parameters-1)
    *   [Examples](#examples-1)
*   [sassFunctions](#sassfunctions)
    *   [Examples](#examples-2)
    *   [require($module, $properties: (), $parseUnquotedStrings: false)](#requiremodule-properties--parseunquotedstrings-false)
        *   [Examples](#examples-3)
        *   [Parameters](#parameters-2)
*   [legacy](#legacy)
    *   [toSass](#tosass-1)
        *   [Parameters](#parameters-3)
    *   [fromSass](#fromsass-1)
        *   [Parameters](#parameters-4)

### toSass

Converts any Javascript object to an equivalent Sass value.

This method is recursive and will convert the values of any array or object,
as well as the array or object itself.

#### Parameters

*   `value` **any** the value to be converted
*   `options` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)**  (optional, default `{}`)

    *   `options.parseUnquotedStrings` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** whether to parse unquoted strings for colors or numbers with units (optional, default `false`)

#### Examples

```javascript
const { toSass } = require('sass-cast');

const string = toSass('a simple string');
// quoted SassString => '"a simple string"'

const map = toSass({
  key: 'value',
  nested: {
    'complex//:key': [ null, 4 ],
  }
});
// SassMap => '("key": "value", "nested": ("complex//:key": (null, 4)))'
```

Returns **Value** a [Sass value](https://sass-lang.com/documentation/js-api/classes/Value)

### fromSass

Converts Sass values to their Javascript equivalents.

#### Parameters

*   `object` **Value** a [Sass value](https://sass-lang.com/documentation/js-api/classes/Value)
*   `options` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)**  (optional, default `{}`)

    *   `options.preserveUnits` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** By default, only the values of numbers are returned, not their units. If true, `fromSass` will return numbers as a two-item Array, i.e. \[ value, unit ] (optional, default `false`)
    *   `options.rgbColors` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** By default, colors are returned as strings. If true, `fromSass` will return colors as an object with `r`, `g`, `b`, and `a`, properties. (optional, default `false`)

#### Examples

```javascript
const { fromSass, toSass } = require('sass-cast');

const sassString = toSass('a sass string object');
const string = fromSass(sassString);
// 'a sass string object'
```

Returns **any** a Javascript value corresponding to the Sass input

### sassFunctions

An object defining Sass utility functions.

#### Examples

Pass to sass using the JS API

```javascript
const { sassFunctions } = require('sass-cast');
const sass = require('sass');

sass.compile('main.scss', { functions: sassFunctions });
```

#### require($module, $properties: (), $parseUnquotedStrings: false)

Sass function for importing data from Javascript or JSON files.
Calls the CommonJS `require` function under the hood.

##### Examples

```scss
// import config info from tailwindcss
$tw: require('./tailwind.config.js', $parseUnquotedStrings: true);
$tw-colors: map.get($tw, theme, extend, colors);
```

##### Parameters

*   `args`  
*   `$module` **SassString** Path to the file or module. Relative paths are relative to the Node process running Sass compilation.
*   `$properties` **SassList** List of properties, if you only want to parse part of the module data. (optional, default `()`)
*   `$parseUnquotedStrings` **SassBoolean** Passed as an option to [toSass](#tosass). (optional, default `false`)

Returns **Value** a [Sass value](https://sass-lang.com/documentation/js-api/classes/Value)

### legacy

Identical methods that interface with Sass's legacy Javascript API for older versions of Sass. Use `require('sass-cast/legacy')`.

#### toSass

Converts any Javascript object to an equivalent legacy Sass object.

##### Parameters

*   `value` **any** the value to be converted
*   `options` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)**  (optional, default `{}`)

    *   `options.parseUnquotedStrings` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** whether to parse unquoted strings for colors or numbers with units (optional, default `false`)
    *   `options.quotes` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** the type of quotes to use when quoting Sass strings (single or double) (optional, default `"'"`)

Returns **LegacyObject** a [legacy Sass object](https://sass-lang.com/documentation/js-api/modules#LegacyValue)

#### fromSass

Converts legacy Sass objects to their Javascript equivalents.

##### Parameters

*   `object` **LegacyObject** a [legacy Sass object](https://sass-lang.com/documentation/js-api/modules#LegacyValue)
*   `options` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)**  (optional, default `{}`)

    *   `options.preserveUnits` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** By default, only the values of numbers are returned, not their units. If true, `fromSass` will return numbers as a two-item Array, i.e. \[ value, unit ] (optional, default `false`)
    *   `options.rgbColors` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** By default, colors are returned as strings. If true, `fromSass` will return colors as an object with `r`, `g`, `b`, and `a`, properties. (optional, default `false`)

Returns **any** a Javascript value corresponding to the Sass input
