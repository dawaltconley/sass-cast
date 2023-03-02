const { sassFunctions: functions } = require('../index')
const fs = require('fs')
const sass = require('sass')

describe('require', () => {
    it('should import synchronous javascript data', () => {
        const { css: output } = sass.compile('./test/require.scss', { functions })
        const expected = fs.readFileSync('./test/css/require.css')
        expect(output.toString()).toEqual(expected.toString())
    })
    it('should import data from an asynchronous javascript function', async () => {
        const { css: output } = await sass.compileAsync('./test/requireAsync.scss', { functions })
        const expected = fs.readFileSync('./test/css/requireAsync.css')
        expect(output.toString()).toEqual(expected.toString())
    })
})
