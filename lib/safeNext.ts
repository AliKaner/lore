// Where to send someone after they sign in. Only a path on this site counts:
// "//evil.com" or "https://…" would turn the sign-in page into an open
// redirect.
export function safeNext(value: string | null | undefined, fallback = "/yazilarim") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  if (value === "/" || value.startsWith("/giris")) return fallback;
  return value;
}
