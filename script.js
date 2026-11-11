/* Signature animation — field, Sign replay, ink, fonts, path-based export.
   Script faces only appear as paths inside .sig-preview and in downloads. UI is Jost. */

// Hāèl may change the default later; keep it as one constant.
const DEFAULT_FONT = 'hand-traced'

const FONTS = [
  { id: 'hand-traced', label: 'Hand-traced', mode: 'stroke' },
  { id: 'relief', label: 'Relief SingleLine', mode: 'stroke' },
  { id: 'allura', label: 'Allura', mode: 'fill' },
  { id: 'great-vibes', label: 'Great Vibes', mode: 'fill' },
  { id: 'dancing-script', label: 'Dancing Script', mode: 'fill' },
  { id: 'caveat', label: 'Caveat', mode: 'fill' },
]

const ACCENTS = {
  '\u0304': ['macron', ['M1.5 16 L8.5 15.2']],
  '\u0300': ['grave', ['M3 13.5 L7 18']],
  '\u0301': ['acute', ['M3.5 18 L7.5 13.5']],
  '\u0308': ['diaeresis', ['M2 16.2 L3.6 15.8', 'M6.4 16.2 L8 15.8']],
  '\u0302': ['circumflex', ['M1.5 18 L5 14 L8.5 18']],
  '\u0303': ['tilde', ['M1 17.5 Q3 14.5 5 16.5 T9 15.5']],
}

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'
const PREVIEW_TEXT = 'Hāèl'
/* Fixed word gap. Hand-traced letters drop outward negative side bearings
   at word edges so this gap cannot be eaten by .lo.l / .up.i margins. */
const WORD_SPACE = 16

function isSpaceEl(el) {
  return !!(el && el.classList && el.classList.contains('space'))
}

function makeSpace() {
  const space = document.createElement('div')
  space.className = 'space'
  space.setAttribute('aria-hidden', 'true')
  space.style.flex = `0 0 ${WORD_SPACE}px`
  space.style.width = space.style.minWidth = space.style.maxWidth = WORD_SPACE + 'px'
  return space
}

function markWordEdges(root) {
  if (!root) return
  const kids = [...root.children]
  kids.forEach((el, i) => {
    el.classList.toggle('word-start', isSpaceEl(kids[i - 1]))
    el.classList.toggle('word-end', isSpaceEl(kids[i + 1]))
  })
}

const THEME_KEY = 'ilg-theme'
const INK = {
  plum: { label: 'Plum', css: 'var(--plum)', hex: '#473448' },
  ink: { label: 'Ink', css: 'var(--ink)', hex: '#5a515c' },
  mauve: { label: 'Mauve', css: 'var(--mauve-em)', hex: '#856a8e' },
  grey: { label: 'Grey', css: 'var(--grey)', hex: '#948e95' },
}

const nameField = document.querySelector('#First-name')
const signMain = document.querySelector('.signature-main')
const sigPreview = document.querySelector('#sig-preview')
const uppercase = document.querySelectorAll('.letter-bank .up')
const lowercase = document.querySelectorAll('.letter-bank .lo')
const signBtn = document.querySelector('.sign')
const modal = document.querySelector('.modal')
const signedBy = document.querySelector('.signed-by')
const statusMsg = document.querySelector('#export-status')

let currentFont = DEFAULT_FONT
let inkChoice = 'default' // follows theme until the user picks a swatch or custom
let customHex = '#473448'
let prevValue = ''
let playGen = 0
let reliefFont = null
let outlines = null
let outlinesLoading = null

function fontDef(id) {
  return FONTS.find((f) => f.id === id) || FONTS[0]
}

function units(value) {
  return (value || '').normalize('NFD').match(/\P{M}\p{M}*/gu) || []
}

function unitNFC(u) {
  return u.normalize('NFC')
}

function reducedMotion() {
  return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)
}

function isDark() {
  const t = document.documentElement.getAttribute('data-theme')
  if (t) return t === 'dark'
  return !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches)
}

function defaultInkHex() {
  return isDark() ? INK.mauve.hex : INK.plum.hex
}

function defaultInkKey() {
  return isDark() ? 'mauve' : 'plum'
}

function currentInkHex() {
  if (inkChoice === 'custom') return customHex
  if (inkChoice === 'default') return defaultInkHex()
  return (INK[inkChoice] && INK[inkChoice].hex) || defaultInkHex()
}

function applyInk() {
  const hex = currentInkHex()
  if (sigPreview) sigPreview.style.setProperty('--ink-current', hex)
  document.querySelectorAll('.sig-preview').forEach((el) => {
    el.style.setProperty('--ink-current', hex)
  })
  const label = document.querySelector('#inkname')
  if (label) {
    if (inkChoice === 'custom') label.textContent = 'Custom'
    else if (inkChoice === 'default') label.textContent = isDark() ? 'Mauve' : 'Plum'
    else label.textContent = INK[inkChoice].label
  }
  document.querySelectorAll('.sw[data-ink]').forEach((btn) => {
    const key = btn.getAttribute('data-ink')
    const on = (inkChoice === 'default' && key === defaultInkKey()) || inkChoice === key
    btn.setAttribute('aria-pressed', String(on))
  })
}

function setStatus(text) {
  if (statusMsg) statusMsg.textContent = text || ''
}

function prefersReducedOrInstant() {
  return reducedMotion()
}

/* ---------- hand-traced bank ---------- */

