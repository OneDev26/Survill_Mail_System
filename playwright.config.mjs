import { defineConfig } from "@playwright/test";
export default defineConfig({
  outputDir: "test-results",
  testDir: "./tests",
  testMatch: "**/api.spec.mjs",
  timeout: 30000,
  fullyParallel: true,
  workers: 2,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4174",
    channel:
      process.env.PW_BROWSER_CHANNEL ||
      (process.platform === "win32" ? "msedge" : undefined),
    viewport: { width: 1440, height: 960 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command:
      "node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4174 --strictPort",
    url: "http://127.0.0.1:4174",
    reuseExistingServer: false,
    env: { VITE_API_BASE_URL: "http://127.0.0.1:4174" },
  },
});
