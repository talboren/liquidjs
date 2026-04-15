const {
  extractSection,
  transformContributors,
  transformFinancial,
  buildContributors
} = require('../../bin/build-contributors')

describe('bin/build-contributors', () => {
  describe('extractSection', () => {
    it('should extract content between markers', () => {
      const text = 'before\n<!-- BEGIN -->\nline1\nline2\n<!-- END -->\nafter'
      expect(extractSection(text, '<!-- BEGIN -->', '<!-- END -->')).toBe('line1\nline2')
    })
    it('should return empty string when markers are not found', () => {
      expect(extractSection('no markers here', '<!-- BEGIN -->', '<!-- END -->')).toBe('')
    })
    it('should return empty string when only begin marker exists', () => {
      expect(extractSection('before\n<!-- BEGIN -->\ncontent', '<!-- BEGIN -->', '<!-- END -->')).toBe('content')
    })
    it('should return empty string when only end marker exists', () => {
      expect(extractSection('content\n<!-- END -->\nafter', '<!-- BEGIN -->', '<!-- END -->')).toBe('')
    })
    it('should not include the marker lines themselves', () => {
      const text = '<!-- BEGIN -->\ncontent\n<!-- END -->'
      const result = extractSection(text, '<!-- BEGIN -->', '<!-- END -->')
      expect(result).toBe('content')
      expect(result).not.toContain('<!-- BEGIN -->')
      expect(result).not.toContain('<!-- END -->')
    })
    it('should handle empty section between markers', () => {
      const text = '<!-- BEGIN -->\n<!-- END -->'
      expect(extractSection(text, '<!-- BEGIN -->', '<!-- END -->')).toBe('')
    })
    it('should handle markers with surrounding text on same line', () => {
      const text = 'prefix <!-- BEGIN --> suffix\ncontent\nprefix <!-- END --> suffix'
      expect(extractSection(text, '<!-- BEGIN -->', '<!-- END -->')).toBe('content')
    })
  })

  describe('transformContributors', () => {
    it('should strip content after <br /> up to </td>', () => {
      const input = '<td><a href="url"><img src="img"/><br /><sub><b>Name</b></sub></a><br /><a href="commits">code</a></td>'
      const result = transformContributors(input)
      expect(result).toContain('</a></td>')
      expect(result).not.toContain('<sub>')
    })
    it('should remove width attributes', () => {
      const input = '<td width="14.28%"><a href="url">text</a></td>'
      const result = transformContributors(input)
      expect(result).not.toContain('width=')
    })
    it('should strip newlines', () => {
      const input = '<tr>\n<td>cell</td>\n</tr>'
      const result = transformContributors(input)
      expect(result).not.toContain('\n')
    })
    it('should merge adjacent tr rows', () => {
      const input = '</tr>\n<tr>'
      const result = transformContributors(input)
      expect(result).not.toContain('</tr>')
      expect(result).not.toContain('<tr>')
    })
    it('should handle empty input', () => {
      expect(transformContributors('')).toBe('')
    })
  })

  describe('transformFinancial', () => {
    it('should strip content after <br /> up to </td>', () => {
      const input = '<td><a href="url"><img src="img"/><br />extra text</a></td>'
      const result = transformFinancial(input)
      expect(result).toContain('</a></td>')
    })
    it('should NOT remove width attributes (unlike transformContributors)', () => {
      const input = '<td width="14.28%"><a href="url">text</a></td>'
      const result = transformFinancial(input)
      expect(result).toContain('width="14.28%"')
    })
    it('should strip newlines', () => {
      const input = '<p>\n<a href="url">text</a>\n</p>'
      const result = transformFinancial(input)
      expect(result).not.toContain('\n')
    })
    it('should merge adjacent tr rows', () => {
      const input = '</tr>\n<tr>'
      const result = transformFinancial(input)
      expect(result).not.toContain('</tr>')
      expect(result).not.toContain('<tr>')
    })
    it('should handle empty input', () => {
      expect(transformFinancial('')).toBe('')
    })
  })

  describe('buildContributors', () => {
    const sampleReadme = [
      '# Project',
      '',
      '<!-- ALL-CONTRIBUTORS-LIST:START -->',
      '<table><tr>',
      '<td width="14.28%"><a href="url"><img src="img"/><br /><sub><b>Name</b></sub></a><br /><a href="code">code</a></td>',
      '</tr></table>',
      '<!-- ALL-CONTRIBUTORS-LIST:END -->',
      '',
      '<!-- FINANCIAL-CONTRIBUTORS-BEGIN -->',
      '<p>',
      '<a href="sponsor"><img src="avatar" height="80"/></a>',
      '</p>',
      '<!-- FINANCIAL-CONTRIBUTORS-END -->',
      '',
      'Footer'
    ].join('\n')

    it('should extract and transform all-contributors section', () => {
      const result = buildContributors(sampleReadme)
      expect(result.allContributors).toBeDefined()
      expect(result.allContributors).not.toContain('ALL-CONTRIBUTORS-LIST')
    })
    it('should extract and transform financial-contributors section', () => {
      const result = buildContributors(sampleReadme)
      expect(result.financialContributors).toBeDefined()
      expect(result.financialContributors).not.toContain('FINANCIAL-CONTRIBUTORS')
    })
    it('should remove width attributes from all-contributors', () => {
      const result = buildContributors(sampleReadme)
      expect(result.allContributors).not.toContain('width=')
    })
    it('should normalize CRLF to LF', () => {
      const crlfReadme = sampleReadme.replace(/\n/g, '\r\n')
      const lfResult = buildContributors(sampleReadme)
      const crlfResult = buildContributors(crlfReadme)
      expect(crlfResult.allContributors).toBe(lfResult.allContributors)
      expect(crlfResult.financialContributors).toBe(lfResult.financialContributors)
    })
    it('should return empty strings when sections are missing', () => {
      const result = buildContributors('# No sections here')
      expect(result.allContributors).toBe('')
      expect(result.financialContributors).toBe('')
    })
    it('should produce single-line output (no newlines)', () => {
      const result = buildContributors(sampleReadme)
      expect(result.allContributors).not.toContain('\n')
      expect(result.financialContributors).not.toContain('\n')
    })
  })

  describe('integration with real README', () => {
    const fs = require('fs')
    const path = require('path')
    const readmePath = path.resolve(__dirname, '../../README.md')

    let readme: string
    beforeAll(() => {
      readme = fs.readFileSync(readmePath, 'utf8')
    })

    it('should extract non-empty all-contributors from real README', () => {
      const result = buildContributors(readme)
      expect(result.allContributors.length).toBeGreaterThan(0)
    })
    it('should extract non-empty financial-contributors from real README', () => {
      const result = buildContributors(readme)
      expect(result.financialContributors.length).toBeGreaterThan(0)
    })
    it('should not contain raw contributor markers in output', () => {
      const result = buildContributors(readme)
      expect(result.allContributors).not.toContain('ALL-CONTRIBUTORS-LIST')
      expect(result.financialContributors).not.toContain('FINANCIAL-CONTRIBUTORS')
    })
    it('should produce single-line output from real README', () => {
      const result = buildContributors(readme)
      expect(result.allContributors).not.toContain('\n')
      expect(result.financialContributors).not.toContain('\n')
    })
  })
})