function strokeIn(path, length, animate, delay) {
  path.style.strokeDasharray = String(length)
  path.style.strokeDashoffset = String(length)
  if (!animate || prefersReducedOrInstant()) {
    path.style.transition = 'none'
    path.style.strokeDashoffset = '0'
    return Promise.resolve()
  }
  return new Promise((resolve) => {
    const dur = Math.min(520, Math.max(180, length * 2.2))
    setTimeout(() => {
      path.style.transition = `stroke-dashoffset ${dur}ms linear`
      path.style.strokeDashoffset = '0'
      setTimeout(resolve, dur)
    }, delay || 0)
  })
}

function addAccent(letter, mark, upper, animate) {
  const rec = ACCENTS[mark]
  if (!rec) return null
  const [kind, paths] = rec
  const acc = document.createElement('span')
  acc.classList.add('accent')
  acc.setAttribute('data-accent', kind)
  acc.setAttribute('aria-hidden', 'true')
  const y = upper ? -14 : 0
  acc.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 ' +
    y +
    ' 10 51" width="10" height="51">' +
    paths.map((d) => '<path d="' + d + '"></path>').join('') +
    '</svg>'
  letter.appendChild(acc)
  return acc
}

function placeholderEl(ch) {
  const el = document.createElement('div')
  el.classList.add('fallback')
  el.setAttribute('data-char', ch)
  el.setAttribute('title', ch)
  el.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 51" width="16" height="51" aria-hidden="true">' +
    '<path d="M3 18 L8 13 L13 18 L8 23 Z M8 23 L8 34"></path></svg>'
  return el
}

function drawHandUnit(unit, animate) {
  if (/^\s$/.test(unit[0]) && unit.length === 1) {
    signMain.appendChild(makeSpace())
    markWordEdges(signMain)
    return Promise.resolve()
  }
  const base = unit[0]
  const marks = unit.slice(1).split('')
  const i = ALPHABET.indexOf(base.toLowerCase())
  const knownMarks = marks.every((m) => m in ACCENTS)
  if (i < 0) {
    signMain.appendChild(placeholderEl(unitNFC(unit)))
    const path = signMain.lastChild.querySelector('path')
    return path ? strokeIn(path, path.getTotalLength(), animate, 0) : Promise.resolve()
  }
  const upper = base !== base.toLowerCase()
  const letter = document.createElement('div')
  letter.innerHTML = (upper ? uppercase : lowercase)[i].innerHTML
  letter.classList.add('letter', upper ? 'up' : 'lo', ALPHABET[i])
  signMain.appendChild(letter)
  markWordEdges(signMain)
  const basePath = letter.querySelector('svg path')
  const accEls = []
  marks.forEach((m) => {
    if (m in ACCENTS) accEls.push(addAccent(letter, m, upper, animate))
  })
  if (!knownMarks) {
    marks.filter((m) => !(m in ACCENTS)).forEach(() => {
      letter.appendChild(placeholderEl('◌'))
    })
  }
  const run = async () => {
    if (basePath) {
      let len = 40
      try { len = basePath.getTotalLength() } catch (e) { /* ignore */ }
      await strokeIn(basePath, len, animate, 0)
    }
    for (const acc of accEls) {
      if (!acc) continue
      const paths = [...acc.querySelectorAll('path')]
      for (const p of paths) {
        let len = 12
        try { len = Math.max(8, p.getTotalLength()) } catch (e) { /* ignore */ }
        await strokeIn(p, len, animate, 0)
      }
    }
  }
  return run()
}

async function renderHand(value, animateFrom, gen) {
  signMain.innerHTML = ''
  signMain.classList.add('mode-stroke')
  signMain.classList.remove('mode-fill')
  if (sigPreview) {
    sigPreview.classList.add('mode-stroke')
    sigPreview.classList.remove('mode-fill', 'is-wiping')
  }
  const list = units(value)
  for (let i = 0; i < list.length; i++) {
    if (gen !== playGen) return
    const animate = i >= animateFrom
    await drawHandUnit(list[i], animate)
  }
  markWordEdges(signMain)
}

/* ---------- Relief SingleLine ---------- */

