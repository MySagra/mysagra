import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      "no-restricted-syntax": [
        "warn",
        {
          selector: "JSXElement > Literal[value=/[a-zA-Z]{2,}/]",
          message: "Hardcoded text in JSX. Use i18n translations instead.",
        },
      ],
    },
  },
]);

export default eslintConfig;
