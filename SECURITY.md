# Security Documentation

## Content Security Policy (CSP) for iframe Embedding

### Current Configuration

This project is configured to allow iframe embedding **only** from trusted domains to prevent clickjacking attacks.

**Allowed domains:**
- `https://portfolio.adobe.com/*` - Adobe Portfolio
- `https://*.myportfolio.com/*` - Adobe Portfolio custom domains (e.g., username.myportfolio.com)
- `https://ilghar.studio/*` - Custom domain

### Security Rationale

**Why not `frame-ancestors *` (allow all)?**

Using `frame-ancestors *` allows **any website** to embed this signature animation in an iframe, which exposes users to several security risks:

1. **Reputational/Phishing Misuse**: While this application does not have sensitive interactive elements that could be hijacked via clickjacking, malicious sites could still embed the tool to mislead users, impersonate trusted services, or misrepresent the tool's origin.

2. **Context Confusion**: Users might not realize they're interacting with embedded content on an untrusted site.

### Adding Additional Domains

If you need to allow embedding from additional domains, you can add them to the CSP configuration:

#### For Netlify:
Edit `netlify.toml`:
```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "frame-ancestors https://portfolio.adobe.com/* https://*.myportfolio.com/* https://ilghar.studio/* https://www.yourname.com"
```

Or edit `_headers`:
```
/*
  Content-Security-Policy: frame-ancestors https://portfolio.adobe.com/* https://*.myportfolio.com/* https://ilghar.studio/* https://www.yourname.com
```

#### For Vercel:
Edit `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "frame-ancestors https://portfolio.adobe.com/* https://*.myportfolio.com/* https://ilghar.studio/* https://www.yourname.com"
        }
      ]
    }
  ]
}
```

### For Other Use Cases

If you need to embed this on other platforms:

1. **Identify the parent domain**: Determine the exact domain(s) that will embed this content
2. **Add to allowlist**: Update the CSP header to include those specific domains
3. **Use HTTPS**: Always use `https://` protocol in the CSP directive
4. **Avoid wildcards when possible**: Be as specific as you can with domains

Example for multiple specific domains:
```
frame-ancestors https://portfolio.adobe.com/* https://*.myportfolio.com/* https://ilghar.studio/* https://example.com https://www.example.com
```

### Testing Your Configuration

After deploying with updated CSP headers:

1. **Test allowed embedding**: Verify your iframe works on Adobe Portfolio
2. **Test blocked embedding**: Try embedding on an unauthorized domain - it should fail with a CSP violation error in the browser console
3. **Check browser console**: Look for messages like `Refused to frame 'https://...' because an ancestor violates the following Content Security Policy directive: "frame-ancestors ..."`

### Security Best Practices

- **Use HTTPS**: Always specify `https://` in frame-ancestors
- **Be specific**: List only the domains you trust
- **Regular review**: Periodically review and update your allowed domains
- **Test thoroughly**: Verify both allowed and blocked scenarios

### Additional Resources

- [MDN: CSP frame-ancestors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/frame-ancestors)
- [OWASP: Clickjacking Defense](https://cheatsheetseries.owasp.org/cheatsheets/Clickjacking_Defense_Cheat_Sheet.html)
- [Adobe Portfolio: Custom Domains](https://help.myportfolio.com/hc/en-us/articles/209448927)

## Reporting Security Issues

If you discover a security vulnerability, please report it by:
1. Opening a GitHub Security Advisory
2. Or emailing the repository owner

Do not create public issues for security vulnerabilities.