async function loadRelief() {
  if (reliefFont) return reliefFont
  const res = await fetch('fonts/signature/relief/ReliefSingleLineSVG-Regular.svg')
  const s = await res.text()
  const defaultAdv = parseInt((s.match(/<font [^>]*horiz-adv-x="(\d+)"/) || [])[1], 10)
  const glyphs = {}
  const names = {}
  for (const g of s.matchAll(/<glyph\b([^>]*)\/>/g)) {
    const a = Object.fromEntries([...g[1].matchAll(/([\w-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]))
    if (!a.unicode) continue
    const ta = document.createElement('textarea')
    ta.innerHTML = a.unicode
    const u = ta.value
    if (u.length !== 1) continue
    glyphs[u] = { adv: parseInt(a['horiz-adv-x'] || defaultAdv, 10), d: a.d || '', name: a['glyph-name'] || '' }
    names[u] = a['glyph-name'] || ''
  }
  const kern = {}
  const nameOf = (n) => Object.keys(names).filter((u) => names[u] === n)
  for (const k of s.matchAll(/<hkern\b([^>]*)\/>/g)) {
    const a = Object.fromEntries([...k[1].matchAll(/([\w-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]))
    const decode = (x) => {
      const ta = document.createElement('textarea')
      ta.innerHTML = x
      return ta.value
    }
    const L = (a.u1 ? a.u1.split(',').filter(Boolean).map(decode) : []).concat(
      (a.g1 ? a.g1.split(',').filter(Boolean) : []).flatMap(nameOf)
    )
    const R = (a.u2 ? a.u2.split(',').filter(Boolean).map(decode) : []).concat(
      (a.g2 ? a.g2.split(',').filter(Boolean) : []).flatMap(nameOf)
    )
    const kv = parseInt(a.k, 10)
    L.forEach((l) => R.forEach((r) => { kern[l + '\0' + r] = kv }))
  }
  reliefFont = { glyphs, kern, defaultAdv }
  return reliefFont
}

function reliefStrokes(text) {
  const font = reliefFont
  let x = 0
  const parts = []
  let prev = null
  for (const unit of units(text)) {
    const ch = unitNFC(unit)
    if (ch === ' ') {
      x += font.defaultAdv * 0.4
      prev = ch
      continue
    }
    const g = font.glyphs[ch]
    if (!g || !g.d) {
      parts.push({ missing: ch, x, strokes: ['M140 200v400'] })
      x += font.defaultAdv
      prev = ch
      continue
    }
    if (prev) x -= font.kern[prev + '\0' + ch] || 0
    const strokes = (g.d.match(/M[^M]*/g) || [g.d]).map((d) => d.trim()).filter(Boolean)
    parts.push({ ch, x, strokes })
    x += g.adv
    prev = ch
  }
  return { parts, width: x + 40 }
}

function reliefSvgMarkup(text, cls, heightClass) {
  const { parts, width } = reliefStrokes(text)
  const paths = parts.flatMap((p) =>
    p.strokes.map((d) => `<path transform="translate(${p.x} 800) scale(1 -1)" d="${d}"/>`)
  )
  const label = escapeAttr(text)
  return {
    html:
      `<svg class="sig-relief ${cls || ''} ${heightClass || 'r-xl'}" viewBox="-20 -10 ${width} 1050" role="img" aria-label="${label}" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">` +
      paths.join('') +
      '</svg>',
    parts,
    width,
  }
}

async function renderRelief(value, animate, gen) {
  await loadRelief()
  if (gen !== playGen) return
  signMain.innerHTML = ''
  signMain.classList.add('mode-stroke')
  signMain.classList.remove('mode-fill')
  sigPreview.classList.add('mode-stroke')
  sigPreview.classList.remove('mode-fill', 'is-wiping')
  const built = reliefSvgMarkup(value, '', 'r-xl')
  signMain.innerHTML = built.html
  const svg = signMain.querySelector('svg')
  if (!svg) return
  const paths = [...svg.querySelectorAll('path')]
  if (!animate || prefersReducedOrInstant()) {
    paths.forEach((p) => {
      p.style.transition = 'none'
      p.style.strokeDashoffset = '0'
    })
    return
  }
  // Stroke by stroke, grouped by letter (parts[i].strokes).
  let idx = 0
  for (const part of built.parts) {
    for (let s = 0; s < part.strokes.length; s++) {
      if (gen !== playGen) return
      const p = paths[idx++]
      if (!p) continue
      let len = 40
      try { len = p.getTotalLength() } catch (e) { /* ignore */ }
      await strokeIn(p, len, true, 0)
    }
  }
}

/* ---------- outline (filled) fonts ---------- */

async function loadOutlines() {
  if (outlines) return outlines
  if (!outlinesLoading) {
    outlinesLoading = fetch('fonts/signature/outlines.json').then((r) => r.json()).then((data) => {
      outlines = data
      return data
    })
  }
  return outlinesLoading
}

function filledArtwork(fontId, text, fontSize) {
  const font = outlines[fontId]
  const fs = fontSize || 72
  const scale = fs / font.upm
  let x = 0
  const paths = []
  const missing = []
  for (const unit of units(text)) {
    const ch = unitNFC(unit)
    if (ch === ' ' || ch === '\u00a0') {
      x += (font.glyphs[' '] ? font.glyphs[' '].adv : font.upm * 0.3) * scale
      continue
    }
    const g = font.glyphs[ch]
    if (!g || !g.d) {
      missing.push(ch)
      // visible placeholder diamond in font units, then scaled
      const d = 'M250 -400 L500 -150 L250 100 L0 -150 Z'
      paths.push({ d, x, y: font.ascent * scale, scale, placeholder: ch })
      x += 500 * scale
      continue
    }
    paths.push({ d: g.d, x, y: font.ascent * scale, scale, adv: g.adv * scale })
    x += g.adv * scale
  }
  const height = (font.ascent - font.descent) * scale
  return { paths, width: x, height, ascent: font.ascent * scale, missing }
}

function filledSvgMarkup(fontId, text, cls, heightPx) {
  const art = filledArtwork(fontId, text, 72)
  const pad = 8
  const paths = art.paths
    .map((p) => `<path transform="translate(${p.x + pad} ${p.y + pad}) scale(${p.scale})" d="${p.d}"/>`)
    .join('')
  const w = art.width + pad * 2
  const h = art.height + pad * 2
  return {
    html:
      `<svg class="sig-filled ${cls || ''}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${escapeAttr(text)}" fill="currentColor">` +
      `<g class="wipe-target">${paths}</g></svg>`,
    art,
    width: w,
    height: h,
  }
}

async function renderFill(fontId, value, animate, gen) {
  await loadOutlines()
  if (gen !== playGen) return
  signMain.innerHTML = ''
  signMain.classList.add('mode-fill')
  signMain.classList.remove('mode-stroke')
  sigPreview.classList.add('mode-fill')
  sigPreview.classList.remove('mode-stroke')
  const built = filledSvgMarkup(fontId, value, '', 84)
  signMain.innerHTML = built.html
  if (animate && !prefersReducedOrInstant()) {
    sigPreview.classList.remove('is-wiping')
    void sigPreview.offsetWidth
    sigPreview.classList.add('is-wiping')
  } else {
    sigPreview.classList.remove('is-wiping')
  }
}

/* ---------- render router ---------- */

async function render(value, animateFrom) {
  const gen = ++playGen
  const has = (value || '').length > 0
  if (modal) modal.classList.toggle('active', has)
  if (signedBy) signedBy.classList.toggle('is-on', has)
  if (signBtn) signBtn.disabled = !has || !value.trim()
  if (!has) {
    signMain.innerHTML = ''
    return
  }
  const def = fontDef(currentFont)
  applyInk()
  if (def.id === 'hand-traced') return renderHand(value, animateFrom, gen)
  if (def.id === 'relief') return renderRelief(value, animateFrom === 0, gen)
  return renderFill(def.id, value, animateFrom === 0, gen)
}

function onInput() {
  const v = nameField.value
  const prevUnits = units(prevValue)
  let common = 0
  if (v.startsWith(prevValue)) common = prevUnits.length
  prevValue = v
  render(v, common)
}

function replay() {
  if (!nameField.value.trim()) return
  prevValue = nameField.value
  render(nameField.value, 0)
}

/* ---------- picker ---------- */

function checkSvg() {
  return '<svg class="check" viewBox="0 0 14 14" aria-hidden="true"><path d="M2.5 7.5l3 3 6-7"/></svg>'
}

async function fillPickerTiles() {
  const list = document.querySelector('#font-list')
  if (!list) return
  // Hand-traced tile: clone a compact Hāèl from the bank once fonts/banks exist
  const handPrev = list.querySelector('[data-font="hand-traced"] .prev')
  if (handPrev && !handPrev.hasChildNodes()) {
    const tmp = document.createElement('div')
    tmp.className = 'signature-main mode-stroke'
    // build without animation by temporarily pointing signMain
    const saved = signMain
    // simpler: render into the tile directly
    await paintHandPreview(handPrev, PREVIEW_TEXT)
  }
  try {
    await loadRelief()
    const relPrev = list.querySelector('[data-font="relief"] .prev')
    if (relPrev) relPrev.innerHTML = reliefSvgMarkup(PREVIEW_TEXT, '', 'r-prev').html
  } catch (e) { console.warn('Relief preview', e) }
  try {
    await loadOutlines()
    FONTS.filter((f) => f.mode === 'fill').forEach((f) => {
      const node = list.querySelector(`[data-font="${f.id}"] .prev`)
      if (node) node.innerHTML = filledSvgMarkup(f.id, PREVIEW_TEXT, '', 40).html.replace('r-xl', 'r-prev')
    })
  } catch (e) { console.warn('Outline preview', e) }
}

async function paintHandPreview(host, text) {
  host.innerHTML = ''
  host.classList.add('mode-stroke', 'hand-prev')
  const wrap = document.createElement('div')
  wrap.className = 'signature-main mode-stroke'
  host.appendChild(wrap)
  const stored = { inner: signMain }
  // Use a local builder
  units(text).forEach((unit) => {
    if (/^\s$/.test(unit[0]) && unit.length === 1) {
      wrap.appendChild(makeSpace())
      return
    }
    const base = unit[0]
    const marks = unit.slice(1).split('')
    const i = ALPHABET.indexOf(base.toLowerCase())
    if (i < 0) {
      wrap.appendChild(placeholderEl(unitNFC(unit)))
      return
    }
    const upper = base !== base.toLowerCase()
    const letter = document.createElement('div')
    letter.innerHTML = (upper ? uppercase : lowercase)[i].innerHTML
    letter.classList.add('letter', upper ? 'up' : 'lo', ALPHABET[i])
    const path = letter.querySelector('svg path')
    if (path) {
      path.style.transition = 'none'
      path.style.strokeDashoffset = '0'
    }
    marks.forEach((m) => {
      const acc = addAccent(letter, m, upper, false)
      if (acc) acc.querySelectorAll('path').forEach((p) => {
        p.style.transition = 'none'
        p.style.strokeDashoffset = '0'
      })
    })
    wrap.appendChild(letter)
  })
  markWordEdges(wrap)
}

function setFont(id, replaySign) {
  currentFont = id
  const def = fontDef(id)
  const btn = document.querySelector('#font-select')
  if (btn) {
    const lab = btn.querySelector('[data-font-label]')
    if (lab) lab.textContent = def.label
  }
  document.querySelectorAll('#font-list .opt').forEach((opt) => {
    const on = opt.getAttribute('data-font') === id
    opt.setAttribute('aria-selected', String(on))
    const fname = opt.querySelector('.fname')
    if (fname) {
      const existing = fname.querySelector('.check')
      if (existing) existing.remove()
      if (on) fname.insertAdjacentHTML('beforeend', checkSvg())
    }
  })
  if (replaySign) render(nameField.value, 0)
}

function closePicker() {
  const btn = document.querySelector('#font-select')
  const list = document.querySelector('#font-list')
  if (btn) btn.setAttribute('aria-expanded', 'false')
  if (list) list.classList.remove('is-open')
}

function togglePicker() {
  const btn = document.querySelector('#font-select')
  const list = document.querySelector('#font-list')
  const open = btn && btn.getAttribute('aria-expanded') === 'true'
  if (open) closePicker()
  else {
    if (btn) btn.setAttribute('aria-expanded', 'true')
    if (list) list.classList.add('is-open')
    fillPickerTiles()
  }
}

/* ---------- export ---------- */

function escapeAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

function fileBase() {
  const raw = (nameField.value || 'signature').trim() || 'signature'
  const slug = raw.normalize('NFKD').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '')
  return slug || 'signature'
}

function downloadBlob(blob, filename) {
  const a = document.createElement('a')
  const url = URL.createObjectURL(blob)
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

function tightSvg(html, mode, hex) {
  const host = document.createElement('div')
  host.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden'
  host.innerHTML = html
  document.body.appendChild(host)
  const svg = host.querySelector('svg')
  let out = { text: '', width: 0, height: 0 }
  if (svg) {
    let bb
    try { bb = svg.getBBox() } catch (e) { bb = { x: 0, y: 0, width: 0, height: 0 } }
    const sw = mode === 'stroke' ? 3 : 0
    const x = bb.x - sw
    const y = bb.y - sw
    const w = Math.max(1, bb.width + sw * 2)
    const h = Math.max(1, bb.height + sw * 2)
    svg.setAttribute('viewBox', `${x} ${y} ${w} ${h}`)
    svg.setAttribute('width', String(Math.round(w)))
    svg.setAttribute('height', String(Math.round(h)))
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    if (mode === 'stroke') {
      svg.setAttribute('fill', 'none')
      svg.setAttribute('stroke', hex)
      svg.setAttribute('stroke-linecap', 'round')
      svg.setAttribute('stroke-linejoin', 'round')
    } else {
      svg.setAttribute('fill', hex)
      svg.removeAttribute('stroke')
    }
    // strip size-only presentation, leave paths
    svg.querySelectorAll('title,desc').forEach((n) => n.remove())
    const inner = new XMLSerializer().serializeToString(svg)
    out = { text: '<?xml version="1.0" encoding="UTF-8"?>\n' + inner + '\n', width: w, height: h, svg }
  }
  host.remove()
  return out
}

async function buildExportSvg() {
  const text = nameField.value
  const def = fontDef(currentFont)
  const hex = currentInkHex()
  applyInk()
  if (def.id === 'hand-traced') {
    // Rebuild a standalone SVG from the on-page letters (paths only).
    const html = handDomToSvg(hex)
    return { ...tightSvg(html, 'stroke', hex), mode: 'stroke' }
  }
  if (def.id === 'relief') {
    await loadRelief()
    const built = reliefSvgMarkup(text, '', 'r-xl')
    // give stroke a concrete colour and width for the file
    const svg = built.html
      .replace('stroke="currentColor"', `stroke="${hex}" stroke-width="40"`)
    return { ...tightSvg(svg, 'stroke', hex), mode: 'stroke' }
  }
  await loadOutlines()
  const built = filledSvgMarkup(def.id, text, '', 84)
  const svg = built.html.replace('fill="currentColor"', `fill="${hex}"`)
  return { ...tightSvg(svg, 'fill', hex), mode: 'fill' }
}

function handDomToSvg(hex) {
  const letters = [...signMain.children]
  let x = 0
  const parts = []
  let maxH = 51
  letters.forEach((el) => {
    if (isSpaceEl(el) || (!el.querySelector('svg') && el.style.minWidth && !el.querySelector('path'))) {
      x += WORD_SPACE
      return
    }
    const svg = el.querySelector('svg:not(.accent svg)')
    const baseSvg = el.querySelector(':scope > svg')
    if (!baseSvg) {
      x += 16
      return
    }
    const w = parseFloat(baseSvg.getAttribute('width')) || 16
    const h = parseFloat(baseSvg.getAttribute('height')) || 51
    maxH = Math.max(maxH, h)
    const vb = baseSvg.getAttribute('viewBox') || `0 0 ${w} ${h}`
    const d = (baseSvg.querySelector('path') && baseSvg.querySelector('path').getAttribute('d')) || ''
    const style = getComputedStyle(el)
    const ml = parseFloat(style.marginLeft) || 0
    const mr = parseFloat(style.marginRight) || 0
    // CSS box order: margin-left, then the glyph, then margin-right.
    // A word-end letter's leftover left bearing must not eat the following space.
    x += ml
    const at = x
    parts.push(`<g transform="translate(${at},0)"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="${vb}" width="${w}" height="${h}"><path d="${d}" fill="none" stroke="${hex}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/></svg>`)
    el.querySelectorAll('.accent').forEach((acc) => {
      const asvg = acc.querySelector('svg')
      if (!asvg) return
      const aw = parseFloat(asvg.getAttribute('width')) || 10
      const avb = asvg.getAttribute('viewBox') || `0 0 10 51`
      const ax = (w - aw) / 2
      const apaths = [...asvg.querySelectorAll('path')]
        .map((p) => `<path d="${p.getAttribute('d')}" fill="none" stroke="${hex}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>`)
        .join('')
      parts.push(`<g transform="translate(${ax},0)"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="${avb}" width="${aw}" height="${h}">${apaths}</svg></g>`)
    })
    parts.push('</g>')
    x += w + mr
  })
  return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 ${Math.max(1, x)} ${maxH}" width="${Math.max(1, x)}" height="${maxH}">${parts.join('')}</svg>`
}

async function exportSvg() {
  if (!nameField.value.trim()) return
  const out = await buildExportSvg()
  const blob = new Blob([out.text], { type: 'image/svg+xml;charset=utf-8' })
  downloadBlob(blob, fileBase() + '.svg')
  setStatus('Saved ' + fileBase() + '.svg')
  return out
}

async function rasterize(svgText, width, height, scale) {
  // data: — not blob: — so this stays inside img-src 'self' data: (CSP).
  const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgText)
  const img = new Image()
  img.decoding = 'sync'
  const done = new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = () => reject(new Error('svg image load failed'))
  })
  img.src = url
  await done
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width * scale))
  canvas.height = Math.max(1, Math.round(height * scale))
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  const png = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  return png
}

