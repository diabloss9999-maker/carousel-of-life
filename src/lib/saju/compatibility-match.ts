/**
 * 궁합 정밀 분석 — 두 사주의 결정론적 상호작용.
 *
 * 기존 궁합은 생년월일을 AI 에 던지고 점수까지 AI 가 "지어냈다". 여기서는 두 사람의
 * 사주를 실제로 계산해 명리 규칙으로 궁합을 산출한다:
 *  1) 일간(日干) 십성 관계 — 서로를 어떤 존재로 느끼는지 (끌림·의지·보살핌 등)
 *  2) 일지(日支, 배우자궁) 합·충 — 가장 가까운 자리가 맞물리는지 부딪히는지
 *  3) 전체 지지 합/충 총량 — 조화 vs 마찰의 결
 *  4) 오행 보완 — 한쪽의 부족분을 상대가 채워주는지
 *  5) 용신 교환 — 상대의 기운이 마침 내게 가장 도움이 되는지(최고의 궁합 신호)
 *
 * → 결정론적 점수(0~100)와 쉬운 한국어 분석 블록을 반환. 점수는 AI 가 아니라
 *   이 계산이 정한다.
 */
import "server-only";

import { calculateSaju, type SajuOutput } from "@/lib/saju/calculate";
import {
  analyzeNatal,
  tenGodForStem,
  type NatalPillars,
  type StrengthLabel,
  type TenGod,
} from "@/lib/saju/ten-gods";

export interface ChartInput {
  birthDate: string;
  birthTime: string | null;
  calendarSystem: "solar" | "lunar";
}

export interface SajuMatch {
  /** 결정론적 궁합 점수(30~98). */
  score: number;
  /** 프롬프트 주입용 분석 블록(쉬운 한국어). */
  block: string;
}

type ElementKey = keyof SajuOutput["fiveElements"];

// ── 지지 관계(한자) ──
const CHUNG: ReadonlyArray<readonly [string, string]> = [
  ["子", "午"], ["丑", "未"], ["寅", "申"], ["卯", "酉"], ["辰", "戌"], ["巳", "亥"],
];
const YUKHAP: ReadonlyArray<readonly [string, string]> = [
  ["子", "丑"], ["寅", "亥"], ["卯", "戌"], ["辰", "酉"], ["巳", "申"], ["午", "未"],
];
const SAMHAP: ReadonlyArray<readonly [string, string, string]> = [
  ["寅", "午", "戌"], ["亥", "卯", "未"], ["申", "子", "辰"], ["巳", "酉", "丑"],
];
const HAE: ReadonlyArray<readonly [string, string]> = [
  ["子", "未"], ["丑", "午"], ["寅", "巳"], ["卯", "辰"], ["申", "亥"], ["酉", "戌"],
];
const HYEONG_TRIOS: ReadonlyArray<readonly string[]> = [
  ["寅", "巳", "申"], ["丑", "戌", "未"],
];
const HYEONG_PAIR: readonly [string, string] = ["子", "卯"];

function isPair(
  pairs: ReadonlyArray<readonly [string, string]>,
  a: string,
  b: string,
): boolean {
  return pairs.some(([x, y]) => (a === x && b === y) || (a === y && b === x));
}
function sameSamhapGroup(a: string, b: string): boolean {
  return SAMHAP.some((g) => g.includes(a) && g.includes(b)) && a !== b;
}
function isHyeong(a: string, b: string): boolean {
  return (
    HYEONG_TRIOS.some((t) => t.includes(a) && t.includes(b) && a !== b) ||
    isPair([HYEONG_PAIR], a, b)
  );
}

// ── 오행 상생/상극(용신 판정용) ──
const GENERATES: Record<ElementKey, ElementKey> = {
  wood: "fire", fire: "earth", earth: "metal", metal: "water", water: "wood",
};
const CONTROLS: Record<ElementKey, ElementKey> = {
  wood: "earth", earth: "water", water: "fire", fire: "metal", metal: "wood",
};
function generatedBy(e: ElementKey): ElementKey {
  return (Object.keys(GENERATES) as ElementKey[]).find((k) => GENERATES[k] === e)!;
}
function controlledBy(e: ElementKey): ElementKey {
  return (Object.keys(CONTROLS) as ElementKey[]).find((k) => CONTROLS[k] === e)!;
}
function favorableElements(dayEl: ElementKey, strength: StrengthLabel): Set<ElementKey> {
  if (strength === "신약") return new Set([generatedBy(dayEl), dayEl]);
  if (strength === "신강") return new Set([GENERATES[dayEl], CONTROLS[dayEl], controlledBy(dayEl)]);
  return new Set();
}

