// @ts-check

import {
  alphabeticalDependencies,
  alphabeticalScripts,
  createRuleFactory,
  fileContents,
  packageEntry,
  packageOrder,
  packageScript,
  requireDependency,
  standardTsconfig,
} from "@monorepolint/rules";
import * as child_process from "node:child_process";
import path from "node:path";

const LATEST_TYPESCRIPT_DEP = "~5.6.3";

const DELETE_SCRIPT_ENTRY = { options: [undefined], fixValue: undefined };

const nonStandardPackages = [
  "@osdkkit/monorepo.*", // internal monorepo packages
];

// Packages that should be private
const privatePackages = [
  "@osdkkit/monorepo.*",
];

/**
 * @type {import("@monorepolint/rules").RuleFactoryFn<{entries: string[]}>}
 */
const noPackageEntry = createRuleFactory({
  name: "noPackageEntry",
  check: async (context, options) => {
    const packageJson = context.getPackageJson();
    for (const entry of options.entries) {
      if (packageJson[entry]) {
        context.addError({
          message: `${entry} field is not allowed`,
          longMessage: `${entry} field is not allowed`,
          file: context.getPackageJsonPath(),
        });
      }
    }
  },
  validateOptions: (options) => {
    return typeof options === "object" && "entries" in options
      && Array.isArray(options.entries);
  },
});

const cache = new Map();

/**
 * @param {string} contents
 */
const formattedGeneratorHelper = (contents, ext) => async (context) => {
  if (cache.has(contents)) {
    return cache.get(contents);
  }
  const result = child_process.spawnSync(
    `pnpm exec dprint fmt --stdin foo.${ext}`,
    {
      input: contents,
      encoding: "utf8",
      shell: true,
    },
  );

  if (result.error) {
    throw result.error;
  }

  cache.set(contents, result.stdout);

  return result.stdout;
};

/**
 * @param {Omit<import("@monorepolint/config").RuleEntry<>,"options" | "id">} shared
 * @param {{
 *  customTsconfigExcludes?: string[],
 *  skipTsconfigReferences?: boolean,
 * }} options
 * @returns {import("@monorepolint/config").RuleModule[]}
 */
function standardPackageRules(shared, options) {
  return [
    standardTsconfig({
      ...shared,

      options: {
        file: "tsconfig.json",

        excludedReferences: ["**/*"],
        template: {
          extends: `@osdkkit/monorepo.tsconfig`,

          compilerOptions: {
            rootDir: "src",
            outDir: "build/esm",
          },
          include: ["./src/**/*"],
        },
      },
    }),

    standardTsconfig({
      ...shared,

      options: {
        file: "test/tsconfig.json",

        excludedReferences: ["**/*"],
        additionalReferences: ["../"],
        template: {
          extends: `@osdkkit/monorepo.tsconfig/tsconfig.test.json`,

          compilerOptions: {
            rootDir: ".",
          },
          include: ["**/*"],
        },
      },
    }),

    requireDependency({
      ...shared,
      options: {
        devDependencies: {
          typescript: LATEST_TYPESCRIPT_DEP,
          "@osdkkit/monorepo.tsconfig": "workspace:~",
        },
      },
    }),
    packageScript({
      ...shared,
      options: {
        scripts: {
          clean: "rm -rf lib dist types build tsconfig.tsbuildinfo",
          "check-spelling": "cspell --quiet .",
          lint: "eslint . && dprint check  --config $(find-up dprint.json)",
          "fix-lint":
            "eslint . --fix && dprint fmt --config $(find-up dprint.json)",
          "transpile": "tsc-absolute",
        },
      },
    }),
    packageEntry({
      ...shared,
      options: {
        entries: {
          exports: {
            ".": {
              "import": "./build/esm/index.js",
              "default": "./build/esm/index.js",
            },
          },
          publishConfig: {
            "access": "public",
          },
          files: [
            "build/cjs",
            "build/esm",
            "build/browser",
            "CHANGELOG.md",
            "package.json",
          ],

          module: "./build/esm/index.js",
          types: `./build/esm/index.d.ts`,
          type: "module",
        },
      },
    }),
    fileContents({
      ...shared,
      options: {
        file: "vitest.config.mts",
        generator: formattedGeneratorHelper(
          `
          import { configDefaults, defineConfig } from "vitest/config";

          export default defineConfig({
            test: {
              pool: "forks",
              exclude: [...configDefaults.exclude, "**/build/**/*"],
              environment: "happy-dom",
              typecheck: {
                enabled: true,
                tsconfig: "test/tsconfig.json",
              },
            },
          });
     
          `,
          "js",
        ),
      },
    }),
  ];
}

/**
 * @type {import("@monorepolint/config").Config}
 */
export default {
  rules: [
    ...standardPackageRules({
      excludePackages: [
        ...nonStandardPackages,
      ],
    }, {}),

    packageEntry({
      includePackages: privatePackages,
      options: {
        entries: {
          private: true,
        },
      },
    }),

    noPackageEntry({
      excludePackages: privatePackages,
      options: {
        entries: ["private"],
      },
    }),

    alphabeticalDependencies({ includeWorkspaceRoot: true }),
    alphabeticalScripts({ includeWorkspaceRoot: true }),

    packageOrder({
      options: {
        order: [
          "name",
          "private",
          "version",
          "description",
          "access",
          "author",
          "license",
          "repository",
          "exports",
          "file",
          "scripts",
          "dependencies",
          "peerDependencies",
          "peerDependenciesMeta",
          "devDependencies",
          "publishConfig",
          "imports",
          "keywords",
          "bin",
          "files",
          // since these are just for fallback support we can drop to bottom
          "main",
          "module",
          "types",
        ],
      },
    }),
  ],
};
