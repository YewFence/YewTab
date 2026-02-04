import path from "node:path";
import { fileURLToPath } from "node:url";

import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: ["dist", "node_modules", "**/*.timestamp-*.mjs"],
  },
  ...compat.config({
    env: {
      browser: true,
      es2022: true,
    },
    parser: "@typescript-eslint/parser",
    parserOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      ecmaFeatures: {
        jsx: true,
      },
    },
    globals: {
      chrome: "readonly",
    },
    plugins: ["@typescript-eslint", "react", "react-hooks"],
    extends: [
      "eslint:recommended",
      "plugin:@typescript-eslint/recommended",
      "plugin:react/recommended",
      "plugin:react-hooks/recommended",
    ],
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
      "react/prop-types": "off",
    },
    overrides: [
      {
        files: [
          "vite.config.*",
          "**/*.config.*",
          "src/manifest.ts",
          "src/background/**/*.{ts,tsx}",
        ],
        env: {
          node: true,
        },
      },
    ],
  }),
];
