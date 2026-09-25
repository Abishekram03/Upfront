export function validateAndSanitizeCSS(css?: string | null): {
  isSafe: boolean
  error?: string
} {
  if (!css || typeof css !== "string" || css.trim().length === 0) {
    return { isSafe: true }
  }

  const dangerousPatterns = [
    { pattern: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, reason: "Script tags are prohibited in CSS." },
    { pattern: /javascript\s*:/gi, reason: "javascript: pseudo-protocols are prohibited." },
    { pattern: /expression\s*\(/gi, reason: "CSS expressions are prohibited." },
    { pattern: /behavior\s*:/gi, reason: "IE behavior properties are prohibited." },
    { pattern: /-moz-binding\s*:/gi, reason: "XBL -moz-binding is prohibited." },
    { pattern: /@import\s+(?:url\(['"]?)?https?:\/\//gi, reason: "External HTTP @import rules are prohibited." },
  ]

  for (const { pattern, reason } of dangerousPatterns) {
    if (pattern.test(css)) {
      return { isSafe: false, error: reason }
    }
  }

  return { isSafe: true }
}
