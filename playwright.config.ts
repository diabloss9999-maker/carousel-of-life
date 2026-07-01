import { defineConfig, devices } from "@playwright/test";

/**
 * E2E 스모크 테스트 설정.
 *
 * 로그인 없이 접근 가능한 공개 페이지가 렌더링·핵심 CTA를 제대로 보여주는지
 * 확인한다. 로컬에서 `pnpm dev` 서버가 떠 있지 않으면 자동으로 띄운다.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "pnpm dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 60_000,
      },
});
