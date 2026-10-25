'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs'); const path = require('path')
const css = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8')
const block = (sel) => { const i = css.indexOf(sel + ' {'); return css.slice(i, css.indexOf('}', i)) }

test('fonts live in variables so they can be swapped later', () => {
  assert.match(block(':root'), /--font-display:\s*"Jost"/)
  assert.match(block(':root'), /--font-body:\s*"Nunito Sans"/)
  const rules = css.replace(/--font-[a-z]+:[^;]+;/g, '')
  assert.doesNotMatch(rules, /font(-family)?:[^;]*"(Jost|Nunito Sans)"/)
})
test('signature stroke is plum in light and #e8a8bc in dark, flat colour', () => {
  assert.match(block(':root'), /--stroke:\s*#4a3a5c/)
  assert.match(block(':root[data-theme="dark"]'), /--stroke:\s*#e8a8bc/)
  assert.match(css, /\.signature-main svg path \{[^}]*stroke: var\(--stroke\)/)
  assert.doesNotMatch(css, /stroke:[^;]*gradient/)
})
test('SIGN is solid plum in light and never looks washed out when disabled', () => {
  assert.match(block(':root'), /--btn-bg:\s*#4a3a5c/)
  assert.doesNotMatch(block('.sign:disabled'), /opacity/)
})
test('dark theme uses only the confirmed dark palette', () => {
  const ok = new Set(['#4a434c', '#5a535c', '#cbbdce', '#f4eef3', '#e8a8bc', '#4a3a5c'])
  const dark = block(':root[data-theme="dark"]') + css.slice(css.indexOf('@media (prefers-color-scheme: dark)'), css.indexOf('html, body'))
  for (const h of dark.match(/#[0-9a-f]{6}/gi)) assert.ok(ok.has(h.toLowerCase()), `off-palette ${h}`)
})
test('dark SIGN is solid #e8a8bc with canvas text; light stays plum', () => {
  assert.match(block(':root[data-theme="dark"]'), /--btn-bg:\s*#e8a8bc/)
  assert.match(block(':root[data-theme="dark"]'), /--btn-fg:\s*#4a434c/)
  assert.match(block(':root'), /--btn-bg:\s*#4a3a5c/)
})
test('signature is scaled up and centred in its area', () => {
  const m = block('.signature-main')
  assert.match(m, /justify-content:\s*center/)
  assert.match(m, /zoom:\s*var\(--sig-scale\)/)
  assert.ok(parseFloat(block(':root').match(/--sig-scale:\s*([\d.]+)/)[1]) >= 2)
})
