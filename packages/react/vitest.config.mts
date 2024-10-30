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
