const { isQuoted, quoteString, unquoteString, parseStringLegacy, legacyToString, getAttr } = require('./utils.js');
const sass = require('sass');

const toModern = object => object.dartValue ?? object;
const toLegacy = (object) => {
  if (object === sass.NULL || object instanceof sass.SassBoolean) {
    return object;
  }
  if (object instanceof sass.SassNumber) {
    const n = object.numeratorUnits.join('*');
    const d = object.denominatorUnits.join('*');
    const unit = d && n ? `${n}/${d}` : d ? `(${d})^-1` : n;
    return new sass.types.Number(object.value, unit);
  }
  if (object instanceof sass.SassColor) {
    return new sass.types.Color(
      object.red,
      object.green,
      object.blue,
      object.alpha,
    );
  }
  if (object instanceof sass.SassString) {
    return new sass.types.String(object.getValue());
  }
  if (object instanceof sass.SassList || List.isList(object)) {
    const list = new sass.types.List(
      object.asList.size,
      object.separator === ',',
    );
    for (
      let i = 0, value = object.get(i);
      value !== undefined;
      i++, value = object.get(i)
    ) {
      list.setValue(i, toLegacy(value));
    }
    return list;
  }
  if (object instanceof sass.SassMap) {
    const map = new sass.types.Map(object.contents.size);
    object.contents.toArray().forEach(([k, v], i) => {
      map.setKey(i, toLegacy(k));
      map.setValue(i, toLegacy(v));
    });
    return map;
  }
  return object.NULL;
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
        const quotes = $quotes.getValue();
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
}
