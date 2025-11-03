# Signature Animation

An interactive signature animation tool that renders handwritten signatures from text input.

## Live Demo

https://ilghar.github.io/Signature-animation/

## Embedding in iFrames

This site is designed to be embeddable in iframes on trusted sites. The configuration restricts embedding to `https://portfolio.adobe.com/*` and `https://ilghar.studio/*` to prevent clickjacking attacks.

### Usage Example

```html
<iframe
  src="https://ilghar.github.io/Signature-animation/"
  title="Signature animation"
  style="width:100%; height:540px; border:0; overflow:hidden;"
  loading="lazy"
  sandbox="allow-scripts allow-same-origin">
</iframe>
```

### Important Notes on GitHub Pages Limitations

**GitHub Pages does not support custom HTTP headers.** This means:

1. You cannot add `_headers` files (that's a Netlify-specific feature)
2. You cannot configure `X-Frame-Options` or HTTP-level `Content-Security-Policy` headers
3. GitHub Pages sets its own default headers that cannot be modified

**What we've done:**
- Added HTTP headers via deployment configs to restrict iframe embedding to trusted domains (`https://portfolio.adobe.com/*` and `https://ilghar.studio/*`)
- This prevents clickjacking attacks while allowing legitimate embedding on authorized sites
- If you need to add additional domains, you can update the CSP header in the deployment config files (see SECURITY.md)

**If iframe embedding doesn't work on certain platforms:**

This is likely due to GitHub Pages' server-level security headers. Possible solutions:

1. **Use a different hosting platform** that allows custom headers:
   - Netlify (with `_headers` or `netlify.toml` configuration)
   - Vercel (with `vercel.json` configuration)
   - Cloudflare Pages (with `_headers` file)
   - AWS S3 + CloudFront (with custom header configuration)

2. **GitHub Premium with custom domain**: While GitHub Premium offers some benefits, it still doesn't allow custom HTTP header configuration on GitHub Pages

3. **Alternative embedding methods**: Instead of iframe, consider:
   - Opening in a new window/tab
   - Using a direct link
   - Embedding as a web component if the platform supports it

## External Resources

This project uses the following external resources (all via HTTPS):

- **Google Fonts**: 
  - fonts.googleapis.com
  - fonts.gstatic.com
  - Fonts used: Instrument Sans, JetBrains Mono

- **Background Image**:
  - img.freepik.com (abstract blurred sky)

All external resources use HTTPS and should work properly when embedded, assuming the parent frame allows loading external content.

## Analysis for CodePen Origins

The signature animation SVG paths are embedded directly in the HTML file and are not loaded from CodePen or any encrypted cloud source. The animation is controlled by:
- CSS stroke-dasharray and stroke-dashoffset properties
- JavaScript that manipulates these properties based on user input
- All code is present in this repository and fully accessible

There are **no blocking mechanisms from CodePen** or similar platforms in this code.

## Files Structure

- `index.html` - Main HTML file with embedded SVG letter paths
- `style.css` - Styling including stroke animations and layout
- `script.js` - JavaScript for handling user input and animating signatures

## How It Works

1. User types their name in the input field
2. JavaScript captures each keystroke
3. For each letter, the corresponding SVG path is added to the signature area
4. CSS animations draw the stroke to create a handwriting effect
5. The modal expands to show the completed signature

## Browser Compatibility

Works in all modern browsers that support:
- CSS stroke-dasharray/stroke-dashoffset animations
- ES6 JavaScript
- SVG rendering
