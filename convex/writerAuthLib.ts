const PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

// Rejection sampling over crypto.getRandomValues so every character is
// chosen uniformly at random with no modulo bias.
function randomChar(chars: string): string {
  const max = 256 - (256 % chars.length);
  let byte: number;
  do {
    byte = crypto.getRandomValues(new Uint8Array(1))[0];
  } while (byte >= max);
  return chars[byte % chars.length];
}

export function generateWriterPassword(length = 10): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += randomChar(PASSWORD_CHARS);
  }
  return result;
}

export function generateSessionToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
