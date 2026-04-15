const path = require('path')
const fs = require('fs')

describe('bin/build-apidoc (npm script)', () => {
  const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf8'))
  const script = pkg.scripts['build:apidoc']

  it('should be defined as an npm script', () => {
    expect(script).toBeDefined()
  })
  it('should remove the old api docs directory', () => {
    expect(script).toMatch(/shx rm -rf docs\/source\/api/)
  })
  it('should run typedoc with the missing-exports plugin', () => {
    expect(script).toMatch(/typedoc --plugin typedoc-plugin-missing-exports/)
  })
  it('should target the src directory', () => {
    expect(script).toMatch(/\.\/src/)
  })
  it('should set gitRevision to master', () => {
    expect(script).toMatch(/--gitRevision master/)
  })
  it('should output to docs/source/api', () => {
    expect(script).toMatch(/--out docs\/source\/api/)
  })
})
