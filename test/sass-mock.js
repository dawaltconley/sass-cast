const mock = require('mock-require')
const sassAlias = process.env.SASS_ALIAS || 'sass'
if (sassAlias !== 'sass')
    mock('sass', sassAlias)
