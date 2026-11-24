import { defineConfig, configDefaults } from "vitest/config";

export default defineConfig({
  test: {
    environment: "edge-runtime",
    server: { deps: { inline: ["convex-test"] } },
    env: { CONVEX_CLOUD_URL: "https://test.convex.cloud" },
    // testUtils.test.ts is a shared helper, not a suite. It is named
    // `*.test.ts` so Convex's bundler excludes it from the deployed
    // backend (it imports @convex-dev/auth's test-only, Vite-only code),
    // so it has to be excluded from vitest's own run the same way.
    exclude: [...configDefaults.exclude, "convex/testUtils.test.ts"],
  },
});
