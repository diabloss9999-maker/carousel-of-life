import "server-only";

/**
 * 사주 충·합 관계 분석.
 *
 * 오늘의 일주(日柱) vs 사용자 사주의 4기둥(년·월·일·시)을 비교하여
 * - 천간합(天干合)
 * - 지지충(六沖)
 * - 지지삼합(三合)
 * - 지지육합(六合)
 * 관계가 형성되는지 검사한다.
 */

import { STEMS_HANJA, BRANCHES_HANJA } from "@/lib/saju/iljin";

/** 천간합(天干合): [stemIdx1, stemIdx2, 합의 오행]. */
const STEM_HAPS: ReadonlyArray<readonly [number, number, string]> = [
  [0, 5, "토"], // 甲(0) 己(5) → 토
  [1, 6, "금"], // 乙(1) 庚(6) → 금
  [2, 7, "수"], // 丙(2) 辛(7) → 수
  [3, 8, "목"], // 丁(3) 壬(8) → 목
  [4, 9, "화"], // 戊(4) 癸(9) → 화
];

/** 지지충(六沖). */
const BRANCH_CHUNGS: ReadonlyArray<readonly [number, number]> = [
  [0, 6], // 子午
  [1, 7], // 丑未
  [2, 8], // 寅申
  [3, 9], // 卯酉
  [4, 10], // 辰戌
  [5, 11], // 巳亥
];

/** 지지삼합(三合): [b1, b2, b3, 합의 오행]. */
const BRANCH_SAMHAPS: ReadonlyArray<readonly [number, number, number, string]> =
  [
    [2, 6, 10, "화"], // 寅午戌
    [11, 3, 7, "목"], // 亥卯未
    [8, 0, 4, "수"], // 申子辰
    [5, 9, 1, "금"], // 巳酉丑
  ];

/** 지지육합(六合). */
const BRANCH_YUKHAPS: ReadonlyArray<readonly [number, number, string]> = [
  [0, 1, "토"], // 子丑
  [2, 11, "목"], // 寅亥
  [3, 10, "화"], // 卯戌
  [4, 9, "금"], // 辰酉
  [5, 8, "수"], // 巳申
  [6, 7, "토"], // 午未
];

export type RelationshipType =
  | "chung"
  | "samhap"
  | "yukhap"
  | "stemhap"
  | "neutral";
export type RelationshipEnergy = "positive" | "negative" | "neutral";

export interface RelationshipResult {
  type: RelationshipType;
  description: string;
  energy: RelationshipEnergy;
  detail: string;
}

export interface UserPillarInput {
  year: { stem: string; branch: string } | null;
  month: { stem: string; branch: string } | null;
  day: { stem: string; branch: string } | null;
  hour: { stem: string; branch: string } | null;
}

/**
 * 오늘 일주와 사용자 사주의 충·합 관계를 분석한다.
 *
 * @param todayStem  - 오늘의 천간 인덱스(0~9)
 * @param todayBranch - 오늘의 지지 인덱스(0~11)
 * @param userPillars - 사용자의 4기둥
 */
export function analyzeDayRelationship(
  todayStem: number,
  todayBranch: number,
  userPillars: UserPillarInput,
): RelationshipResult[] {
  const results: RelationshipResult[] = [];

  // 사용자 천간/지지 인덱스 추출
  const userStems: number[] = [];
  const userBranches: number[] = [];

  for (const pillar of [
    userPillars.year,
    userPillars.month,
    userPillars.day,
    userPillars.hour,
  ]) {
    if (!pillar) continue;
    const sIdx = (STEMS_HANJA as readonly string[]).indexOf(pillar.stem);
    const bIdx = (BRANCHES_HANJA as readonly string[]).indexOf(pillar.branch);
    if (sIdx >= 0) userStems.push(sIdx);
    if (bIdx >= 0) userBranches.push(bIdx);
  }

  // 천간합
  for (const [s1, s2, elem] of STEM_HAPS) {
    if (
      (todayStem === s1 && userStems.includes(s2)) ||
      (todayStem === s2 && userStems.includes(s1))
    ) {
      results.push({
        type: "stemhap",
        description: `천간합(${STEMS_HANJA[s1]}${STEMS_HANJA[s2]}합)`,
        energy: "positive",
        detail: `오늘 천간이 사주의 천간과 합을 이뤄 ${elem} 기운이 강화돼요.`,
      });
    }
  }

  // 지지충
  for (const [b1, b2] of BRANCH_CHUNGS) {
    if (
      (todayBranch === b1 && userBranches.includes(b2)) ||
      (todayBranch === b2 && userBranches.includes(b1))
    ) {
      results.push({
        type: "chung",
        description: `지지충(${BRANCHES_HANJA[b1]}${BRANCHES_HANJA[b2]}충)`,
        energy: "negative",
        detail:
          "오늘 지지가 사주의 지지와 충돌해요. 변동·긴장이 있을 수 있으니 큰 결정은 미루는 편이 좋아요.",
      });
    }
  }

  // 지지삼합 — 오늘 지지를 포함한 삼합 그룹 중, 나머지 두 지지를 사용자가 모두 가진 경우
  for (const [b1, b2, b3, elem] of BRANCH_SAMHAPS) {
    const samhapGroup = [b1, b2, b3];
    if (samhapGroup.includes(todayBranch)) {
      const remaining = samhapGroup.filter((b) => b !== todayBranch);
      if (remaining.every((b) => userBranches.includes(b))) {
        results.push({
          type: "samhap",
          description: `삼합(${samhapGroup
            .map((b) => BRANCHES_HANJA[b])
            .join("")}삼합)`,
          energy: "positive",
          detail: `오늘 지지가 사주와 ${elem} 삼합을 완성해요. 강한 에너지 활성화의 날.`,
        });
      }
    }
  }

  // 지지육합
  for (const [b1, b2, elem] of BRANCH_YUKHAPS) {
    if (
      (todayBranch === b1 && userBranches.includes(b2)) ||
      (todayBranch === b2 && userBranches.includes(b1))
    ) {
      results.push({
        type: "yukhap",
        description: `육합(${BRANCHES_HANJA[b1]}${BRANCHES_HANJA[b2]}합)`,
        energy: "positive",
        detail: `오늘 지지가 사주와 육합을 이뤄 ${elem} 기운이 부드럽게 흘러요.`,
      });
    }
  }

  if (results.length === 0) {
    results.push({
      type: "neutral",
      description: "특별한 충·합 없음",
      energy: "neutral",
      detail:
        "오늘은 사주와 특별한 충돌이나 합이 없는 평온한 일진이에요. 일상 페이스를 유지해요.",
    });
  }

  return results;
}
