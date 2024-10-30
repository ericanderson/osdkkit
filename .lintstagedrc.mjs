// @ts-check

import micromatch from "micromatch";

const CSPELL_CMD = "cspell --quiet --no-must-find-files";

/**
 * @type {import("lint-staged").Config}
 */
export default {
  "packages/monorepo.*/**/*.{js,jsx,ts,tsx,mjs,cjs}": [
    "dprint fmt",
    CSPELL_CMD,
  ],
  "*.md": [CSPELL_CMD],
  "packages/**/*.{js,jsx,ts,tsx,mjs,cjs}": (
    files,
  ) => {
    const match = micromatch.not(
      files,
      [
        "**/templates/**/*",
        "**/generatedNoCheck/**/*",
        "**/generatedNoCheck2/**/*",
        "**/examples/**/*",
      ],
    );
    if (match.length === 0) return [];
    return [
      `dprint fmt ${match.join(" ")}`,
      `eslint --fix  ${match.join(" ")}`,
      `${CSPELL_CMD} ${match.join(" ")}`,
    ];
  },
  "(.lintstagedrc.mjs|.monorepolint.config.mjs)": [
    "dprint fmt",
    CSPELL_CMD,
  ],
  "*": (files) => {
    const mrlFiles = micromatch(files, [
      "package.json",
      "packages/*/package.json",
      "tsconfig.json",
      "packages/*/tsconfig.json",
    ], {});

    const mrlCommands = mrlFiles.length > 0
      ? ["monorepolint check --verbose", `dprint fmt ${mrlFiles.join(" ")}`]
      : [];

    return [...mrlCommands];
  },
};
