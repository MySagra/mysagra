/**
 * Application version.
 *
 * Injected at Docker build time from the release git tag as a
 * `NEXT_PUBLIC_APP_VERSION` build arg (see
 * docker/images/mysagra-frontend/Dockerfile + .github/workflows/publish.yml).
 * Next.js inlines `NEXT_PUBLIC_*` values into the bundle at build time.
 * Falls back to a dev placeholder for local development.
 */
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "0.0.0-dev";
