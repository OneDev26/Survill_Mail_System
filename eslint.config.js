import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores([
    "dist",
    "test-results",
    "test-results-live",
    "playwright-report",
  ]),
  {
    files: ["**/*.{js,jsx}"],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    files: ["src/pages/**/*.jsx", "src/components/**/*.jsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "**/api/backend",
                "**/api/backend.js",
                "**/api/client",
                "**/api/client.js",
              ],
              message:
                "Dispatch a domain thunk instead of calling the HTTP layer from a component.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["tests/**/*.mjs", "scripts/**/*.mjs", "*.config.mjs"],
    extends: [js.configs.recommended],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
]);
