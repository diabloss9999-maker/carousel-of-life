import { expect, test } from "@playwright/test";

/**
 * 공개 페이지 스모크 테스트 — 로그인 없이 접근 가능한 페이지가
 * 200으로 렌더되고 핵심 CTA/문구가 보이는지만 확인한다.
 * 인증이 필요한 대시보드 라우트(오늘운세·타로 등)는 테스트 계정 세팅이
 * 별도로 필요해 이 스모크 범위에서는 제외한다.
 */

test.describe("랜딩 페이지", () => {
  test("정상 로드되고 핵심 CTA가 보인다", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBeLessThan(400);

    await expect(
      page.getByRole("heading", { name: /최애가/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /내 최애 만나러 가기/ }),
    ).toBeVisible();
  });

  test("9명 멤버 캐러셀이 전부 노출된다", async ({ page }) => {
    await page.goto("/");
    const members = [
      "이안",
      "유준",
      "도윤",
      "재하",
      "하루",
      "시온",
      "태오",
      "이현",
      "하민",
    ];
    for (const name of members) {
      await expect(page.getByRole("link", { name }).first()).toBeVisible();
    }
  });
});

test.describe("인증 페이지", () => {
  test("로그인 페이지가 정상 로드된다", async ({ page }) => {
    const response = await page.goto("/login");
    expect(response?.status()).toBeLessThan(400);
  });

  test("회원가입 페이지가 정상 로드된다", async ({ page }) => {
    const response = await page.goto("/signup");
    expect(response?.status()).toBeLessThan(400);
  });
});

test.describe("가격 페이지", () => {
  test("정상 로드되고 멤버십 안내가 보인다", async ({ page }) => {
    const response = await page.goto("/pricing");
    expect(response?.status()).toBeLessThan(400);
  });
});

test.describe("법적 고지 페이지", () => {
  for (const path of ["/terms", "/privacy", "/refund", "/business"]) {
    test(`${path} 가 정상 로드된다`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBeLessThan(400);
    });
  }
});

test.describe("SEO 인프라", () => {
  test("sitemap.xml 이 정상 응답한다", async ({ page }) => {
    const response = await page.goto("/sitemap.xml");
    expect(response?.status()).toBe(200);
  });

  test("robots.txt 이 정상 응답하고 sitemap 을 가리킨다", async ({ page }) => {
    const response = await page.goto("/robots.txt");
    expect(response?.status()).toBe(200);
    const body = await response?.text();
    expect(body).toContain("sitemap.xml");
  });
});
