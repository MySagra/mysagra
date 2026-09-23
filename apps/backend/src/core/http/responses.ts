import type { ResponseSpec } from "./route";

/** Responses shared by every authenticated + rate-limited endpoint. */
export const AUTH_RESPONSES: Partial<Record<number, ResponseSpec>> = {
    401: { description: "Unauthorized - Invalid or missing authentication" },
    403: { description: "Forbidden - Insufficient permissions" },
    429: { description: "Too Many Requests - Rate limit exceeded" },
};
