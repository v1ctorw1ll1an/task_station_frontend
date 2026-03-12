export async function gravatarUrl(email: string, size = 80): Promise<string> {
  const normalized = email.trim().toLowerCase();
  const buffer = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(normalized),
  );
  const hash = Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=404`;
}
