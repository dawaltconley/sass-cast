const { sassFunctions: functions } = require('../legacy')
const fs = require('fs')
const sass = require('sass')
const assert = require('assert').strict

describe('legacy require', () => {
    it('should import synchronous javascript data', () => {
        const { css: output } = sass.renderSync({ file: './test/require.scss', functions })
        const expected = fs.readFileSync('./test/css/require.css')
        assert.equal(output.toString(), expected.toString())
    })
    it('should import data from an asynchronous javascript function', async () => {
        const { css: output } = await new Promise((resolve, reject) =>
            sass.render({ file: './test/requireAsync.scss', functions },
                (e, data) => e ? reject(e) : resolve(data)))
        const expected = fs.readFileSync('./test/css/requireAsync.css')
        assert.equal(output.toString(), expected.toString())
    })
})
