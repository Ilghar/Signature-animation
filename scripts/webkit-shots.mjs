#!/usr/bin/env node
/* WebKit screenshots of the signature app for CI.
   Viewports 390x844 and 1280x800, light and dark, via colorScheme
   and via the in-page theme toggle. Waits for fonts, images, and the
   signed name so the artifact is not a blank canvas. */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { webkit } from 'playwright'

const NAME = 'Hāèl Ilghar'
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8080'
const OUT = process.env.OUT_DIR || join(process.cwd(), 'webkit-shots')
const SIZES = [
  { name: '390', width: 390, height: 844 },
  { name: '1280', width: 1280, height: 800 },
]

async function ready(page) {
  await page.waitForFunction(() => document.readyState === 'complete')
  await page.evaluate(() => (document.fonts ? document.fonts.ready : null))
  await page.waitForFunction(() =>
    [...document.images].every((img) => img.complete)
  )
}

async function typeName(page) {
  const field = page.locator('#First-name')
  await field.waitFor({ state: 'visible' })
  await field.fill('')
  await field.fill(NAME)
  await page.waitForFunction(() => {
    const main = document.querySelector('#sig-preview .signature-main')
    if (!main) return false
    const paths = main.querySelectorAll('path')
    if (paths.length < 8) return false
    return [...paths].every((p) => {
      const st = getComputedStyle(p)
      return st.strokeDashoffset === '0px' || st.strokeDashoffset === '0' || !st.strokeDasharray
    })
  }, { timeout: 15000 })
  // Let the 60% fit and any image swap settle.
  await page.waitForTimeout(200)
  const codes = await field.inputValue()
  if (codes !== NAME) throw new Error('Name field mismatch: ' + JSON.stringify(codes))
}

async function shot(page, file) {
  const full = join(OUT, file)
  await page.screenshot({ path: full, fullPage: true, animations: 'disabled' })
  const live = page.locator('#app-frame, section[aria-label="Live function"] .frame, .frame.live').first()
  if (await live.count()) {
    await live.screenshot({
      path: full.replace(/\.png$/, '-live.png'),
      animations: 'disabled',
    })
  }
  return full
}

async function withPage(browser, colorScheme, size, fn) {
  const context = await browser.newContext({
    viewport: { width: size.width, height: size.height },
    colorScheme,
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  await page.goto(BASE + '/index.html', { waitUntil: 'networkidle' })
  await page.evaluate(() => {
    try { localStorage.removeItem('ilg-theme') } catch (e) { /* ignore */ }
  })
  await page.reload({ waitUntil: 'networkidle' })
  await ready(page)
  await typeName(page)
  await fn(page)
  await context.close()
}

async function main() {
  await mkdir(OUT, { recursive: true })
  const browser = await webkit.launch()
  const log = []
  try {
    for (const size of SIZES) {
      await withPage(browser, 'light', size, async (page) => {
        log.push(await shot(page, `webkit-${size.name}-light-scheme.png`))
        await page.locator('#theme-toggle').click()
        await page.waitForTimeout(250)
        await ready(page)
        log.push(await shot(page, `webkit-${size.name}-dark-toggle.png`))
      })
      await withPage(browser, 'dark', size, async (page) => {
        log.push(await shot(page, `webkit-${size.name}-dark-scheme.png`))
        await page.locator('#theme-toggle').click()
        await page.waitForTimeout(250)
        await ready(page)
        log.push(await shot(page, `webkit-${size.name}-light-toggle.png`))
      })
    }
  } finally {
    await browser.close()
  }
  await writeFile(join(OUT, 'manifest.json'), JSON.stringify({ base: BASE, name: NAME, files: log }, null, 2))
  console.log('Wrote', log.length, 'shots under', OUT)
  for (const f of log) console.log(' ', f)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
