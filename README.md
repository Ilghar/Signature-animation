# Signature Animation

An interactive signature animation tool that renders handwritten signatures from text input.

## How it works

Each letter a–z (upper and lower case) is a hand-drawn SVG path in the hidden letter bank in `index.html`. `script.js` re-renders the signature from the field's value on every `input` event, so typing, paste, autofill and mobile input all draw; only newly added characters animate (via `stroke-dashoffset`). **Sign** (or Enter) redraws the whole name, and stays disabled while the field is empty.

Accented letters are split into base letter plus mark: the base glyph is drawn and a separate accent stroke is added on top (macron, grave, acute, circumflex, diaeresis, tilde), so names like "Hāèl" sign in full. Characters without a drawn glyph (digits, ß, other scripts) are shown as plain text in Jost rather than dropped.

The page uses the ilghar.studio palette in light and dark mode. It follows the system setting, and the toggle in the corner switches it manually (the choice is remembered).

## Run locally

```
python3 -m http.server 8000   # then open http://localhost:8000
```

## Tests

```
node --test tests/
```

23 tests as of commit 0bc66c4 (19 as of 88be5c2). Uses only Node's built-in test runner (Node 18+); there are no dependencies. The tests run the real `script.js` against the real letter bank, covering typing, paste, fill, Enter, the Sign button, accents and fallbacks.

## Live demo

https://ilghar.github.io/Signature-animation/

## Embedding

The page is meant to be shown in an iframe on ilghar.studio and Adobe Portfolio:

```html
<iframe
  src="https://ilghar.github.io/Signature-animation/"
  title="Signature animation"
  style="width:100%; height:540px; border:0;"
  loading="lazy"
  sandbox="allow-scripts allow-same-origin">
</iframe>
```

GitHub Pages can't send custom HTTP headers. `index.html` carries a `frame-ancestors` CSP in a `<meta>` tag, but browsers ignore `frame-ancestors` when it comes from a meta tag, so it doesn't actually restrict embedding. Real clickjacking protection needs a host that can send the header.

## What it loads

- Jost and Nunito Sans from Google Fonts (fonts.googleapis.com, fonts.gstatic.com), over HTTPS.
- Nothing else: the letter paths are inline SVG in `index.html`, and there is no tracking and no third-party script.

## Files

- `index.html`: page markup and the hidden letter bank
- `style.css`: palette, light/dark themes and the stroke animation
- `script.js`: input handling and drawing
- `tests/`: Node test runner tests against a small fake DOM
- `docs/`: deployment, embedding, security and change notes

Credit: ilghar.studio
