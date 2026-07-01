/**
 * 오늘 일진 정밀 분석 — 용신·신살·형파해.
 *
 * daily-manse 의 충/합/오행/십성 위에 명리 정확도의 핵심 3가지를 더한다:
 *  1) 용신(用神): 일간 강약(신강/신약)으로 도출한 "도움이 되는 기운" 방향에
 *     오늘 흐르는 십성이 맞는지 → 가장 큰 정확도 레버
 *  2) 신살(神煞): 도화·역마·천을귀인·화개·공망 — 그날의 색을 또렷하게
 *  3) 형(刑)·파(破)·해(害): 충·합만으로 못 잡는 미세한 마찰
 *
 * 전부 결정론적. 점수 보정(delta) + 쉬운 한국어 노트(가중치 포함)를 반환한다.
 */
import "server-only";

import { BRANCHES_HANJA, STEMS_HANJA } from "@/lib/saju/iljin";
import {
  analyzeNatal,
  tenGodForStem,
  tenGodGroup,
  type NatalPillars,
  type TenGodGroup,
} from "@/lib/saju/ten-gods";

/** 분석 신호 한 건 — 노트 + 점수 가중치(헤드라인 선정에 사용). */
export interface DaySignal {
  note: string;
  weight: number;
}

export interface DayPrecision {
  delta: number;
  signals: DaySignal[];
  flags: {
    yongsinFavor?: boolean;
    yongsinAgainst?: boolean;
    dohwa?: boolean;
    yeokma?: boolean;
    gwiin?: boolean;
    hwagae?: boolean;
    gongmang?: boolean;
  };
}

// 지지 인덱스: 子0 丑1 寅2 卯3 辰4 巳5 午6 未7 申8 酉9 戌10 亥11

/** 삼합 국별 도화·역마·화개 지지 인덱스. key = 국에 속한 지지. */
const SAMHAP_SINSAL: ReadonlyArray<{
  group: readonly number[];
  dohwa: number;
  yeokma: number;
  hwagae: number;
}> = [
  { group: [2, 6, 10], dohwa: 3, yeokma: 8, hwagae: 10 }, // 火국 寅午戌
  { group: [11, 3, 7], dohwa: 0, yeokma: 5, hwagae: 7 }, // 木국 亥卯未
  { group: [8, 0, 4], dohwa: 9, yeokma: 2, hwagae: 4 }, // 水국 申子辰
  { group: [5, 9, 1], dohwa: 6, yeokma: 11, hwagae: 1 }, // 金국 巳酉丑
];

/** 천을귀인(天乙貴人) — 일간(천간 한자) → 귀인 지지 인덱스들. */
const CHEONEUL: Record<string, readonly number[]> = {
  甲: [1, 7],
  戊: [1, 7],
  庚: [1, 7],
  乙: [0, 8],
  己: [0, 8],
  丙: [11, 9],
  丁: [11, 9],
  辛: [2, 6],
  壬: [5, 3],
  癸: [5, 3],
};

/** 공망(空亡) — 순(旬, gzIndex/10) → 공망 지지 인덱스 쌍. */
const GONGMANG_BY_XUN: ReadonlyArray<readonly [number, number]> = [
  [10, 11], // 甲子순 → 戌亥
  [8, 9], // 甲戌순 → 申酉
  [6, 7], // 甲申순 → 午未
  [4, 5], // 甲午순 → 辰巳
  [2, 3], // 甲辰순 → 寅卯
  [0, 1], // 甲寅순 → 子丑
];

/** 파(破) 쌍. */
const PA_PAIRS: ReadonlyArray<readonly [number, number]> = [
  [0, 9],
  [1, 4],
  [2, 11],
  [3, 6],
  [5, 8],
  [10, 7],
];

/** 해(害) 쌍. */
const HAE_PAIRS: ReadonlyArray<readonly [number, number]> = [
  [0, 7],
  [1, 6],
  [2, 5],
  [3, 4],
  [8, 11],
  [9, 10],
];

