import { describe, expect, it } from "vitest";

import { getZodiacCompat } from "@/lib/compatibility/zodiac-compat";
import { ZODIAC_LIST } from "@/lib/fortunes/zodiac";

const SIGNS = ZODIAC_LIST.map((z) => z.id);

describe("getZodiacCompat", () => {
  it("점수는 항상 20~98 범위 안에 있다(모든 조합)", () => {
    for (const me of SIGNS) {
      for (const partner of SIGNS) {
        const result = getZodiacCompat(me, partner);
        expect(result.score).toBeGreaterThanOrEqual(20);
        expect(result.score).toBeLessThanOrEqual(98);
      }
    }
  });

  it("같은 입력이면 항상 같은 결과를 준다(결정론적)", () => {
    const a = getZodiacCompat("aries", "leo");
    const b = getZodiacCompat("aries", "leo");
    expect(a.score).toBe(b.score);
  });

  it("같은 원소(불x불)는 다른 원소(불x물, 상극)보다 점수가 높다", () => {
    const sameElement = getZodiacCompat("aries", "leo"); // 불x불
    const clashing = getZodiacCompat("aries", "cancer"); // 불x물
    expect(sameElement.score).toBeGreaterThan(clashing.score);
  });

  it("결과에 me/partner 별자리 정보를 그대로 담는다", () => {
    const result = getZodiacCompat("virgo", "pisces");
    expect(result.me.id).toBe("virgo");
    expect(result.partner.id).toBe("pisces");
  });
});
