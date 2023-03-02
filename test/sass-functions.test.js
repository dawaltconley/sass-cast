const { sassFunctions: functions } = require('../index')
const fs = require('fs')
const sass = require('sass')
const assert = require('assert').strict

describe('require', () => {
    it('should import synchronous javascript data', () => {
        const { css: output } = sass.compile('./test/require.scss', { functions })
        const expected = fs.readFileSync('./test/css/require.css')
        assert.equal(output.toString(), expected.toString())
    })
    it('should import data from an asynchronous javascript function', async () => {
        const { css: output } = await sass.compileAsync('./test/requireAsync.scss', { functions })
        const expected = fs.readFileSync('./test/css/requireAsync.css')
        assert.equal(output.toString(), expected.toString())
    })
})
