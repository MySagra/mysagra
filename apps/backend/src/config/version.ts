/**
 * Application version.
 *
 * Injected at Docker build time from the release git tag
 * (see docker/images/mysagra-backend/Dockerfile + .github/workflows/publish.yml).
 * Falls back to a dev placeholder for local development.
 */
export const APP_VERSION = process.env.APP_VERSION || "0.0.0-dev";