/** 삼형 트리오 + 상형 쌍 + 자형 지지. */
const HYEONG_TRIOS: ReadonlyArray<readonly number[]> = [
  [2, 5, 8], // 寅巳申
  [1, 10, 7], // 丑戌未
];
const HYEONG_PAIR: readonly [number, number] = [0, 3]; // 子卯 상형
const HYEONG_SELF: readonly number[] = [4, 6, 9, 11]; // 辰午酉亥 자형

/** 지지 충(冲) 쌍 — 인덱스. */
const CHUNG_IDX: ReadonlyArray<readonly [number, number]> = [
  [0, 6], [1, 7], [2, 8], [3, 9], [4, 10], [5, 11],
];
/** 지지 육합(六合) 쌍 — 인덱스. */
const YUKHAP_IDX: ReadonlyArray<readonly [number, number]> = [
  [0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7],
];

/** 시진 지지(인덱스) → 사람이 읽는 시간대 라벨. */
const HOUR_LABELS: readonly string[] = [
  "밤 23~1시", // 子
  "새벽 1~3시", // 丑
  "새벽 3~5시", // 寅
  "이른 아침 5~7시", // 卯
  "아침 7~9시", // 辰
  "오전 9~11시", // 巳
  "낮 11~13시", // 午
  "낮 13~15시", // 未
  "오후 15~17시", // 申
  "저녁 17~19시", // 酉
  "저녁 19~21시", // 戌
  "밤 21~23시", // 亥
];

function pairHas(
  pairs: ReadonlyArray<readonly [number, number]>,
  a: number,
  b: number,
): boolean {
  return pairs.some(([x, y]) => (a === x && b === y) || (a === y && b === x));
}

/**
 * 오늘의 시간대 길흉 — 12 시진 지지를 사용자 일지 + 오늘 일진과 충/합으로 견줘
 * 가장 잘 맞는 시간대 하나와 조심할 시간대 하나를 고른다.
 *
 * - 육합 +3 / 삼합 +2 / 충 -3 (일지·오늘 일진 각각에 대해 합산)
 * - 결정론적. 점수엔 영향 없음(시간대 안내는 서술 맥락용).
 */
export function analyzeAuspiciousHours(opts: {
  pillars: NatalPillars;
  todayBranchIdx: number;
}): { best: string | null; caution: string | null } {
  const refs = [
    branchIdxOf(opts.pillars.day?.branch),
    opts.todayBranchIdx,
  ].filter((b) => b >= 0);
  if (refs.length === 0) return { best: null, caution: null };

  let bestIdx = -1;
  let bestScore = 0;
  let cautionIdx = -1;
  let cautionScore = 0;

  for (let hb = 0; hb < 12; hb += 1) {
    let score = 0;
    for (const r of refs) {
      if (pairHas(YUKHAP_IDX, hb, r)) score += 3;
      if (pairHas(CHUNG_IDX, hb, r)) score -= 3;
      const grp = SAMHAP_SINSAL.find((s) => s.group.includes(r));
      if (grp && hb !== r && grp.group.includes(hb)) score += 2;
    }
    if (score > bestScore) {
      bestScore = score;
      bestIdx = hb;
    }
    if (score < cautionScore) {
      cautionScore = score;
      cautionIdx = hb;
    }
  }

  return {
    best: bestIdx >= 0 ? HOUR_LABELS[bestIdx] : null,
    caution: cautionIdx >= 0 ? HOUR_LABELS[cautionIdx] : null,
  };
}

/** (stemIdx, branchIdx) → 60갑자 인덱스(0~59). */
function gzIndexOf(stemIdx: number, branchIdx: number): number {
  for (let i = 0; i < 60; i += 1) {
    if (i % 10 === stemIdx && i % 12 === branchIdx) return i;
  }
  return -1;
}