async function exportPng(scale) {
  if (!nameField.value.trim()) return
  try {
    const out = await buildExportSvg()
    const png = await rasterize(out.text, out.width, out.height, scale)
    if (!png) throw new Error('PNG encode failed')
    downloadBlob(png, `${fileBase()}-${scale}x.png`)
    setStatus(`Saved ${fileBase()}-${scale}x.png`)
  } catch (e) {
    setStatus('Could not export PNG')
    console.error(e)
  }
}

/* Minimal PDF (paths only, no fonts). */
function tokenizePath(d) {
  const tokens = []
  const re = /([MmLlHhVvCcSsQqTtAaZz])|(-?\d*\.?\d+(?:e[+-]?\d+)?)/g
  let m
  while ((m = re.exec(d))) {
    if (m[1]) tokens.push({ t: 'c', v: m[1] })
    else tokens.push({ t: 'n', v: parseFloat(m[2]) })
  }
  return tokens
}

function pathToCommands(d) {
  const tok = tokenizePath(d)
  let i = 0
  const cmds = []
  let cx = 0, cy = 0, sx = 0, sy = 0, lc = '', x1 = 0, y1 = 0
  const num = () => tok[i++] && tok[i - 1].t === 'n' ? tok[i - 1].v : 0
  while (i < tok.length) {
    let c
    if (tok[i].t === 'c') c = tok[i++].v
    else c = (lc === 'm' ? 'l' : lc === 'M' ? 'L' : lc)
    const rel = c === c.toLowerCase()
    const C = c.toUpperCase()
    const take = (n) => Array.from({ length: n }, num)
    if (C === 'M') {
      const [x, y] = take(2)
      cx = rel ? cx + x : x
      cy = rel ? cy + y : y
      sx = cx; sy = cy
      cmds.push(['M', cx, cy])
      lc = c === 'm' ? 'l' : 'L'
      continue
    }
    if (C === 'L') {
      const [x, y] = take(2)
      cx = rel ? cx + x : x
      cy = rel ? cy + y : y
      cmds.push(['L', cx, cy])
    } else if (C === 'H') {
      const x = num()
      cx = rel ? cx + x : x
      cmds.push(['L', cx, cy])
    } else if (C === 'V') {
      const y = num()
      cy = rel ? cy + y : y
      cmds.push(['L', cx, cy])
    } else if (C === 'C') {
      const [a, b, c2, d2, e, f] = take(6)
      const X1 = rel ? cx + a : a, Y1 = rel ? cy + b : b
      const X2 = rel ? cx + c2 : c2, Y2 = rel ? cy + d2 : d2
      cx = rel ? cx + e : e
      cy = rel ? cy + f : f
      cmds.push(['C', X1, Y1, X2, Y2, cx, cy])
      x1 = X2; y1 = Y2
    } else if (C === 'S') {
      const [c2, d2, e, f] = take(4)
      const X2 = rel ? cx + c2 : c2, Y2 = rel ? cy + d2 : d2
      const X1 = lc.toUpperCase() === 'C' || lc.toUpperCase() === 'S' ? 2 * cx - x1 : cx
      const Y1 = lc.toUpperCase() === 'C' || lc.toUpperCase() === 'S' ? 2 * cy - y1 : cy
      cx = rel ? cx + e : e
      cy = rel ? cy + f : f
      cmds.push(['C', X1, Y1, X2, Y2, cx, cy])
      x1 = X2; y1 = Y2
    } else if (C === 'Q') {
      const [a, b, e, f] = take(4)
      const X1 = rel ? cx + a : a, Y1 = rel ? cy + b : b
      cx = rel ? cx + e : e
      cy = rel ? cy + f : f
      cmds.push(['Q', X1, Y1, cx, cy])
      x1 = X1; y1 = Y1
    } else if (C === 'T') {
      const [e, f] = take(2)
      const X1 = lc.toUpperCase() === 'Q' || lc.toUpperCase() === 'T' ? 2 * cx - x1 : cx
      const Y1 = lc.toUpperCase() === 'Q' || lc.toUpperCase() === 'T' ? 2 * cy - y1 : cy
      cx = rel ? cx + e : e
      cy = rel ? cy + f : f
      cmds.push(['Q', X1, Y1, cx, cy])
      x1 = X1; y1 = Y1
    } else if (C === 'Z') {
      cmds.push(['Z'])
      cx = sx; cy = sy
    }
    lc = c
  }
  return cmds
}