const NATAL_KO2KEY: Record<string, ElementKey> = {
  나무: "wood", 불: "fire", 흙: "earth", 쇠: "metal", 물: "water",
};

/** 십성 → 궁합 가중치 + "내가 상대를 느끼는 결" 한 줄. */
const TENGOD_MATCH: Record<TenGod, { weight: number; note: string }> = {
  정재: { weight: 8, note: "상대에게서 안정감과 현실의 든든함을 느껴, 곁에 두고 아끼고 싶어지는 결" },
  정관: { weight: 8, note: "상대가 나를 다잡아주고 믿고 의지하게 되는, 진중한 결" },
  정인: { weight: 7, note: "상대가 나를 품어주고 채워줘, 마음이 놓이고 기대게 되는 결" },
  식신: { weight: 7, note: "상대와 있으면 편하고 즐거워 표현이 술술 나오는, 따뜻한 결" },
  편재: { weight: 6, note: "상대가 설렘과 활기를 줘, 함께 있으면 신이 나는 결" },
  편관: { weight: 5, note: "상대가 나를 긴장시키고 끌어올리는, 자극이 되는 결" },
  편인: { weight: 5, note: "상대가 독특한 방식으로 나를 일깨우는, 깊이 있는 결" },
  상관: { weight: 4, note: "상대가 내 끼와 재능을 끌어내는, 톡톡 튀는 결" },
  비견: { weight: 4, note: "상대가 나와 닮아 동지처럼 편한 결 (닮아서 부딪힐 때도)" },
  겁재: { weight: 2, note: "끌리지만 주도권에서 한 번씩 부딪칠 수 있는 결" },
};

interface ResolvedChart {
  np: NatalPillars;
  five: SajuOutput["fiveElements"];
  dayStem: string;
  dayBranch: string;
}

function resolve(input: ChartInput): ResolvedChart | null {
  let saju: SajuOutput;
  try {
    saju = calculateSaju(input);
  } catch {
    return null;
  }
  const p = saju.pillars;
  if (!p.day?.stem || !p.day?.branch) return null;
  const np: NatalPillars = {
    year: p.year ? { stem: p.year.stem, branch: p.year.branch } : null,
    month: p.month ? { stem: p.month.stem, branch: p.month.branch } : null,
    day: { stem: p.day.stem, branch: p.day.branch },
    hour: p.hour ? { stem: p.hour.stem, branch: p.hour.branch } : null,
  };
  return { np, five: saju.fiveElements, dayStem: p.day.stem, dayBranch: p.day.branch };
}

/** 모든 지지(년·월·일·시) 한자 배열. */
function allBranches(np: NatalPillars): string[] {
  return [np.year?.branch, np.month?.branch, np.day?.branch, np.hour?.branch].filter(
    (b): b is string => !!b,
  );
}

/**
 * 두 사주의 궁합을 결정론적으로 분석한다.
 * 어느 한쪽이라도 일주가 없으면 null(호출부에서 AI 폴백).
 */
