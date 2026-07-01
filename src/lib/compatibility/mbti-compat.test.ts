import { describe, expect, it } from "vitest";

import { getMbtiCompat, MBTI_TYPES } from "@/lib/compatibility/mbti-compat";

describe("getMbtiCompat", () => {
  it("점수는 항상 20~98 범위 안에 있다(모든 조합)", () => {
    for (const me of MBTI_TYPES) {
      for (const partner of MBTI_TYPES) {
        const result = getMbtiCompat(me, partner);
        expect(result.score).toBeGreaterThanOrEqual(20);
        expect(result.score).toBeLessThanOrEqual(98);
      }
    }
  });

  it("자기 자신과의 궁합은 축이 4개 모두 일치해 상대적으로 높은 기본 점수를 준다", () => {
    const result = getMbtiCompat("INFP", "INFP");
    // 4축 일치 기본값(78) ± tweak 범위 안에 들어와야 한다.
    expect(result.score).toBeGreaterThanOrEqual(70);
  });

  it("같은 입력이면 항상 같은 결과를 준다(결정론적)", () => {
    const a = getMbtiCompat("ENFP", "ISTJ");
    const b = getMbtiCompat("ENFP", "ISTJ");
    expect(a.score).toBe(b.score);
    expect(a.headline).toBe(b.headline);
  });

  it("결과에 me/partner 타입 정보를 그대로 담는다", () => {
    const result = getMbtiCompat("ESTJ", "ISFP");
    expect(result.me.type).toBe("ESTJ");
    expect(result.partner.type).toBe("ISFP");
  });

  it("headline과 detail은 빈 문자열이 아니다", () => {
    const result = getMbtiCompat("INTJ", "ESFJ");
    expect(result.headline.length).toBeGreaterThan(0);
    expect(result.detail.length).toBeGreaterThan(0);
  });
});