function parseTransform(tr) {
  let a = 1, b = 0, c = 0, d = 1, e = 0, f = 0
  if (!tr) return [a, b, c, d, e, f]
  const re = /(translate|scale|matrix)\s*\(([^)]*)\)/g
  let m
  const mul = (A, B) => [
    A[0] * B[0] + A[2] * B[1],
    A[1] * B[0] + A[3] * B[1],
    A[0] * B[2] + A[2] * B[3],
    A[1] * B[2] + A[3] * B[3],
    A[0] * B[4] + A[2] * B[5] + A[4],
    A[1] * B[4] + A[3] * B[5] + A[5],
  ]
  while ((m = re.exec(tr))) {
    const nums = m[2].trim().split(/[\s,]+/).map(Number)
    let M
    if (m[1] === 'translate') M = [1, 0, 0, 1, nums[0] || 0, nums[1] || 0]
    else if (m[1] === 'scale') M = [nums[0], 0, 0, nums.length > 1 ? nums[1] : nums[0], 0, 0]
    else M = nums
    const cur = [a, b, c, d, e, f]
    ;[a, b, c, d, e, f] = mul(cur, M)
  }
  return [a, b, c, d, e, f]
}

function applyMat(M, x, y) {
  return [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]]
}

function hexToRgb01(hex) {
  const h = hex.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
}

