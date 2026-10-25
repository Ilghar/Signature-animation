'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const { load } = require('./fakedom')

const isLetter = (u) => u.classList.contains('up') || u.classList.contains('lo')
const accentOf = (u) => { const a = u.querySelector('.accent'); return a && a.getAttribute('data-accent') }

test("'Hāèl' signs fully: base letters plus macron and grave strokes", async () => {
  const d = load(); await d.type('Hāèl')
  const u = d.units()
  assert.equal(u.length, 4)
  assert.ok(u.every(isLetter))
  assert.deepEqual(u.map((x) => [...x.classList.s].find((c) => c.length === 1)), ['h', 'a', 'e', 'l'])
  assert.equal(accentOf(u[1]), 'macron')
  assert.equal(accentOf(u[2]), 'grave')
  assert.equal(accentOf(u[0]), null)
})
test('accent strokes animate in like the letter', async () => {
  const d = load(); await d.fill('ā'); await d.wait(300)
  const p = d.units()[0].querySelector('.accent').querySelector('path')
  assert.equal(p.style.strokeDashoffset, '0')
})
test('decomposed input (a + U+0304) is treated the same as precomposed ā', async () => {
  const d = load(); await d.paste('Ha\u0304e\u0300l')
  assert.equal(d.units().length, 4)
  assert.equal(accentOf(d.units()[1]), 'macron')
})
test('uppercase accented letters keep case and accent', async () => {
  const d = load(); await d.fill('ÈÁ')
  const u = d.units()
  assert.ok(u[0].classList.contains('up') && u[0].classList.contains('e'))
  assert.equal(accentOf(u[0]), 'grave'); assert.equal(accentOf(u[1]), 'acute')
})
test('characters with no glyph fall back visibly instead of vanishing', async () => {
  const d = load(); await d.fill('Zoë 2ß')
  const u = d.units()
  assert.equal(u.length, 6)
  assert.equal(accentOf(u[2]), 'diaeresis')
  assert.equal(u[4].getAttribute('data-char'), '2'); assert.equal(u[4].textContent, '2')
  assert.equal(u[5].getAttribute('data-char'), 'ß')
  assert.ok(u[4].classList.contains('fallback'))
})

test('page title is lowercase and fonts/colours stay on the studio palette', () => {
  const fs = require('node:fs'); const path = require('node:path')
  const root = path.join(__dirname, '..')
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
  const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8')
  const h1 = html.match(/<h1>([^<]*)<\/h1>/)[1]
  assert.equal(h1, h1.toLowerCase())
  assert.match(html, /family=Jost/); assert.match(html, /Nunito\+Sans/)
  assert.doesNotMatch(html + css, /Instrument|JetBrains|freepik/)
  const allowed = new Set(['#f3f1f6', '#fffcfe', '#4a3a5c', '#c97a98', '#a394ae', '#7a688c', '#e4dde8', '#4a434c', '#f4eef3', '#e8a8bc'])
  const used = (css.match(/#[0-9a-fA-F]{6}\b/g) || []).map((x) => x.toLowerCase())
  assert.deepEqual(used.filter((c) => !allowed.has(c)), [])
  assert.doesNotMatch(css, /rgba?\(\s*0\s*,\s*0\s*,\s*0/)
})
