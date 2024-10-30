// @ts-check

import * as typescriptEslintParser from "@typescript-eslint/parser";
import * as importPlugin from "eslint-plugin-import";
import * as tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["**/tsup.config.bundled_*"],
  },
  { files: ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"] },
  tseslint.configs.base,
  {
    plugins: {
      import: importPlugin,
    },
    languageOptions: {
      parser: typescriptEslintParser,
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",

      eqeqeq: ["error", "always", { null: "never" }],

      "import/no-default-export": "off",

      // "import/consistent-type-specifier-style": ["error", "prefer-top-level"],
      "import/no-duplicates": ["error"],
      "import/order": [
        "error",
        {
          groups: [[
            "internal",
            "builtin",
            "external",
            "parent",
            "sibling",
            "index",
          ]],
        },
      ],
      "import/no-unresolved": "off",
      "import/no-named-as-default": "off", // this used to be an error but the plugin isnt updated for 9
      "no-console": "error",
    },
    settings: {
      "import/parsers": {
        "@typescript-eslint/parser": [".ts", ".tsx", ".mts", ".cts"],
      },
      "import/resolver": {
        typescript: true,
      },
    },
  },
  //
  // test files can have console.log
  //   as can examples-extra
  //
  {
    files: [
      "**/*.test.ts",
      "**/test/*",
      "examples-extra/**/*",
      "packages/e2e.sandbox.*/**/*",
    ],
    rules: {
      "no-console": "off",
    },
  },
  //
  // Flat out ignore these globs
  //
  {
    // NOTE these are globs from root
    ignores: [
      "**/build/",
      "**/dist",
      "**/node_modules/",
      "**/build/",
      "packages/monorepo.*/**",
      ".lintstagedrc.mjs",
      "tests/",
    ],
  },
);
