import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  fullyParallel: true,
  workers: 2,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    channel:
      process.env.PW_BROWSER_CHANNEL ||
      (process.platform === "win32" ? "msedge" : undefined),
    viewport: { width: 1440, height: 960 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4173 --strictPort",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
  },
});