export function analyzeSajuMatch(a: ChartInput, b: ChartInput): SajuMatch | null {
  const ca = resolve(a);
  const cb = resolve(b);
  if (!ca || !cb) return null;

  const lines: string[] = [];
  let score = 50;

  // 1) 일간 십성 관계 (양방향).
  const aToB = tenGodForStem(ca.dayStem, cb.dayStem); // 내(A) 기준 상대(B)
  const bToA = tenGodForStem(cb.dayStem, ca.dayStem);
  if (aToB) {
    const m = TENGOD_MATCH[aToB];
    score += m.weight;
    lines.push(`- 내가 상대를 느끼는 결: ${m.note}`);
  }
  if (bToA) {
    const m = TENGOD_MATCH[bToA];
    score += m.weight;
    lines.push(`- 상대가 나를 느끼는 결: ${m.note}`);
  }

  // 2) 일지(배우자궁) 합·충.
  const ab = ca.dayBranch;
  const bb = cb.dayBranch;
  if (isPair(YUKHAP, ab, bb)) {
    score += 14;
    lines.push("- 두 사람의 가장 가까운 자리가 부드럽게 맞물려, 곁에 있으면 자연스럽게 편안해지는 궁합이에요.");
  } else if (sameSamhapGroup(ab, bb)) {
    score += 9;
    lines.push("- 두 사람의 중심 기운이 같은 방향으로 흘러, 함께 목표를 향할 때 시너지가 큰 궁합이에요.");
  } else if (isPair(CHUNG, ab, bb)) {
    score -= 13;
    lines.push("- 두 사람의 가장 가까운 자리가 정면으로 부딪혀요. 끌리는 만큼 충돌도 큰 사이라, 거리 조절과 배려가 핵심이에요.");
  } else if (isHyeong(ab, bb)) {
    score -= 6;
    lines.push("- 가까운 자리에서 서로를 깎고 다듬는 기운이 있어요. 부딪힘이 있어도 그만큼 단련되는 관계예요.");
  } else if (isPair(HAE, ab, bb)) {
    score -= 4;
    lines.push("- 가까운 자리에 사소한 신경 쓰임이 끼기 쉬워요. 작은 오해를 그때그때 푸는 게 좋아요.");
  } else if (ab === bb) {
    score += 5;
    lines.push("- 가장 가까운 자리가 서로 닮아, 말하지 않아도 통하는 게 많은 사이예요.");
  }

  // 3) 전체 지지 합/충 총량.
  const ba = allBranches(ca.np);
  const bbs = allBranches(cb.np);
  let hap = 0;
  let chung = 0;
  for (const x of ba) {
    for (const y of bbs) {
      if (isPair(YUKHAP, x, y) || sameSamhapGroup(x, y)) hap += 1;
      else if (isPair(CHUNG, x, y)) chung += 1;
    }
  }
  const net = Math.max(-4, Math.min(4, hap - chung));
  score += net * 2;
  if (hap - chung >= 2) {
    lines.push("- 두 사람의 기운 전반이 어우러지는 쪽으로 흘러, 함께하는 시간이 편안하게 쌓이는 결이에요.");
  } else if (hap - chung <= -2) {
    lines.push("- 두 사람의 기운 전반에 자극과 변동이 많아, 정적이기보다 역동적인 관계예요. 속도 조절이 도움이 돼요.");
  }

  // 4) 오행 보완 (양방향).
  const ELS: ElementKey[] = ["wood", "fire", "earth", "metal", "water"];
  const fills = (lack: SajuOutput["fiveElements"], give: SajuOutput["fiveElements"]): boolean =>
    ELS.some((e) => (lack[e] ?? 0) <= 1 && (give[e] ?? 0) >= 2);
  let complement = false;
  if (fills(ca.five, cb.five)) {
    score += 6;
    complement = true;
  }
  if (fills(cb.five, ca.five)) {
    score += 6;
    complement = true;
  }
  if (complement) {
    lines.push("- 한쪽에 부족한 기운을 상대가 채워줘요. 서로의 빈자리를 메우는, 보완이 잘 되는 궁합이에요.");
  }

  // 5) 용신 교환 (양방향).
  const natalA = analyzeNatal(ca.np);
  const natalB = analyzeNatal(cb.np);
  const dominant = (five: SajuOutput["fiveElements"]): ElementKey =>
    ELS.reduce((best, e) => ((five[e] ?? 0) > (five[best] ?? 0) ? e : best), ELS[0]);
  let yongsinSwap = false;
  if (natalA) {
    const aEl = NATAL_KO2KEY[natalA.dayElementKo];
    if (aEl && favorableElements(aEl, natalA.strength).has(dominant(cb.five))) {
      score += 8;
      yongsinSwap = true;
    }
  }
  if (natalB) {
    const bEl = NATAL_KO2KEY[natalB.dayElementKo];
    if (bEl && favorableElements(bEl, natalB.strength).has(dominant(ca.five))) {
      score += 8;
      yongsinSwap = true;
    }
  }
  if (yongsinSwap) {
    lines.push("- 상대가 지닌 기운이 마침 내게 가장 힘이 되는 결이에요. 함께 있으면 서로 운이 트이는, 보기 드물게 좋은 궁합 신호예요.");
  }

  score = Math.max(30, Math.min(98, Math.round(score)));

  const block = [
    `[궁합 정밀 분석 — 이미 계산된 결과. score 는 이 분석으로 산출된 값이니 그대로 쓰고, summary·detail 은 아래 근거를 뼈대로 쉬운 일상어로만 풀어라. 한자·사주 용어(일간·일지·오행·용신·합·충·십성 등) 금지]`,
    `산출 궁합 점수: ${score}점`,
    ...lines,
  ].join("\n");

  return { score, block };
}
