jest.mock('sass', () => {
    const alias = process.env.SASS_ALIAS || 'sass'
    return jest.requireActual(alias)
})
