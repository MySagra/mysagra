// Single source for the session-JWT signing key, shared by lib/auth.ts and the proxy middleware.
// Fails fast when AUTH_SECRET is missing or too short: an unset secret would otherwise be encoded
// as an empty HMAC key, letting anyone forge a valid session JWT (including role: "admin").
// Kept free of next/headers imports so it is safe to use from the middleware (edge) runtime.
export function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET is missing or shorter than 32 characters");
  }
  return new TextEncoder().encode(secret);
}
