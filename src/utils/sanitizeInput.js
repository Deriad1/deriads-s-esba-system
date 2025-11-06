import DOMPurify from 'dompurify';

/**
 * Secure input sanitization using DOMPurify
 *
 * SECURITY: This uses DOMPurify, an industry-standard XSS prevention library
 * that uses a whitelist approach (only allows known-safe content) rather than
 * a blacklist approach (blocking known-bad patterns, which is easily bypassed).
 *
 * DOMPurify is maintained by security experts and is used by major companies
 * including Google, Microsoft, and Facebook.
 *
 * @param {any} input - The input to sanitize
 * @returns {any} - The sanitized input
 */
export const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    // Configure DOMPurify for strict sanitization
    const config = {
      ALLOWED_TAGS: [], // No HTML tags allowed - strip all HTML
      ALLOWED_ATTR: [], // No attributes allowed
      KEEP_CONTENT: true, // Keep text content, remove tags
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
      RETURN_DOM_IMPORT: false
    };

    // Sanitize using DOMPurify with strict configuration
    let sanitized = DOMPurify.sanitize(input, config);

    // Additional cleanup for specific dangerous patterns
    // (DOMPurify already handles most of this, but being extra safe)
    sanitized = sanitized
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/data:text\/html/gi, '');

    // Trim whitespace
    sanitized = sanitized.trim();

    return sanitized;
  }

  if (Array.isArray(input)) {
    return input.map(item => sanitizeInput(item));
  }

  if (typeof input === 'object' && input !== null) {
    const sanitizedObj = {};
    for (const key in input) {
      // Use Object.prototype.hasOwnProperty.call to avoid prototype pollution
      if (Object.prototype.hasOwnProperty.call(input, key)) {
        // Sanitize both keys and values for extra security
        const sanitizedKey = typeof key === 'string' ? DOMPurify.sanitize(key, { ALLOWED_TAGS: [], KEEP_CONTENT: true }) : key;
        sanitizedObj[sanitizedKey] = sanitizeInput(input[key]);
      }
    }
    return sanitizedObj;
  }

  return input;
};

/**
 * Sanitize HTML content while allowing safe HTML tags
 * Use this when you need to preserve some HTML formatting (e.g., rich text editors)
 *
 * @param {string} html - The HTML content to sanitize
 * @returns {string} - The sanitized HTML
 */
export const sanitizeHTML = (html) => {
  if (typeof html !== 'string') {
    return html;
  }

  // Configure DOMPurify to allow safe HTML tags
  const config = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'title'],
    ALLOW_DATA_ATTR: false, // No data- attributes
    ADD_TAGS: [], // Don't add any custom tags
    ADD_ATTR: [] // Don't add any custom attributes
  };

  return DOMPurify.sanitize(html, config);
};

/**
 * Sanitize a URL to prevent javascript: and data: URLs
 *
 * @param {string} url - The URL to sanitize
 * @returns {string} - The sanitized URL or empty string if dangerous
 */
export const sanitizeURL = (url) => {
  if (typeof url !== 'string') {
    return '';
  }

  const trimmedURL = url.trim().toLowerCase();

  // Block dangerous URL schemes
  const dangerousSchemes = ['javascript:', 'data:', 'vbscript:', 'file:'];
  for (const scheme of dangerousSchemes) {
    if (trimmedURL.startsWith(scheme)) {
      console.warn(`Blocked dangerous URL scheme: ${scheme}`);
      return '';
    }
  }

  // Allow only http, https, and mailto
  const allowedSchemes = ['http://', 'https://', 'mailto:'];
  const isRelative = !trimmedURL.includes('://') && !trimmedURL.startsWith('//');

  if (!isRelative) {
    const isAllowed = allowedSchemes.some(scheme => trimmedURL.startsWith(scheme));
    if (!isAllowed) {
      console.warn(`Blocked URL with non-whitelisted scheme: ${url}`);
      return '';
    }
  }

  return DOMPurify.sanitize(url, { ALLOWED_TAGS: [], KEEP_CONTENT: true });
};

export default sanitizeInput;
