export function sanitizeHtml(html: string): string {
  let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  clean = clean.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  clean = clean.replace(/javascript:/gi, "");
  clean = clean.replace(/<\/?(?:iframe|object|embed|form|input|button|select|textarea)[^>]*>/gi, "");
  clean = clean.replace(/<link\b[^>]*>/gi, "");
  clean = clean.replace(/<meta\b[^>]*>/gi, "");
  return clean;
}

export function sanitizeLegalTemplate(html: string): string {
  const dangerous = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,
    /javascript:/gi,
    /data:\s*text\/html/gi,
    /<embed\b[^>]*>/gi,
    /<object\b[^>]*>/gi,
  ];
  let clean = html;
  for (const pattern of dangerous) {
    clean = clean.replace(pattern, "");
  }
  return clean;
}

export function validateLegalTemplate(html: string): boolean {
  const clean = sanitizeLegalTemplate(html);
  return clean === html;
}
