const {
  escapeFirstLine,
  escapeLiquidTags,
  buildChangelog,
  enFrontmatter,
  zhFrontmatter
} = require('../../bin/build-changelog')

describe('bin/build-changelog', () => {
  describe('escapeFirstLine', () => {
    it('should escape double quotes on the first line', () => {
      expect(escapeFirstLine('"hello"')).toBe('&quot;hello&quot;')
    })
    it('should escape angle brackets on the first line', () => {
      expect(escapeFirstLine('<tag>')).toBe('&lt;tag&gt;')
    })
    it('should not escape quotes/angles on subsequent lines', () => {
      const input = 'first\n"second" <tag>'
      const result = escapeFirstLine(input)
      expect(result).toBe('first\n"second" <tag>')
    })
    it('should handle single-line input', () => {
      expect(escapeFirstLine('"<>"')).toBe('&quot;&lt;&gt;&quot;')
    })
    it('should handle empty string', () => {
      expect(escapeFirstLine('')).toBe('')
    })
    it('should handle content with no special chars on line 1', () => {
      expect(escapeFirstLine('plain text\n"quoted"')).toBe('plain text\n"quoted"')
    })
  })

  describe('escapeLiquidTags', () => {
    it('should escape {% tags', () => {
      expect(escapeLiquidTags('{% if x %}')).toBe('{% raw %}{%{% endraw %} if x %}')
    })
    it('should escape {{ output tags', () => {
      expect(escapeLiquidTags('{{ name }}')).toBe('{% raw %}{{{% endraw %} name }}')
    })
    it('should escape both {% and {{ in same content', () => {
      const input = '{% if x %}{{ name }}{% endif %}'
      const result = escapeLiquidTags(input)
      expect(result).toContain('{% raw %}{%{% endraw %}')
      expect(result).toContain('{% raw %}{{{% endraw %}')
    })
    it('should not modify content without liquid tags', () => {
      expect(escapeLiquidTags('plain text')).toBe('plain text')
    })
    it('should handle empty string', () => {
      expect(escapeLiquidTags('')).toBe('')
    })
  })

  describe('buildChangelog', () => {
    it('should prepend English frontmatter for en output', () => {
      const result = buildChangelog('# Changelog')
      expect(result.en.startsWith(enFrontmatter)).toBe(true)
    })
    it('should prepend Chinese frontmatter for zh output', () => {
      const result = buildChangelog('# Changelog')
      expect(result.zh.startsWith(zhFrontmatter)).toBe(true)
    })
    it('should normalize CRLF to LF', () => {
      const result = buildChangelog('line1\r\nline2')
      expect(result.en).not.toContain('\r\n')
      expect(result.en).toContain('line1\nline2')
    })
    it('should escape liquid tags in body', () => {
      const result = buildChangelog('title\n{% if x %}{{ name }}')
      expect(result.en).toContain('{% raw %}{%{% endraw %}')
      expect(result.en).toContain('{% raw %}{{{% endraw %}')
    })
    it('should escape HTML entities only on the first line', () => {
      const result = buildChangelog('"<title>"\n"<not escaped>"')
      const body = result.en.slice(enFrontmatter.length)
      const lines = body.split('\n')
      expect(lines[0]).toBe('&quot;&lt;title&gt;&quot;')
      expect(lines[1]).toBe('"<not escaped>"')
    })
    it('should produce identical body content for en and zh', () => {
      const result = buildChangelog('# Changelog\nSome content with {% tag %} and {{ var }}')
      const enBody = result.en.slice(enFrontmatter.length)
      const zhBody = result.zh.slice(zhFrontmatter.length)
      expect(enBody).toBe(zhBody)
    })
    it('should handle empty changelog', () => {
      const result = buildChangelog('')
      expect(result.en).toBe(enFrontmatter)
      expect(result.zh).toBe(zhFrontmatter)
    })
  })

  describe('frontmatter constants', () => {
    it('should have correct English frontmatter', () => {
      expect(enFrontmatter).toBe('---\ntitle: Changelog\nauto: true\n---\n\n')
    })
    it('should have correct Chinese frontmatter', () => {
      expect(zhFrontmatter).toBe('---\ntitle: 更新日志\nauto: true\n---\n\n')
    })
  })
})
