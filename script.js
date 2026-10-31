const name = document.querySelector('#First-name')
const sign = document.querySelector('.signature-main')
const uppercase = document.querySelectorAll('.letter-bank .up')
const lowercase = document.querySelectorAll('.letter-bank .lo')
const signedBy = document.querySelector('.signed-by')
const modal = document.querySelector('.modal')

const signBtn = document.querySelector('.sign')
let prev = ''

// Split into user-perceived units: a base character plus any combining
// marks, so 'ā' (precomposed or a + U+0304) is one unit.
function units(value) {
  return value.normalize('NFD').match(/\P{M}\p{M}*/gu) || []
}

// Render from the field's value, not from keystrokes: works for paste,
// autofill, mobile IMEs, non-QWERTY layouts and scripted input.
function render(value, animateFrom) {
  sign.innerHTML = ''
  units(value).forEach((u, i) => draw(u, i >= animateFrom))
}

function update() {
  const v = name.value
  const common = v.startsWith(prev) ? units(prev).length : 0 // animate only new chars
  render(v, common)
  prev = v
  modal.classList.toggle('active', v.length > 0)
  signBtn.disabled = v.trim().length === 0
}

name.addEventListener('input', update)
signBtn.addEventListener('click', () => {
  if (!signBtn.disabled) render(name.value, 0)
})
name.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.isComposing) {
    e.preventDefault()
    signBtn.click()
  }
})

// Accent strokes drawn over the base glyph, in a 10x51 box matching the
// letter viewBox height. Two paths for the diaeresis.
const ACCENTS = {
  '\u0304': ['macron', ['M1 17.5 L9 16.5']],
  '\u0300': ['grave', ['M2.5 13 L7 18']],
  '\u0301': ['acute', ['M3 18 L7.5 13']],
  '\u0302': ['circumflex', ['M1.5 18 L5 14 L8.5 18']],
  '\u0308': ['diaeresis', ['M2.5 16.5 L3 16.6', 'M7 16.5 L7.5 16.6']],
  '\u0303': ['tilde', ['M1 17.5 Q3 14.5 5 16.5 T9 15.5']],
}
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'

function strokeIn(path, length, animate) {
  path.style.strokeDasharray = String(length)
  path.style.strokeDashoffset = String(length)
  const done = () => { path.style.strokeDashoffset = '0' }
  if (animate) setTimeout(done, 250) // after the base letter has started
  else done()
}

function addAccent(letter, mark, upper, animate) {
  const [kind, paths] = ACCENTS[mark]
  const acc = document.createElement('span')
  acc.classList.add('accent')
  acc.setAttribute('data-accent', kind)
  acc.setAttribute('aria-hidden', 'true')
  // uppercase glyphs reach the top of the box, so lift the accent clear:
  // a positive viewBox min-y moves the strokes (y 13-18) up to y 1-6
  const y = upper ? 12 : 0
  acc.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 ' + y +
    ' 10 51" width="10" height="51">' + paths.map((d) => '<path d="' + d + '"></path>').join('') + '</svg>'
  acc.querySelectorAll('path').forEach((p) => strokeIn(p, 12, animate))
  letter.appendChild(acc)
}

function fallback(unit) {
  const el = document.createElement('span')
  el.classList.add('fallback')
  el.setAttribute('data-char', unit)
  el.textContent = unit
  sign.appendChild(el)
}

function draw(unit, animate) {
  if (/^\s$/.test(unit)) {
    const space = document.createElement('div')
    space.style.minWidth = '12px'
    sign.appendChild(space)
    return
  }
  const base = unit[0]
  const marks = unit.slice(1).split('')
  const i = ALPHABET.indexOf(base.toLowerCase())
  // no glyph for this base, or a mark we cannot draw: show the character
  // itself in the UI font rather than silently dropping it
  if (i < 0 || !marks.every((m) => m in ACCENTS)) {
    fallback(unit.normalize('NFC'))
    return
  }
  const upper = base !== base.toLowerCase()
  const letter = document.createElement('div')
  letter.innerHTML = (upper ? uppercase : lowercase)[i].innerHTML
  letter.classList.add(upper ? 'up' : 'lo', ALPHABET[i])
  const path = letter.querySelector('svg path')
  if (animate) {
    setTimeout(function () { path.style.strokeDashoffset = '0' }, 50)
  } else {
    path.style.strokeDashoffset = '0'
  }
  marks.forEach((m) => addAccent(letter, m, upper, animate))
  sign.appendChild(letter)
}

update()

// Light/dark: follow the system until the visitor picks one; the button
// always names the mode it switches to.
const toggle = document.querySelector('.theme-toggle')
if (toggle && document.documentElement) {
  const root = document.documentElement
  const mq = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null
  const current = () => root.getAttribute('data-theme') || (mq && mq.matches ? 'dark' : 'light')
  const label = () => {
    const dark = current() === 'dark'
    toggle.textContent = dark ? 'light mode' : 'dark mode'
    toggle.setAttribute('aria-pressed', String(dark))
  }
  toggle.addEventListener('click', () => {
    const next = current() === 'dark' ? 'light' : 'dark'
    root.setAttribute('data-theme', next)
    try { localStorage.setItem('theme', next) } catch (e) {}
    label()
  })
  if (mq && mq.addEventListener) mq.addEventListener('change', label)
  label()
}
