'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const { load } = require('./fakedom')

const letters = (d) => d.units().filter((u) => u.classList.contains('up') || u.classList.contains('lo')).length

test('typing draws every letter', async () => {
  const d = load(); await d.type('Hael'); assert.equal(letters(d), 4)
})
test('paste draws every letter', async () => {
  const d = load(); await d.paste('Hael'); assert.equal(letters(d), 4)
  assert.ok(d.modal.classList.contains('active'))
})
test('programmatic fill / autofill draws every letter', async () => {
  const d = load(); await d.fill('Hael'); assert.equal(letters(d), 4)
})
test('editing in the middle re-renders from the value', async () => {
  const d = load(); await d.fill('Hal'); await d.fill('Hael'); assert.equal(letters(d), 4)
})
test('clearing the field empties the signature and collapses the modal', async () => {
  const d = load(); await d.fill('Hael'); await d.fill('')
  assert.equal(d.units().length, 0); assert.ok(!d.modal.classList.contains('active'))
})
test('SIGN is a real disabled button while empty, enabled with a name', async () => {
  const d = load(); await d.wait()
  assert.equal(d.btn.disabled, true)
  await d.fill('Hael'); assert.equal(d.btn.disabled, false)
  await d.fill('   '); assert.equal(d.btn.disabled, true)
})
test('clicking SIGN (re)draws the full signature', async () => {
  const d = load(); await d.fill('Hael'); d.sign.innerHTML = ''
  await d.clickSign(); assert.equal(letters(d), 4)
})
test('Enter signs', async () => {
  const d = load(); await d.fill('Hael'); d.sign.innerHTML = ''
  await d.enter(); assert.equal(letters(d), 4)
})
test('script leaks no accidental globals', async () => {
  const d = load(); await d.type('ab')
  assert.equal(Object.prototype.hasOwnProperty.call(d.ctx, 'i'), false)
})
