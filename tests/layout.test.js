'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const css = require('fs').readFileSync(require('path').join(__dirname, '..', 'style.css'), 'utf8')
const rule = (sel) => { const m = new RegExp('(^|})\\s*' + sel.replace(/\./g, '\\.') + '\\s*{([^}]*)}').exec(css); return m ? m[2] : '' }

// At --sig-scale 2.2 a two-row name ("William Williams") is ~240px tall on its
// own; a fixed 240px modal clipped it (measured in Chrome: signature bottom
// 632px vs modal bottom 553px). The open modal must grow with its content.
test('open modal grows with a wrapped signature instead of a fixed height', () => {
  const r = rule('.modal.active')
  assert.ok(!/(^|;|\s)height:\s*\d/.test(r), '.modal.active has a fixed height: ' + r.trim())
  assert.match(r, /min-height:\s*240px/)
})
