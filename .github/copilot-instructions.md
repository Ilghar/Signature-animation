# Copilot Instructions for Signature-animation

## Project Overview

This repository contains a signature animation web application that creates animated handwriting-style signatures from user input. It's a pure frontend application built with HTML, CSS, and vanilla JavaScript.

## Project Structure

- `index.html` - Main HTML file with the application structure and SVG letter templates
- `style.css` - Styling including letter positioning, animation timing, and modal UI
- `script.js` - JavaScript logic for handling user input and animating signatures

## Technology Stack

- Pure HTML5
- CSS3 (animations using stroke-dasharray and stroke-dashoffset)
- Vanilla JavaScript (no frameworks or build tools)
- SVG for letter path animations

## Development Workflow

### Running the Application

This is a static web application with no build process required:
1. Simply open `index.html` in a web browser
2. Or use a local web server for testing (e.g., `python -m http.server` or VS Code Live Server extension)

### No Build System

This project intentionally uses no build tools, bundlers, or package managers. All code is vanilla JavaScript and can run directly in the browser.

### No Tests

Currently, this project has no automated tests. Testing is done manually by:
1. Opening the application in a browser
2. Typing text in the input field
3. Verifying that the signature animation appears correctly
4. Testing with uppercase, lowercase, and mixed case letters

## Coding Standards

### HTML
- Use semantic HTML5 elements
- Maintain proper indentation (2 spaces)
- Keep SVG paths organized in the `.letter-bank` section

### CSS
- Use class-based selectors
- Keep letter-specific styles organized by letter class (`.up.a`, `.lo.a`, etc.)
- Maintain consistent spacing and indentation
- CSS custom properties are not used; use inline values

### JavaScript
- Use modern ES6+ syntax
- Keep code simple and readable
- Use `const` and `let` (avoid `var`)
- Use descriptive variable names
- Add comments only for complex logic

## Key Features to Understand

### Letter Animation System
- Each letter (a-z) has two SVG variants: uppercase (`.up`) and lowercase (`.lo`)
- Letters are stored in a hidden `.letter-bank` div
- When user types, JavaScript clones the appropriate SVG and appends it to `.signature-main`
- Animation uses CSS `stroke-dasharray` and `stroke-dashoffset` for drawing effect
- Each letter has custom margins in CSS to ensure proper letter spacing

### Input Handling
- Backspace support: Clears and rebuilds the entire signature
- Space support: Adds spacing between words
- Modal shows/hides based on input presence

## Common Tasks

### Adding a New Letter Style
1. Add SVG path to both `.letter-bank .up` and `.letter-bank .lo` sections in `index.html`
2. Add corresponding CSS margins in `style.css` (`.up.X` and `.lo.X`)
3. Add stroke-dasharray values for animation in `style.css`

### Adjusting Letter Spacing
- Modify negative margins in the `.up.X` or `.lo.X` CSS classes in `style.css`

### Changing Animation Timing
- Adjust transition duration in `.signature-main svg path` selector
- Modify timeout values in `script.js` (currently 50ms)

## Files You Should Not Modify Without Understanding Impact

- SVG viewBox values in `index.html` - These are precisely calibrated for each letter
- `stroke-dasharray` values in `style.css` - These match the exact path lengths
- The letter detection logic in `script.js` - This handles alphabet iteration

## External Dependencies

- Google Fonts: "Instrument Sans" and "JetBrains Mono"
- Background image from Freepik

## Browser Compatibility

- Modern browsers with SVG and CSS animation support
- No polyfills or transpilation needed
- No IE11 support required

## Contributing Guidelines

When making changes:
1. Test in multiple browsers (Chrome, Firefox, Safari)
2. Verify all 26 letters work correctly (both uppercase and lowercase)
3. Check that backspace and space keys function properly
4. Ensure modal animations are smooth
5. Verify signature animations render correctly

## Notes for Copilot Coding Agent

- This is a visual application - changes should be tested by viewing in a browser
- There are no unit tests to run
- There is no linting or formatting configured
- Keep the code simple and dependency-free
- Preserve the artistic design and animation timing
- When modifying SVG paths, maintain the handwriting aesthetic
