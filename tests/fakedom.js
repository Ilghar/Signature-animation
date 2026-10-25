// Minimal stdlib-only DOM stand-in: loads the real index.html letter bank
// and runs the real script.js in a vm context. No dependencies.
'use strict'
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ROOT = path.join(__dirname, '..')

class ClassList {
  constructor() { this.s = new Set() }
  add(...c) { c.forEach((x) => this.s.add(x)) }
  remove(...c) { c.forEach((x) => this.s.delete(x)) }
  contains(c) { return this.s.has(c) }
  toggle(c, force) { const on = force === undefined ? !this.s.has(c) : !!force; on ? this.s.add(c) : this.s.delete(c); return on }
  toString() { return [...this.s].join(' ') }
}

class El {
  constructor(tag) {
    this.tagName = tag.toUpperCase(); this.children = []; this.style = {}
    this.classList = new ClassList(); this.listeners = {}; this._html = ''
    this.textContent = ''; this.value = ''; this.disabled = false; this.attrs = {}
  }
  get className() { return this.classList.toString() }
  set innerHTML(h) {
    this._html = h; this.children = []
    // every <path> in the markup becomes a child path element
    const n = (h.match(/<path\b/g) || []).length
    for (let i = 0; i < n; i++) this.children.push(new El('path'))
  }
  get innerHTML() { return this._html }
  appendChild(c) { this.children.push(c); c.parentNode = this; return c }
  setAttribute(k, v) { this.attrs[k] = String(v) }
  getAttribute(k) { return k in this.attrs ? this.attrs[k] : null }
  all() { return this.children.flatMap((c) => [c, ...c.all()]) }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null }
  querySelectorAll(sel) {
    const last = sel.trim().split(/\s+/).pop()
    return this.all().filter((e) => (last.endsWith('path') ? e.tagName === 'PATH'
      : last.startsWith('.') ? e.classList.contains(last.slice(1)) : e.tagName === last.toUpperCase()))
  }
  addEventListener(t, f) { (this.listeners[t] = this.listeners[t] || []).push(f) }
  dispatchEvent(ev) {
    ev.target = this; ev.defaultPrevented = false
    ev.preventDefault = () => { ev.defaultPrevented = true }
    ;(this.listeners[ev.type] || []).forEach((f) => f(ev)); return !ev.defaultPrevented
  }
  click() { if (!this.disabled) this.dispatchEvent({ type: 'click' }) }
  focus() {}
}

function bank(html, kind) {
  const re = new RegExp(`<div class="([a-z]) ${kind}">([\\s\\S]*?)</div>`, 'g')
  const out = []; let m
  while ((m = re.exec(html))) { const e = new El('div'); e.classList.add(m[1], kind); e.innerHTML = m[2]; out.push(e) }
  return out
}

function load() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')
  const els = {
    '#First-name': new El('input'), '.signature-main': new El('div'), '.signed-by': new El('div'),
    '.modal': new El('div'), '.sign': new El('button'), '.signature-hint': new El('p'),
  }
  const up = bank(html, 'up'), lo = bank(html, 'lo')
  const document = {
    querySelector: (s) => els[s] || null,
    querySelectorAll: (s) => (s.endsWith('.up') ? up : s.endsWith('.lo') ? lo : []),
    createElement: (t) => new El(t),
    createElementNS: (_ns, t) => new El(t),
  }
  const ctx = { document, setTimeout, clearTimeout, console, window: {} }
  ctx.globalThis = ctx
  vm.createContext(ctx)
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8'), ctx, { filename: 'script.js' })
  const input = els['#First-name'], sign = els['.signature-main'], btn = els['.sign']
  const wait = (ms = 120) => new Promise((r) => setTimeout(r, ms))
  return {
    ctx, html, input, sign, btn, modal: els['.modal'], wait,
    // physical typing: keydown, value changes, input event (browser order)
    async type(text) {
      for (const ch of text) {
        const code = /^[a-z]$/i.test(ch) ? `Key${ch.toUpperCase()}` : ch === ' ' ? 'Space' : ''
        input.dispatchEvent({ type: 'keydown', key: ch, code, isComposing: false })
        input.value += ch
        input.dispatchEvent({ type: 'input', inputType: 'insertText', data: ch })
      }
      await wait()
    },
    async paste(text) { input.value += text; input.dispatchEvent({ type: 'input', inputType: 'insertFromPaste' }); await wait() },
    async fill(text) { input.value = text; input.dispatchEvent({ type: 'input' }); await wait() },
    async enter() { input.dispatchEvent({ type: 'keydown', key: 'Enter', code: 'Enter', isComposing: false }); await wait() },
    async clickSign() { btn.click(); await wait() },
    // visible units drawn in the signature (letters, spaces, fallbacks)
    units() { return sign.children },
    drawnText() {
      return sign.children.map((c) => (c.getAttribute('data-char') ?? (c.style.minWidth ? ' ' : c.classList.toString()))).join('|')
    },
  }
}
module.exports = { load, El }
