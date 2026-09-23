import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

const srcDir = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
    plugins: [tsconfigPaths()],
    resolve: {
        // Ensure the `@/` alias also resolves for files outside `src/` (e.g. test/).
        alias: [{ find: /^@\/(.*)$/, replacement: `${srcDir}/$1` }],
    },
    test: {
        globals: true,
        environment: "node",
        include: ["test/**/*.{test,spec}.ts"],
        // Env vars required by src/config/env.ts at import time.
        env: {
            NODE_ENV: "test",
            DATABASE_URL: "mysql://user:pass@localhost:3306/test",
            PEPPER: "test-pepper",
            REDIS_URL: "redis://localhost:6379",
            ALLOWED_ORIGINS: "http://localhost:3000",
            FILE_BASE_PATH: ".",
        },
        coverage: {
            provider: "v8",
            reporter: ["text", "html"],
            include: ["src/core/**/*.ts"],
        },
    },
});
