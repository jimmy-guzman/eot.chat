import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    env: {
      NEXT_PUBLIC_PARTYKIT_HOST: "localhost:1999",
      PARTYKIT_URL: "http://localhost:1999",
    },
    environment: "happy-dom",
    exclude: [...configDefaults.exclude, "e2e"],
    globals: true,
    passWithNoTests: true,
    setupFiles: "./src/testing/vitest.setup.ts",
  },
});
