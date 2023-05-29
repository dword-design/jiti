const { transformSync } = require('@babel/core')
const cloneDeep = require('lodash/cloneDeep')

function onError(err) {
  throw err; /* ↓ Check stack trace ↓ */
}

const myTransform = opts => {
  const babelOpts = cloneDeep(opts.babel)
  babelOpts.presets = babelOpts.presets || []
  babelOpts.plugins = babelOpts.plugins || []
  babelOpts.presets = babelOpts.presets.filter(
    preset => [].concat(preset)[0] !== '@babel/preset-env',
  )
  babelOpts.presets.push([
    '@babel/preset-env',
    { targets: { node: 14 } },
  ])
  babelOpts.plugins.push('babel-plugin-transform-import-meta')
  try {
    return {
      code: transformSync(opts.source, {
        filename: opts.filename,
        ...babelOpts,
      }).code,
    }
  } catch (error) {
    return {
      code: `exports.__JITI_ERROR__ = ${JSON.stringify({
        code: error.code
          ?.replace('BABEL_', '')
          .replace('PARSE_ERROR', 'ParseError'),
        column: error.loc?.column || 0,
        filename: opts.filename,
        line: error.loc?.line || 0,
        message: error.message?.replace('/: ', '').replace(/\(.+\)\s*$/, ''),
      })}`,
      error,
    }
  }
}

module.exports = function (filename, opts) {
  const jiti = require("../dist/jiti");

  opts = { onError, ...opts };

  if (!opts.transform) {
    opts.transform = myTransform;
  }

  return jiti(filename, opts);
};
