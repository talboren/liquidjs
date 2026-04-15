const fs = require('fs')
const path = require('path')

const enFrontmatter = '---\ntitle: Changelog\nauto: true\n---\n\n'
const zhFrontmatter = '---\ntitle: 更新日志\nauto: true\n---\n\n'

function escapeFirstLine (content) {
  const lines = content.split('\n')
  lines[0] = lines[0]
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return lines.join('\n')
}

function escapeLiquidTags (content) {
  return content
    .replace(/{%/g, '{% raw %}{%{% endraw %}')
    .replace(/\{\{/g, '{% raw %}{{{% endraw %}')
}

function buildChangelog (raw) {
  const content = escapeLiquidTags(escapeFirstLine(raw.replace(/\r\n/g, '\n')))
  return {
    en: enFrontmatter + content,
    zh: zhFrontmatter + content
  }
}

if (require.main === module) {
  const root = path.resolve(__dirname, '..')
  const src = path.join(root, 'CHANGELOG.md')
  const raw = fs.readFileSync(src, 'utf8')
  const result = buildChangelog(raw)
  fs.writeFileSync(path.join(root, 'docs/source/tutorials/changelog.md'), result.en)
  fs.writeFileSync(path.join(root, 'docs/source/zh-cn/tutorials/changelog.md'), result.zh)
}

module.exports = { escapeFirstLine, escapeLiquidTags, buildChangelog, enFrontmatter, zhFrontmatter }
