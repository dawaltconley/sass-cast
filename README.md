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
*   [fromSass](#fromsass)
    *   [Parameters](#parameters-1)

### toSass

Converts any Javascript object to an equivalent Sass value.

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

This method is recursive and will convert the values of any array or object, as well as the array or object itself.

#### Parameters

*   `value` **any** the value to be converted
*   `options` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)**  (optional, default `{}`)

    *   `options.parseUnquotedStrings` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** whether to parse unquoted strings for colors or numbers with units (optional, default `false`)

Returns **Value** a [Sass value](https://sass-lang.com/documentation/js-api/classes/Value)

### fromSass

Converts Sass values to their Javascript equivalents.

```javascript
const { fromSass, toSass } = require('sass-cast');

const sassString = toSass('a sass string object');
const string = fromSass(sassString);
// 'a sass string object'
```

#### Parameters

*   `object` **Value** a [Sass value](https://sass-lang.com/documentation/js-api/classes/Value)
*   `options` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)**  (optional, default `{}`)

    *   `options.preserveUnits` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** By default, only the values of numbers are returned, not their units. If true, `fromSass` will return numbers as a two-item Array, i.e. \[ value, unit ] (optional, default `false`)
    *   `options.rgbColors` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** By default, colors are returned as strings. If true, `fromSass` will return colors as an object with `r`, `g`, `b`, and `a`, properties. (optional, default `false`)

Returns **any** a Javascript value corresponding to the Sass input
