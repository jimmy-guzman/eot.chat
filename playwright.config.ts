import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  fullyParallel: true,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  testDir: "./e2e",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "pnpm dev",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      url: "http://localhost:3000",
    },
    {
      command: "npx partykit dev --port 1999",
      port: 1999,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
