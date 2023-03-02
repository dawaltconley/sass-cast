const { sassFunctions: functions } = require('../legacy')
const fs = require('fs')
const sass = require('sass')

describe('require', () => {
    it('should import synchronous javascript data', () => {
        const { css: output } = sass.renderSync({ file: './test/require.scss', functions })
        const expected = fs.readFileSync('./test/css/require.css')
        expect(output.toString()).toBe(expected.toString())
    })
    it('should import data from an asynchronous javascript function', async () => {
        const { css: output } = await new Promise((resolve, reject) =>
            sass.render({ file: './test/requireAsync.scss', functions },
                (e, data) => e ? reject(e) : resolve(data)))
        const expected = fs.readFileSync('./test/css/requireAsync.css')
        expect(output.toString()).toEqual(expected.toString())
    })
})
