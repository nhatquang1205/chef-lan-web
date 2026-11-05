import { defineConfig, devices } from "@playwright/test";

const WEB_PORT = 3101;
const API_PORT = 5099;
const env = {
  API_BASE_URL: `http://127.0.0.1:${API_PORT}`,
  NEXT_PUBLIC_API_BASE_URL: `http://127.0.0.1:${API_PORT}`,
  NEXT_PUBLIC_SITE_URL: `http://localhost:${WEB_PORT}`,
  NEXT_DIST_DIR: ".next-e2e",
};

// Tests run against a production build (`next build && next start`), as the deployed site does: the
// bugs this guards against (rewrites, redirect loops behind nginx) never show up in `next dev`.
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  retries: 1,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${WEB_PORT}`, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    { command: "node tests/mock-api.mjs", url: `http://127.0.0.1:${API_PORT}/api/v1/categories`, env: { MOCK_API_PORT: String(API_PORT) }, reuseExistingServer: false },
    {
      command: `pnpm build && pnpm start -p ${WEB_PORT}`,
      url: `http://localhost:${WEB_PORT}/`,
      env,
      timeout: 300_000,
      reuseExistingServer: false,
    },
  ],
});