function pdfEscape(stream) {
  return stream
}

function buildPdf(width, height, pathEls, mode, hex) {
  // Pad and flip y. Use 1 SVG unit = 1 pt, scale so height is ~40pt if tiny or cap width.
  const pad = 8
  const scale = 72 / Math.max(height, 1) * (height < 80 ? (height / 72) * 1.6 || 1 : 0.6)
  const s = Math.max(0.15, Math.min(2.2, 72 / Math.max(height, 40)))
  const W = width * s + pad * 2
  const H = height * s + pad * 2
  const [r, g, b] = hexToRgb01(hex)
  const col = `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}`
  const chunks = [`q`, `${col} RG`, `${col} rg`, '1 J', '1 j', `${Math.max(0.6, s).toFixed(3)} w`]
  pathEls.forEach((el) => {
    let M = parseTransform(el.getAttribute('transform') || '')
    // walk parent transforms
    let p = el.parentElement
    while (p && p.tagName && p.tagName.toLowerCase() !== 'svg') {
      if (p.getAttribute && p.getAttribute('transform')) {
        const P = parseTransform(p.getAttribute('transform'))
        // parent first
        const mul = (A, B) => [
          A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1],
          A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3],
          A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5],
        ]
        M = mul(P, M)
      }
      p = p.parentElement
    }
    const d = el.getAttribute('d') || ''
    const cmds = pathToCommands(d)
    const ops = []
    cmds.forEach((cmd) => {
      if (cmd[0] === 'M') {
        const [x, y] = applyMat(M, cmd[1], cmd[2])
        ops.push(`${(pad + x * s).toFixed(2)} ${(H - pad - y * s).toFixed(2)} m`)
      } else if (cmd[0] === 'L') {
        const [x, y] = applyMat(M, cmd[1], cmd[2])
        ops.push(`${(pad + x * s).toFixed(2)} ${(H - pad - y * s).toFixed(2)} l`)
      } else if (cmd[0] === 'C') {
        const p1 = applyMat(M, cmd[1], cmd[2])
        const p2 = applyMat(M, cmd[3], cmd[4])
        const p3 = applyMat(M, cmd[5], cmd[6])
        ops.push(
          `${(pad + p1[0] * s).toFixed(2)} ${(H - pad - p1[1] * s).toFixed(2)} ` +
          `${(pad + p2[0] * s).toFixed(2)} ${(H - pad - p2[1] * s).toFixed(2)} ` +
          `${(pad + p3[0] * s).toFixed(2)} ${(H - pad - p3[1] * s).toFixed(2)} c`
        )
      } else if (cmd[0] === 'Q') {
        // raise quadratic to cubic
        const [x0, y0] = ops.length ? [0, 0] : applyMat(M, cmd[3], cmd[4])
        // last point not stored — approximate with c by expanding from current
        const q = applyMat(M, cmd[1], cmd[2])
        const end = applyMat(M, cmd[3], cmd[4])
        ops.push(
          `${(pad + q[0] * s).toFixed(2)} ${(H - pad - q[1] * s).toFixed(2)} ` +
          `${(pad + q[0] * s).toFixed(2)} ${(H - pad - q[1] * s).toFixed(2)} ` +
          `${(pad + end[0] * s).toFixed(2)} ${(H - pad - end[1] * s).toFixed(2)} c`
        )
      } else if (cmd[0] === 'Z') ops.push('h')
    })
    ops.push(mode === 'fill' ? 'f' : 'S')
    chunks.push(ops.join(' '))
  })
  chunks.push('Q')
  const content = chunks.join('\n')
  const objects = []
  const add = (s) => { objects.push(s); return objects.length }
  const o1 = add('<< /Type /Catalog /Pages 2 0 R >>')
  const o2 = add('<< /Type /Pages /Kids [3 0 R] /Count 1 >>')
  const o3 = add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W.toFixed(2)} ${H.toFixed(2)}] /Contents 4 0 R /Resources << >> >>`)
  const stream = content
  const o4 = add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`)
  let body = '%PDF-1.4\n'
  const xref = [0]
  objects.forEach((obj, i) => {
    xref.push(body.length)
    body += `${i + 1} 0 obj\n${obj}\nendobj\n`
  })
  const startxref = body.length
  body += `xref\n0 ${objects.length + 1}\n`
  body += '0000000000 65535 f \n'
  xref.slice(1).forEach((off) => {
    body += String(off).padStart(10, '0') + ' 00000 n \n'
  })
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF\n`
  return new Blob([body], { type: 'application/pdf' })
}

async function exportPdf() {
  if (!nameField.value.trim()) return
  const out = await buildExportSvg()
  const host = document.createElement('div')
  host.style.cssText = 'position:absolute;left:-9999px;top:0'
  host.innerHTML = out.text
  document.body.appendChild(host)
  const svg = host.querySelector('svg')
  const paths = svg ? [...svg.querySelectorAll('path')] : []
  const pdf = buildPdf(out.width, out.height, paths, out.mode, currentInkHex())
  host.remove()
  downloadBlob(pdf, fileBase() + '.pdf')
  setStatus('Saved ' + fileBase() + '.pdf')
}

function embedSnippets(svgText) {
  const inline = svgText.replace(/^<\?xml[^>]*>\s*/, '')
  const img = `<img src="${fileBase()}.svg" alt="Signature of ${escapeAttr(nameField.value.trim() || 'name')}" />`
  return { inline, img }
}

async function copyEmbed() {
  if (!nameField.value.trim()) return
  const out = await buildExportSvg()
  const sn = embedSnippets(out.text)
  const block =
    '<!-- Inline SVG -->\n' + sn.inline + '\n\n<!-- Image tag (after saving the SVG) -->\n' + sn.img
  const pre = document.querySelector('#embed-code')
  if (pre) pre.textContent = block
  try {
    await navigator.clipboard.writeText(block)
    setStatus('Embed code copied')
  } catch (e) {
    setStatus('Copy the embed code below')
  }
}

/* ---------- theme + pictures ---------- */

function syncPictures(dark) {
  document.querySelectorAll('picture').forEach((pic) => {
    const img = pic.querySelector('img')
    if (!img) return
    // Cache both URLs on first run, before the source media is rewritten.
    if (!pic.dataset.lightSrc) {
      pic.dataset.lightSrc = img.getAttribute('src') || ''
      const src = pic.querySelector('source[srcset]')
      if (src) pic.dataset.darkSrc = (src.getAttribute('srcset') || '').split(/\s+/)[0]
    }
    const darkSrc = pic.dataset.darkSrc
    if (!darkSrc) return
    const src = pic.querySelector('source[srcset]')
    if (src) src.media = dark ? 'all' : 'not all'
    img.src = dark ? darkSrc : pic.dataset.lightSrc
  })
}

function syncTheme() {
  const dark = isDark()
  const root = document.documentElement
  const box = document.querySelector('.ilg-case')
  root.setAttribute('data-theme', dark ? 'dark' : 'light')
  root.classList.toggle('dark', dark)
  root.classList.toggle('light', !dark)
  if (box) box.setAttribute('data-theme', dark ? 'dark' : 'light')
  const btn = document.getElementById('theme-toggle')
  if (btn) {
    btn.setAttribute('aria-pressed', String(dark))
    btn.textContent = dark ? 'Light mode' : 'Dark mode'
  }
  syncPictures(dark)
  applyInk()
}

function initTheme() {
  const btn = document.getElementById('theme-toggle')
  const m = window.matchMedia && matchMedia('(prefers-color-scheme: dark)')
  let stored = null
  try { stored = localStorage.getItem(THEME_KEY) } catch (e) { /* ignore */ }
  if (stored === 'dark' || stored === 'light') {
    document.documentElement.setAttribute('data-theme', stored)
    const box = document.querySelector('.ilg-case')
    if (box) box.setAttribute('data-theme', stored)
  }
  syncTheme()
  if (m && m.addEventListener) m.addEventListener('change', () => {
    try { if (!localStorage.getItem(THEME_KEY)) syncTheme() } catch (e) { syncTheme() }
  })
  if (btn) {
    btn.addEventListener('click', () => {
      const n = isDark() ? 'light' : 'dark'
      document.documentElement.setAttribute('data-theme', n)
      const box = document.querySelector('.ilg-case')
      if (box) box.setAttribute('data-theme', n)
      try { localStorage.setItem(THEME_KEY, n) } catch (e) { /* ignore */ }
      syncTheme()
    })
  }
}

/* ---------- wire up ---------- */

function initInk() {
  document.querySelectorAll('.sw[data-ink]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-ink')
      if (key === 'custom') {
        const input = document.querySelector('#ink-custom')
        if (input) input.click()
        return
      }
      inkChoice = key
      applyInk()
    })
  })
  const input = document.querySelector('#ink-custom')
  if (input) {
    input.addEventListener('input', () => {
      customHex = input.value
      inkChoice = 'custom'
      applyInk()
    })
  }
}

function initPicker() {
  const btn = document.querySelector('#font-select')
  const list = document.querySelector('#font-list')
  if (btn) btn.addEventListener('click', (e) => { e.stopPropagation(); togglePicker() })
  if (list) {
    list.addEventListener('click', (e) => {
      const opt = e.target.closest('.opt')
      if (!opt) return
      setFont(opt.getAttribute('data-font'), true)
      closePicker()
    })
  }
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.picker')) closePicker()
  })
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePicker()
  })
}

function initExport() {
  const bind = (sel, fn) => {
    const el = document.querySelector(sel)
    if (el) el.addEventListener('click', fn)
  }
  bind('#export-svg', exportSvg)
  bind('#export-png2', () => exportPng(2))
  bind('#export-png4', () => exportPng(4))
  bind('#export-pdf', exportPdf)
  bind('#export-embed', copyEmbed)
}

function init() {
  initTheme()
  applyInk()
  if (nameField) {
    nameField.addEventListener('input', onInput)
    nameField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.isComposing) {
        e.preventDefault()
        replay()
      }
    })
  }
  if (signBtn) {
    signBtn.addEventListener('click', replay)
    signBtn.disabled = !nameField || !nameField.value.trim()
  }
  initInk()
  initPicker()
  initExport()
  setFont(DEFAULT_FONT, false)
  prevValue = ''
  if (nameField && nameField.value) onInput()
  fillPickerTiles()
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
else init()

// Exposed for verification / Playwright
window.__sig = {
  DEFAULT_FONT,
  FONTS,
  units,
  render,
  replay,
  setFont,
  currentInkHex,
  buildExportSvg,
  fontDef,
  get font() { return currentFont },
  get ink() { return currentInkHex() },
  setTheme(theme) {
    const n = theme === 'dark' ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', n)
    const box = document.querySelector('.ilg-case')
    if (box) box.setAttribute('data-theme', n)
    try { localStorage.setItem(THEME_KEY, n) } catch (e) { /* ignore */ }
    syncTheme()
  },
  setStatus,
}
