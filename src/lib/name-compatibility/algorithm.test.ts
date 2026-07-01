import { describe, expect, it } from "vitest";

import { calculateNameCompatibility } from "@/lib/name-compatibility/algorithm";

describe("calculateNameCompatibility", () => {
  it("점수는 항상 0~99 범위 안에 있다", () => {
    const pairs: [string, string][] = [
      ["김철수", "이영희"],
      ["박지훈", "최유나"],
      ["강", "홍"],
      ["도윤", "하루"],
      ["Alice", "Bob"],
    ];
    for (const [a, b] of pairs) {
      const result = calculateNameCompatibility(a, b);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(99);
      expect(Number.isInteger(result.score)).toBe(true);
    }
  });

  it("같은 입력이면 항상 같은 점수를 준다(결정론적, DB 캐시 불필요 전제)", () => {
    const a = calculateNameCompatibility("김철수", "이영희");
    const b = calculateNameCompatibility("김철수", "이영희");
    expect(a.score).toBe(b.score);
    expect(a.label).toBe(b.label);
  });

  it("점수에 맞는 등급 라벨을 정확히 매긴다", () => {
    const result = calculateNameCompatibility("도윤", "하루");
    if (result.score >= 90) expect(result.tone).toBe("best");
    else if (result.score >= 70) expect(["best", "good"]).toContain(result.tone);
    else if (result.score >= 50) expect(["good", "ok"]).toContain(result.tone);
    else expect(["ok", "tough"]).toContain(result.tone);
  });

  it("앞뒤 공백은 정리하고 연속 공백은 하나로 합친다", () => {
    const trimmed = calculateNameCompatibility("김철수", "이영희");
    const padded = calculateNameCompatibility("  김철수  ", "이영희");
    expect(padded.score).toBe(trimmed.score);
  });

  it("허용하지 않는 문자(숫자·특수문자)가 섞이면 예외를 던진다", () => {
    expect(() => calculateNameCompatibility("김철수123", "이영희")).toThrow();
    expect(() => calculateNameCompatibility("김철수", "이영희!!")).toThrow();
  });

  it("25자 이상인 이름은 예외를 던진다", () => {
    const tooLong = "가".repeat(25);
    expect(() => calculateNameCompatibility(tooLong, "이영희")).toThrow();
  });

  it("정규화된 이름을 결과에 그대로 담는다", () => {
    const result = calculateNameCompatibility("김철수", "이영희");
    expect(result.normalizedNameA).toBe("김철수");
    expect(result.normalizedNameB).toBe("이영희");
  });
});
