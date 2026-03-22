import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "happy-dom",
    exclude: [...configDefaults.exclude, "e2e"],
    globals: true,
    passWithNoTests: true,
    setupFiles: "./src/testing/vitest.setup.ts",
  },
});
