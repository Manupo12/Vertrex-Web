export function sanitizeHtml(html: string): string {
  let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  clean = clean.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  clean = clean.replace(/javascript:/gi, "");
  clean = clean.replace(/<\/?(?:iframe|object|embed|form|input|button|select|textarea)[^>]*>/gi, "");
  return clean;
}
