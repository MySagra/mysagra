/**
 * Structured result for Server Actions that need to communicate errors
 * back to Client Components without losing the error message in production.
 *
 * In Next.js production, errors thrown from Server Actions are stripped of
 * their message and replaced with a digest. Using a return-value pattern
 * ensures the error message always reaches the client.
 */
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/** Helper to extract the error message from any caught value */
export function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message || fallback;
  if (typeof error === "string") return error;
  return fallback;
}