function branchIdxOf(hanja: string | undefined): number {
  if (!hanja) return -1;
  return (BRANCHES_HANJA as readonly string[]).indexOf(hanja);
}

/** 일간 강약 → 오늘 십성 그룹이 유리/불리한지. */
function yongsinDirection(
  strength: "신강" | "중화" | "신약",
): { favor: TenGodGroup[]; against: TenGodGroup[] } {
  if (strength === "신강") {
    // 강한 일간은 덜어내는 쪽(식상·재성·관성)이 도움.
    return { favor: ["식상", "재성", "관성"], against: ["비겁", "인성"] };
  }
  if (strength === "신약") {
    // 약한 일간은 채워주는 쪽(인성·비겁)이 도움.
    return { favor: ["인성", "비겁"], against: ["식상", "재성", "관성"] };
  }
  return { favor: [], against: [] }; // 중화는 보정 없음.
}

/**
 * 오늘 일진의 정밀 분석.
 *
 * @param pillars       사용자 원국(년·월·일·시, 한자 stem/branch)
 * @param today         오늘 일주(천간 한자/지지 한자/지지 인덱스)
 */
export function analyzeDayPrecision(opts: {
  pillars: NatalPillars;
  todayStemHanja: string;
  todayBranchIdx: number;
}): DayPrecision {
  const { pillars, todayStemHanja, todayBranchIdx } = opts;
  const signals: DaySignal[] = [];
  const flags: DayPrecision["flags"] = {};
  let delta = 0;

  const dayMaster = pillars.day?.stem ?? null;

  // ── 1) 용신: 강약 기반으로 오늘 십성이 도움/부담인지 ──
  const natal = analyzeNatal(pillars);
  if (natal && dayMaster) {
    const todayGod = tenGodForStem(dayMaster, todayStemHanja);
    if (todayGod) {
      const grp = tenGodGroup(todayGod);
      const { favor, against } = yongsinDirection(natal.strength);
      if (favor.includes(grp)) {
        delta += 5;
        flags.yongsinFavor = true;
        signals.push({
          weight: 5,
          note: "오늘 흐르는 기운이 네 타고난 결에 꼭 필요한 쪽이라, 평소보다 일이 손에 잘 잡히고 도움받기 쉬운 날이에요. 한 걸음 내디뎌볼 만해요.",
        });
      } else if (against.includes(grp)) {
        delta -= 5;
        flags.yongsinAgainst = true;
        signals.push({
          weight: -5,
          note: "오늘 흐르는 기운이 네겐 살짝 과하게 작용할 수 있어요. 무리하게 밀어붙이기보다 페이스를 지키는 편이 이득이에요.",
        });
      }
    }
  }

  // ── 2) 신살 ──
  const refBranches = [
    branchIdxOf(pillars.year?.branch),
    branchIdxOf(pillars.day?.branch),
  ].filter((b) => b >= 0);

  let dohwa = false;
  let yeokma = false;
  let hwagae = false;
  for (const ref of refBranches) {
    const set = SAMHAP_SINSAL.find((s) => s.group.includes(ref));
    if (!set) continue;
    if (todayBranchIdx === set.dohwa) dohwa = true;
    if (todayBranchIdx === set.yeokma) yeokma = true;
    if (todayBranchIdx === set.hwagae) hwagae = true;
  }
  if (dohwa) {
    delta += 2;
    flags.dohwa = true;
    signals.push({
      weight: 2,
      note: "오늘은 매력과 끌림의 기운이 도는 날이에요. 사람들 사이에서 눈길을 받거나 마음이 설레기 쉬워요.",
    });
  }
  if (yeokma) {
    delta += 1;
    flags.yeokma = true;
    signals.push({
      weight: 1,
      note: "오늘은 이동과 변화의 기운이 도는 날이에요. 밖으로 나가 움직이거나 새 자리로 옮기는 일이 잘 풀려요.",
    });
  }
  if (hwagae) {
    flags.hwagae = true;
    signals.push({
      weight: 0,
      note: "오늘은 혼자 차분히 몰입하기 좋은 기운이에요. 정리·공부·창작처럼 나에게 집중하는 일에 어울려요.",
    });
  }

  // 천을귀인 — 일간 기준.
  if (dayMaster) {
    const gwiinBranches = CHEONEUL[dayMaster];
    if (gwiinBranches?.includes(todayBranchIdx)) {
      delta += 4;
      flags.gwiin = true;
      signals.push({
        weight: 4,
        note: "오늘은 귀인의 기운이 닿는 날이에요. 막힌 일에 도움을 주는 사람이 나타나거나 뜻밖의 호의를 받기 쉬워요.",
      });
    }
  }

  // 공망 — 사용자 일주의 순(旬) 기준.
  if (pillars.day?.stem && pillars.day?.branch) {
    const dStemIdx = (STEMS_HANJA as readonly string[]).indexOf(pillars.day.stem);
    const dBranchIdx = branchIdxOf(pillars.day.branch);
    if (dStemIdx >= 0 && dBranchIdx >= 0) {
      const gz = gzIndexOf(dStemIdx, dBranchIdx);
      if (gz >= 0) {
        const pair = GONGMANG_BY_XUN[Math.floor(gz / 10)];
        if (pair && pair.includes(todayBranchIdx)) {
          delta -= 4;
          flags.gongmang = true;
          signals.push({
            weight: -4,
            note: "오늘은 애써도 결과가 흐릿하게 비는 듯한 기운이에요. 큰 결정·계약보다 마무리하고 정리하는 쪽이 잘 맞아요.",
          });
        }
      }
    }
  }

  // ── 3) 형·파·해 (오늘 지지 vs 원국 지지) — 가장 센 것 하나만 ──
  const userBranches = [
    branchIdxOf(pillars.year?.branch),
    branchIdxOf(pillars.month?.branch),
    branchIdxOf(pillars.day?.branch),
    branchIdxOf(pillars.hour?.branch),
  ].filter((b) => b >= 0);

  const hasHyeong =
    HYEONG_TRIOS.some(
      (trio) =>
        trio.includes(todayBranchIdx) &&
        trio.filter((b) => b !== todayBranchIdx).some((b) => userBranches.includes(b)),
    ) ||
    (HYEONG_PAIR.includes(todayBranchIdx) &&
      HYEONG_PAIR.some((b) => b !== todayBranchIdx && userBranches.includes(b))) ||
    (HYEONG_SELF.includes(todayBranchIdx) && userBranches.includes(todayBranchIdx));

  const hasPa = PA_PAIRS.some(
    ([a, b]) =>
      (todayBranchIdx === a && userBranches.includes(b)) ||
      (todayBranchIdx === b && userBranches.includes(a)),
  );
  const hasHae = HAE_PAIRS.some(
    ([a, b]) =>
      (todayBranchIdx === a && userBranches.includes(b)) ||
      (todayBranchIdx === b && userBranches.includes(a)),
  );

  if (hasHyeong) {
    delta -= 3;
    signals.push({
      weight: -3,
      note: "오늘은 부딪히며 다듬어지는 기운이에요. 마찰이 있어도 그만큼 단단해지니, 욱하지 말고 차분히 풀면 돼요.",
    });
  } else if (hasPa) {
    delta -= 2;
    signals.push({
      weight: -2,
      note: "오늘은 계획이 살짝 틀어지기 쉬운 기운이에요. 빈틈을 한 번 더 점검하면 매끄럽게 넘어가요.",
    });
  } else if (hasHae) {
    delta -= 2;
    signals.push({
      weight: -2,
      note: "오늘은 사소한 방해나 신경 쓰임이 끼기 쉬운 기운이에요. 작은 일에 너무 휘둘리지 않는 게 좋아요.",
    });
  }

  return { delta, signals, flags };
}
