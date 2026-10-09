/**
 * Open-redirect protection for `?next=` parameters.
 * Only same-site, absolute-path targets are allowed; anything else falls back.
 */
export function safeNextPath(next: unknown, fallback = "/account"): string {
  if (typeof next !== "string") return fallback;
  const value = next.trim();

  if (value.length === 0 || value.length > 512) return fallback;
  if (!value.startsWith("/")) return fallback; // relative or absolute URL
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback; // protocol-relative
  // Control characters, backslashes and encoded slashes are used to smuggle hosts past naive checks.
  if (/[\u0000-\u001f\u007f\\]/.test(value)) return fallback;
  if (/%2f|%5c|%00|%0d|%0a/i.test(value)) return fallback;

  try {
    // Resolving against a dummy origin must keep us on that origin.
    const base = "http://nexa.invalid";
    const resolved = new URL(value, base);
    if (resolved.origin !== base) return fallback;
  } catch {
    return fallback;
  }
  return value;
}

export function loginUrl(nextPath: string): string {
  return `/login?next=${encodeURIComponent(safeNextPath(nextPath, "/"))}`;
}
