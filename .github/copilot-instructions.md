# Copilot Instructions for Signature-animation

## Project Overview

Interactive signature animation web application that renders handwritten signatures from text input. Pure frontend: HTML5, CSS3, Vanilla JavaScript (ES6+). Small codebase (~860 lines across 3 files). Deploys to Netlify/Vercel with CSP headers for secure iframe embedding.

## Repository Structure

**Main Files (Root)**:
- `index.html` (299 lines) - HTML + 52 embedded SVG letter templates (a-z uppercase/lowercase)
- `style.css` (497 lines) - All styling, stroke animations, letter positioning, modal UI
- `script.js` (63 lines) - Keyboard event handling and signature animation logic

**Deployment Configs** (pre-configured for Netlify/Vercel/Cloudflare):
- `netlify.toml`, `vercel.json`, `_headers` - CSP headers: `frame-ancestors https://portfolio.adobe.com/* https://*.myportfolio.com/* https://ilghar.studio/*`

**Documentation**: `README.md`, `START_HERE.md`, `SUMMARY.md`, `DEPLOYMENT_GUIDE.md`, `SECURITY.md`, `IFRAME_EMBEDDING_ANALYSIS.md`, `test-iframe.html`

## Technology Stack

Pure HTML5/CSS3/JavaScript (no frameworks, bundlers, or build tools). SVG paths for letter rendering. External resources (HTTPS): Google Fonts (Instrument Sans, JetBrains Mono), Freepik background image. NO CodePen dependencies.

## Build, Test, and Development

**NO BUILD PROCESS** - Intentional design. No build tools, bundlers, or package managers.

**Local Development**:
```bash
python3 -m http.server 8000  # Recommended
# Or: npx http-server -p 8000
# Or: VS Code Live Server extension
```
**CRITICAL**: Use HTTP server, not `file://` protocol (CORS issues with external resources).

**NO AUTOMATED TESTS** - All testing is manual. No test framework, no CI/CD, no GitHub Actions.

**Manual Test Checklist**:
1. Open in browser via local server
2. Type letters - verify all 26 letters work (uppercase/lowercase)
3. Test backspace (clears and rebuilds signature)
4. Test space key (adds spacing between words)
5. Verify modal expands/collapses correctly
6. Test in Chrome, Firefox, Safari
7. For iframe changes: Deploy to Netlify/Vercel, use `test-iframe.html`, check console for CSP violations

**NO LINTERS** - No ESLint, Prettier, Stylelint configs. Code style maintained manually. Validate HTML with W3C if needed.

**Deployment**: Netlify or Vercel (NOT GitHub Pages - blocks iframe embedding with `X-Frame-Options: DENY`). Config files included - just connect repository.

## Architecture

**Letter Animation System**:
1. 52 SVG letters (26 uppercase `.up`, 26 lowercase `.lo`) pre-loaded in hidden `.letter-bank` div
2. On keypress: JS clones SVG from bank → appends to `.signature-main` → sets `stroke-dashoffset: 0`
3. CSS animates drawing: `stroke-dasharray` (exact path length) + `stroke-dashoffset` (full→0) + `transition`
4. Letter spacing: Custom negative margins per letter (`.up.a`, `.lo.a`, etc.) - precisely calibrated

**Input Handling** (`script.js`):
- Letters: Clone SVG, trigger animation (50ms delay)
- Space: Insert 12px spacer div
- Backspace: Clear + rebuild entire signature (no animation delay)
- Modal: Expands from 52px→160px when input has value

## Coding Standards

**HTML**: 2-space indent, semantic elements, SVG paths in `.letter-bank`, precise viewBox values
**CSS**: Class-based selectors, letter styles grouped (`.up.X`, `.lo.X`), 2-space indent, no CSS custom properties
**JavaScript**: ES6+ syntax, `const`/`let` (not `var`), descriptive names, minimal comments

## Common Tasks

**Modifying Letter Shapes**: (1) Edit SVG `<path d="...">` in `index.html` `.letter-bank`, (2) Calculate new path length with `getTotalLength()`, (3) Update `stroke-dasharray` in `style.css`, (4) Adjust margins in `.up.X`/`.lo.X` classes, (5) Test visually

**Animation Timing**: Change `transition: 1s ease` in `.signature-main svg path` (global speed) or `setTimeout(..., 50)` in `script.js` line 53 (letter delay)

**iframe Domains**: Edit `netlify.toml`, `vercel.json`, `_headers` → add to `frame-ancestors` → redeploy → test with `test-iframe.html`. **WARNING**: Don't confuse with separate Netlify deployment project.

## Critical Files - DO NOT MODIFY Without Deep Understanding

- SVG viewBox values (`index.html`) - Precisely calibrated per letter
- `stroke-dasharray` values (`style.css`) - Must match exact SVG path lengths
- Letter detection logic (`script.js` lines 37-62) - Alphabet iteration and case handling
- Deployment configs (`netlify.toml`, `vercel.json`, `_headers`) - Security and iframe embedding

## Security & CSP

CSP restricts iframe embedding to: `portfolio.adobe.com/*`, `*.myportfolio.com/*`, `ilghar.studio/*`. Prevents clickjacking. Configured via HTTP headers (not meta tags). All external resources: HTTPS only.

## Browser Support

Modern browsers (Chrome/Edge/Firefox/Safari, last 2 versions). NO IE11. Requires: SVG rendering, CSS stroke animations, ES6 (const/let/arrow functions).

## Troubleshooting

- **Animation broken**: Check console errors, verify `stroke-dasharray` matches path length
- **Letters missing**: Inspect `.letter-bank` in DevTools, check event listeners
- **iframe blocked**: Deploy to Netlify/Vercel (NOT GitHub Pages), verify CSP headers in Network tab
- **Resources fail**: Use HTTP server (not `file://`), check CORS errors

## Agent Instructions

1. **Visual application** - ALWAYS test in browser via HTTP server
2. **NO automated tests** - Manual testing required
3. **NO build system** - Don't add bundlers/transpilers
4. **Keep simple** - Simplicity is a feature
5. **Preserve aesthetics** - Timing and spacing are art
6. **Don't break existing features** - Working app with users
7. **Security first** - Understand CSP implications
8. **Deployment**: Netlify/Vercel, NOT GitHub Pages
9. **Trust these instructions** - Only explore if info incomplete/incorrect
