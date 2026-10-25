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
