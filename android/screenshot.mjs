/**
 * Play Store 스크린샷 자동 캡처.
 *
 * 사용:
 *   1. pnpm dlx playwright install chromium  (최초 1회)
 *   2. node android/screenshot.mjs
 *
 * 결과물: android/screenshots/{name}.png (1080x1920 portrait, Pixel 6 사이즈)
 *
 * ⚠️ 로그인된 상태 캡처가 필요하다면:
 *   - .env.local 에 SCREENSHOT_EMAIL · SCREENSHOT_PASSWORD 설정
 *   - 또는 manuallyLogin 함수에서 SSO 흐름 추가
 *
 * 미로그인 상태에서도 캡처되는 페이지: /, /pricing, /privacy, /terms
 * 로그인 상태 필요: /today, /chat, /tarot, /saju, /palm
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = process.env.SCREENSHOT_BASE_URL || "https://carouseloflife.com";
const OUT_DIR = "android/screenshots";

// Pixel 6 portrait 사이즈 — Play Store 권장
const VIEWPORT = { width: 1080, height: 1920 };
const DEVICE_SCALE = 1;

fs.mkdirSync(OUT_DIR, { recursive: true });

const TARGETS = [
  { name: "01-landing",  path: "/",        waitFor: 1500 },
  { name: "02-pricing",  path: "/pricing", waitFor: 1500 },
  { name: "03-today",    path: "/today",   waitFor: 2500, requiresAuth: true },
  { name: "04-chat",     path: "/chat",    waitFor: 2000, requiresAuth: true },
  { name: "05-tarot",    path: "/tarot",   waitFor: 2500, requiresAuth: true },
  { name: "06-saju",     path: "/saju",    waitFor: 2500, requiresAuth: true },
];

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DEVICE_SCALE,
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    userAgent:
      "Mozilla/5.0 (Linux; Android 13; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  });

  const page = await ctx.newPage();

  for (const t of TARGETS) {
    if (t.requiresAuth) {
      console.warn(`⚠️  ${t.path} requires login — skip (login automation 미구성)`);
      continue;
    }
    console.log(`📸 ${BASE}${t.path}`);
    await page.goto(`${BASE}${t.path}`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(t.waitFor);
    await page.screenshot({
      path: path.join(OUT_DIR, `${t.name}.png`),
      fullPage: false,
    });
  }

  await browser.close();
  console.log(`✅ 완료. 결과: ${OUT_DIR}/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
