const { defineConfig, devices } = require("@playwright/test");
const dotenv = require("dotenv");

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.example", override: false });

const wpBaseUrl = process.env.WP_BASE_URL || "http://localhost";

module.exports = defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: wpBaseUrl,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
