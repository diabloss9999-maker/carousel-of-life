/**
 * 십성(十星) · 일간 강약 · 용신 · 원국 충형합 — 명리 정밀 분석 엔진.
 *
 * LLM 은 사주 계산을 신뢰성 있게 못 하므로(특히 십성·강약 판단), 전부
 * 결정론적으로 계산해서 프롬프트에 주입한다. 모든 값은 검증된 명리 규칙 기반.
 *
 * - 십성: 일간 대비 다른 글자의 오행 생극 + 음양으로 10종 판정
 * - 지지 십성: 지장간 정기(主氣)로 판정 (子→癸, 午→丁 등 정통 방식)
 * - 강약: 월령·통근·생조를 위치 가중치로 점수화 → 신강/중화/신약 추정
 * - 용신: 강약에서 도출한 "도움이 되는 기운" 방향
 * - 원국 관계: 4지지 사이의 충·형·삼합·육합
 */
import { STEMS, type ElementKey, type Polarity } from "@/lib/saju/meanings";

export type TenGod =
  | "비견"
  | "겁재"
  | "식신"
  | "상관"
  | "편재"
  | "정재"
  | "편관"
  | "정관"
  | "편인"
  | "정인";

export type TenGodGroup = "비겁" | "식상" | "재성" | "관성" | "인성";

/** 오행 상생: key 가 value 를 생(生)한다. */
const GENERATES: Record<ElementKey, ElementKey> = {
  wood: "fire",
  fire: "earth",
  earth: "metal",
  metal: "water",
  water: "wood",
};

/** 오행 상극: key 가 value 를 극(剋)한다. */
const CONTROLS: Record<ElementKey, ElementKey> = {
  wood: "earth",
  earth: "water",
  water: "fire",
  fire: "metal",
  metal: "wood",
};

/** 지지 → 지장간 정기(主氣) 천간. 지지 십성 판정의 정통 기준. */
const BRANCH_MAIN_QI: Record<string, string> = {
  子: "癸",
  丑: "己",
  寅: "甲",
  卯: "乙",
  辰: "戊",
  巳: "丙",
  午: "丁",
  未: "己",
  申: "庚",
  酉: "辛",
  戌: "戊",
  亥: "壬",
};

/** 십성 → 그룹. */
export function tenGodGroup(g: TenGod): TenGodGroup {
  switch (g) {
    case "비견":
    case "겁재":
      return "비겁";
    case "식신":
    case "상관":
      return "식상";
    case "편재":
    case "정재":
      return "재성";
    case "편관":
    case "정관":
      return "관성";
    case "편인":
    case "정인":
      return "인성";
  }
}

/** 십성 그룹별 쉬운 한국어 의미 — 본문은 용어 없이 이 결을 녹인다. */
export const TEN_GOD_GROUP_MEANING: Record<TenGodGroup, string> = {
  비겁: "자기 주관·독립심·경쟁심·동료와의 관계",
  식상: "표현력·창의력·재능을 밖으로 펼치는 활동성",
  재성: "현실 감각·재물·성취·꼼꼼한 관리",
  관성: "책임감·자기 절제·규율·사회적 역할",
  인성: "배움·생각의 깊이·받쳐주는 도움·안정과 휴식",
};

/** 일간(천간) 대비 대상 천간의 십성 판정. */
function tenGodOf(
  dayEl: ElementKey,
  dayPol: Polarity,
  tEl: ElementKey,
  tPol: Polarity,
): TenGod {
  const same = tPol === dayPol;
  let group: TenGodGroup;
  if (tEl === dayEl) group = "비겁";
  else if (GENERATES[dayEl] === tEl) group = "식상"; // 일간이 생함
  else if (CONTROLS[dayEl] === tEl) group = "재성"; // 일간이 극함
  else if (CONTROLS[tEl] === dayEl) group = "관성"; // 대상이 일간을 극함
  else group = "인성"; // 대상이 일간을 생함

  switch (group) {
    case "비겁":
      return same ? "비견" : "겁재";
    case "식상":
      return same ? "식신" : "상관";
    case "재성":
      return same ? "편재" : "정재";
    case "관성":
      return same ? "편관" : "정관";
    case "인성":
      return same ? "편인" : "정인";
  }
}

/** 일간 천간(한자) 기준, 대상 천간(한자)의 십성. 알 수 없으면 null. */
export function tenGodForStem(
  dayMaster: string,
  targetStem: string,
): TenGod | null {
  const d = STEMS[dayMaster];
  const t = STEMS[targetStem];
  if (!d || !t) return null;
  return tenGodOf(d.element, d.polarity, t.element, t.polarity);
}

/** 일간 천간(한자) 기준, 대상 지지(한자)의 십성 — 지장간 정기로 판정. */
export function tenGodForBranch(
  dayMaster: string,
  targetBranch: string,
): TenGod | null {
  const mainQi = BRANCH_MAIN_QI[targetBranch];
  if (!mainQi) return null;
  return tenGodForStem(dayMaster, mainQi);
}

// =============================================================================
// 원국(原局) 지지 관계 — 충·형·삼합·육합
// =============================================================================

const CHUNG_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ["子", "午"],
  ["丑", "未"],
  ["寅", "申"],
  ["卯", "酉"],
  ["辰", "戌"],
  ["巳", "亥"],
];

const YUKHAP_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ["子", "丑"],
  ["寅", "亥"],
  ["卯", "戌"],
  ["辰", "酉"],
  ["巳", "申"],
  ["午", "未"],
];

const SAMHAP_GROUPS: ReadonlyArray<readonly [string, string, string]> = [
  ["寅", "午", "戌"],
  ["亥", "卯", "未"],
  ["申", "子", "辰"],
  ["巳", "酉", "丑"],
];

/** 삼형(三刑)·자형(自刑)·상형(相刑). */
const HYEONG_TRIOS: ReadonlyArray<readonly string[]> = [
  ["寅", "巳", "申"],
  ["丑", "戌", "未"],
];
const HYEONG_SELF = ["辰", "午", "酉", "亥"]; // 자형
const HYEONG_PAIR: ReadonlyArray<readonly [string, string]> = [["子", "卯"]]; // 상형

function hasBoth(branches: string[], a: string, b: string): boolean {
  return branches.includes(a) && branches.includes(b);
}

/** 원국 4지지 사이의 충·형·삼합·육합을 쉬운 한국어로 반환. */
export function natalBranchRelations(branches: string[]): string[] {
  const out: string[] = [];
  const uniq = branches.filter((b) => !!b);

  for (const [a, b] of CHUNG_PAIRS) {
    if (hasBoth(uniq, a, b)) {
      out.push(
        "사주 안에 정면으로 부딪히는 두 기운이 있어요. 안에 긴장·변동의 동력이 있고, 한 자리에 오래 머물기보다 움직임이 많은 결이에요.",
      );
    }
  }
  for (const trio of SAMHAP_GROUPS) {
    if (trio.every((b) => uniq.includes(b))) {
      out.push(
        "사주 안에서 세 기운이 하나로 강하게 뭉쳐요. 한 방향으로 힘이 크게 쏠리는, 추진력 있는 결이에요.",
      );
    }
  }
  for (const [a, b] of YUKHAP_PAIRS) {
    if (hasBoth(uniq, a, b)) {
      out.push(
        "사주 안에 부드럽게 맞물리는 두 기운이 있어요. 관계와 조화를 자연스럽게 만들어내는 결이에요.",
      );
    }
  }
  for (const trio of HYEONG_TRIOS) {
    const present = trio.filter((b) => uniq.includes(b));
    if (present.length >= 2) {
      out.push(
        "사주 안에 서로 깎고 다듬는 기운이 있어요. 과정에서 마찰이 있지만 그만큼 단련되고 전문성으로 여무는 결이에요.",
      );
      break;
    }
  }
  for (const b of HYEONG_SELF) {
    if (uniq.filter((x) => x === b).length >= 2) {
      out.push(
        "같은 기운이 겹쳐 스스로를 다그치는 결이 있어요. 자기 안에서 답을 찾으려는 힘이 강해요.",
      );
      break;
    }
  }
  for (const [a, b] of HYEONG_PAIR) {
    if (hasBoth(uniq, a, b)) {
      out.push(
        "예의·관계의 결을 시험받는 기운이 있어요. 사람 사이 거리 조절이 중요한 결이에요.",
      );
    }
  }
  return out;
}

// =============================================================================
// 원국 신살(神煞) + 십이운성(十二運星)
// =============================================================================

/** 지지 순서 — 子0 丑1 寅2 卯3 辰4 巳5 午6 未7 申8 酉9 戌10 亥11. */
const BRANCH_ORDER = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;

/** 천을귀인(天乙貴人) — 일간(천간 한자) → 귀인 지지 한자. */
const CHEONEUL: Record<string, readonly string[]> = {
  甲: ["丑", "未"], 戊: ["丑", "未"], 庚: ["丑", "未"],
  乙: ["子", "申"], 己: ["子", "申"],
  丙: ["亥", "酉"], 丁: ["亥", "酉"],
  辛: ["寅", "午"],
  壬: ["巳", "卯"], 癸: ["巳", "卯"],
};

/** 삼합 국별 도화·역마·화개 지지(한자). */
const SAMHAP_SINSAL: ReadonlyArray<{
  group: readonly string[];
  dohwa: string;
  yeokma: string;
  hwagae: string;
}> = [
  { group: ["寅", "午", "戌"], dohwa: "卯", yeokma: "申", hwagae: "戌" },
  { group: ["亥", "卯", "未"], dohwa: "子", yeokma: "巳", hwagae: "未" },
  { group: ["申", "子", "辰"], dohwa: "酉", yeokma: "寅", hwagae: "辰" },
  { group: ["巳", "酉", "丑"], dohwa: "午", yeokma: "亥", hwagae: "丑" },
];

/** 양인(陽刃) — 양간의 제왕지(가장 센 자리). 음간은 두지 않음. */
const YANGIN: Record<string, string> = {
  甲: "卯", 丙: "午", 戊: "午", 庚: "酉", 壬: "子",
};

/** 괴강(魁罡) 일주 — 강렬·결단의 기운. */
const GOEGANG = new Set(["庚辰", "庚戌", "壬辰", "戊戌"]);

/** 십이운성 단계명 — 장생부터 순서대로. */
const TWELVE_STAGES = [
  "장생", "목욕", "관대", "건록", "제왕", "쇠", "병", "사", "묘", "절", "태", "양",
] as const;
type TwelveStage = (typeof TWELVE_STAGES)[number];

/** 일간 → 장생 지지(한자) + 진행 방향(양간 순행 +1 / 음간 역행 -1). */
const CHANGSAENG: Record<string, { start: string; dir: 1 | -1 }> = {
  甲: { start: "亥", dir: 1 },
  丙: { start: "寅", dir: 1 }, 戊: { start: "寅", dir: 1 },
  庚: { start: "巳", dir: 1 },
  壬: { start: "申", dir: 1 },
  乙: { start: "午", dir: -1 },
  丁: { start: "酉", dir: -1 }, 己: { start: "酉", dir: -1 },
  辛: { start: "子", dir: -1 },
  癸: { start: "卯", dir: -1 },
};

/** 일간이 특정 지지에서 갖는 십이운성 단계. */
function twelveStageOf(dayMaster: string, branch: string): TwelveStage | null {
  const cs = CHANGSAENG[dayMaster];
  const b = BRANCH_ORDER.indexOf(branch as (typeof BRANCH_ORDER)[number]);
  const start = BRANCH_ORDER.indexOf(cs?.start as (typeof BRANCH_ORDER)[number]);
  if (!cs || b < 0 || start < 0) return null;
  const idx = (((b - start) * cs.dir) % 12 + 12) % 12;
  return TWELVE_STAGES[idx];
}

/** 왕성한 단계(기운이 살아 있는 자리). */
const STRONG_STAGES = new Set<TwelveStage>(["장생", "관대", "건록", "제왕"]);
/** 가라앉는 단계(기운이 약한 자리). */
const WEAK_STAGES = new Set<TwelveStage>(["병", "사", "묘", "절"]);

/**
 * 원국 신살 + 십이운성을 쉬운 한국어 노트로 반환한다.
 * 일간·4지지·일주 간지를 기준으로 판정.
 */
function natalSinsalAndStage(pillars: NatalPillars): string[] {
  const out: string[] = [];
  const dm = pillars.day?.stem;
  if (!dm) return out;

  const branches = [
    pillars.year?.branch,
    pillars.month?.branch,
    pillars.day?.branch,
    pillars.hour?.branch,
  ].filter((b): b is string => !!b);

  // ── 천을귀인 — 가장 귀한 도움의 별. ──
  const gwiin = CHEONEUL[dm];
  if (gwiin && branches.some((b) => gwiin.includes(b))) {
    out.push(
      "타고난 복 중에 '귀인의 별'이 있어요. 결정적인 순간에 도와주는 사람이 나타나고, 막힌 일이 사람을 통해 풀리는 결이에요.",
    );
  }

  // ── 도화·역마·화개 — 년지·일지의 삼합 국 기준. ──
  const refs = [pillars.year?.branch, pillars.day?.branch].filter(
    (b): b is string => !!b,
  );
  let dohwa = false;
  let yeokma = false;
  let hwagae = false;
  for (const ref of refs) {
    const set = SAMHAP_SINSAL.find((s) => s.group.includes(ref));
    if (!set) continue;
    if (branches.includes(set.dohwa)) dohwa = true;
    if (branches.includes(set.yeokma)) yeokma = true;
    if (branches.includes(set.hwagae)) hwagae = true;
  }
  if (dohwa) {
    out.push(
      "사람을 끄는 매력의 결이 타고나 있어요. 시선을 받고 분위기를 살리는 힘이 있어, 사람을 상대하는 자리에서 빛이 나요.",
    );
  }
  if (yeokma) {
    out.push(
      "한자리에 머물기보다 움직이고 넓혀가는 결이 있어요. 이동·여행·새 환경에서 기회가 열리는 편이에요.",
    );
  }
  if (hwagae) {
    out.push(
      "혼자만의 깊이를 파고드는 결이 있어요. 예술·연구·정신적인 영역에 끌리고, 고독을 창작으로 바꾸는 힘이 있어요.",
    );
  }

  // ── 양인 — 강렬한 추진력의 양날. ──
  const yangin = YANGIN[dm];
  if (yangin && branches.includes(yangin)) {
    out.push(
      "안에 아주 강한 추진력이 있어요. 밀어붙이는 힘이 남다른 대신, 그 힘을 거칠게 쓰지 않도록 조절하는 게 중요한 결이에요.",
    );
  }

  // ── 괴강 — 일주 자체의 카리스마. ──
  if (pillars.day?.branch && GOEGANG.has(`${dm}${pillars.day.branch}`)) {
    out.push(
      "보통과 다른 강단·카리스마의 결을 타고났어요. 한번 정하면 끝까지 가는 힘이 있어, 극단을 오가되 큰일을 해내는 사람이에요.",
    );
  }

  // ── 십이운성 — 일간이 '자기 자리'(일지)에서 얼마나 생기 있는지. ──
  if (pillars.day?.branch) {
    const stage = twelveStageOf(dm, pillars.day.branch);
    if (stage && STRONG_STAGES.has(stage)) {
      out.push(
        "타고난 기운이 자기 자리에 단단히 뿌리내려 있어요. 속에 힘이 꽉 차 있어, 스스로를 믿고 밀고 나가는 자신감이 있는 결이에요.",
      );
    } else if (stage && WEAK_STAGES.has(stage)) {
      out.push(
        "타고난 기운이 자기 자리에선 조용히 가라앉아 있는 편이에요. 겉으로 세게 드러내기보다 안에서 깊이 무르익는, 섬세하고 사려 깊은 결이에요.",
      );
    }
  }

  return out;
}

/**
 * 격국(格局) — 월지(月支) 정기 십성으로 잡는 사주의 큰 구조.
 * "이 사람은 어떤 방식으로 세상과 만나는가"의 정체성 한 줄.
 * (잡기월 투출까지 따지는 정밀 격국이 아닌, 월지 정기 기준의 표준 간이 판정)
 */
const GYEOKGUK_BY_GOD: Record<TenGod, { name: string; note: string }> = {
  정관: {
    name: "정관격",
    note: "원칙과 책임을 지켜 신뢰로 자리를 쌓아가는 사람. 반듯함과 절제가 무기가 되는 결.",
  },
  편관: {
    name: "편관격",
    note: "압박과 위기를 정면으로 뚫고 나가는 추진력의 사람. 큰일·승부에서 진가가 나오는 결.",
  },
  정인: {
    name: "정인격",
    note: "배움과 받쳐주는 도움으로 깊이를 쌓는 사람. 차분히 무르익어 신뢰받는 결.",
  },
  편인: {
    name: "편인격",
    note: "남다른 관점과 직관으로 한 분야를 파고드는 사람. 전문성·독창성으로 빛나는 결.",
  },
  정재: {
    name: "정재격",
    note: "성실하게 현실을 다져 차곡차곡 모아가는 사람. 꼼꼼함과 신용이 자산이 되는 결.",
  },
  편재: {
    name: "편재격",
    note: "큰 흐름을 읽고 기회를 잡아 넓게 굴리는 수완의 사람. 사람과 돈을 시원하게 다루는 결.",
  },
  식신: {
    name: "식신격",
    note: "타고난 재능을 편안하고 꾸준하게 펼치며 즐기는 사람. 한 우물을 깊게 파는 결.",
  },
  상관: {
    name: "상관격",
    note: "톡톡 튀는 표현력과 재주로 판을 새로 짜는 사람. 틀을 깨고 보여주는 데 강한 결.",
  },
  비견: {
    name: "건록격",
    note: "스스로의 힘으로 자립해 자기 자리를 만들어가는 사람. 독립심과 뚝심이 단단한 결.",
  },
  겁재: {
    name: "양인격",
    note: "강한 승부욕과 추진력으로 정면 돌파하는 사람. 거센 힘을 잘 다스리면 크게 되는 결.",
  },
};

/** 월지 정기 십성으로 격국을 판정. 월지가 없으면 null. */
function gyeokgukOf(
  dayMaster: string,
  monthBranch: string | undefined,
): { name: string; note: string } | null {
  if (!monthBranch) return null;
  const god = tenGodForBranch(dayMaster, monthBranch);
  if (!god) return null;
  return GYEOKGUK_BY_GOD[god];
}

// =============================================================================
// 일간 강약 + 용신
// =============================================================================

export interface NatalPillars {
  year: { stem: string; branch: string } | null;
  month: { stem: string; branch: string } | null;
  day: { stem: string; branch: string } | null;
  hour: { stem: string; branch: string } | null;
}

export type StrengthLabel = "신강" | "중화" | "신약";

export interface NatalAnalysis {
  /** 일간 한자. */
  dayMaster: string;
  /** 일간 오행(목·화·토·금·수 한글). */
  dayElementKo: string;
  strength: StrengthLabel;
  /** 일간을 돕는 기운 비율(0~1, 추정치). */
  supportRatio: number;
  /** 가장 두드러진 십성 그룹(성격·적성의 중심). */
  dominantGroup: TenGodGroup | null;
  /** 비어 있는(거의 없는) 십성 그룹. */
  lackingGroup: TenGodGroup | null;
  /** 용신 방향 — 도움이 되는 기운(쉬운 한국어). */
  favorableKo: string;
  /** 원국 충형합 설명(쉬운 한국어). */
  natalRelations: string[];
  /** 원국 신살 + 십이운성 설명(쉬운 한국어). */
  sinsal: string[];
  /** 격국(格局) — 사주의 큰 구조 정체성. 월지가 없으면 null. */
  gyeokguk: { name: string; note: string } | null;
}

const ELEMENT_KO: Record<ElementKey, string> = {
  wood: "나무",
  fire: "불",
  earth: "흙",
  metal: "쇠",
  water: "물",
};

/** 위치별 가중치 — 월지(월령)가 가장 강하고 천간보다 지지가 무겁다. */
const POS_WEIGHT = {
  yearStem: 1,
  yearBranch: 1.3,
  monthStem: 1.5,
  monthBranch: 3,
  dayBranch: 2,
  hourStem: 1,
  hourBranch: 1.3,
} as const;

/**
 * 일간 강약 + 십성 분포 + 용신 + 원국 관계를 종합 분석한다.
 * 사주 4기둥이 충분치 않으면 null.
 */
export function analyzeNatal(pillars: NatalPillars): NatalAnalysis | null {
  const dm = pillars.day?.stem;
  const dmMeaning = dm ? STEMS[dm] : null;
  if (!dm || !dmMeaning) return null;

  const dayEl = dmMeaning.element;

  // 십성 분포 집계 (일간 자신 제외).
  const groupCount: Record<TenGodGroup, number> = {
    비겁: 0,
    식상: 0,
    재성: 0,
    관성: 0,
    인성: 0,
  };

  // 강약 점수: 일간을 돕는(비겁·인성) vs 덜어내는(식상·재성·관성).
  let support = 1; // 일간 자신의 뿌리 1점.
  let drain = 0;

  const tally = (
    god: TenGod | null,
    weight: number,
  ): void => {
    if (!god) return;
    const grp = tenGodGroup(god);
    groupCount[grp] += 1;
    if (grp === "비겁" || grp === "인성") support += weight;
    else drain += weight;
  };

  tally(
    pillars.year?.stem ? tenGodForStem(dm, pillars.year.stem) : null,
    POS_WEIGHT.yearStem,
  );
  tally(
    pillars.year?.branch ? tenGodForBranch(dm, pillars.year.branch) : null,
    POS_WEIGHT.yearBranch,
  );
  tally(
    pillars.month?.stem ? tenGodForStem(dm, pillars.month.stem) : null,
    POS_WEIGHT.monthStem,
  );
  tally(
    pillars.month?.branch ? tenGodForBranch(dm, pillars.month.branch) : null,
    POS_WEIGHT.monthBranch,
  );
  // 일지(일간이 앉은 자리).
  tally(
    pillars.day?.branch ? tenGodForBranch(dm, pillars.day.branch) : null,
    POS_WEIGHT.dayBranch,
  );
  tally(
    pillars.hour?.stem ? tenGodForStem(dm, pillars.hour.stem) : null,
    POS_WEIGHT.hourStem,
  );
  tally(
    pillars.hour?.branch ? tenGodForBranch(dm, pillars.hour.branch) : null,
    POS_WEIGHT.hourBranch,
  );

  const total = support + drain;
  const supportRatio = total > 0 ? support / total : 0.5;

  let strength: StrengthLabel;
  if (supportRatio >= 0.5) strength = "신강";
  else if (supportRatio >= 0.38) strength = "중화";
  else strength = "신약";

  // 용신 방향.
  let favorableKo: string;
  if (strength === "신강") {
    favorableKo =
      "타고난 기운이 단단한 편이라, 그 힘을 밖으로 쓰고 덜어내는 결이 도움이 돼요 — 표현하고, 성취를 향해 움직이고, 스스로를 절제하는 방향이 잘 맞아요.";
  } else if (strength === "신약") {
    favorableKo =
      "타고난 기운이 여린 편이라, 채우고 뿌리내리는 결이 도움이 돼요 — 배우고, 충분히 쉬고, 내 편을 곁에 두며 꾸준히 힘을 모으는 방향이 잘 맞아요.";
  } else {
    favorableKo =
      "기운이 비교적 고르게 짜여, 한쪽으로 치우치지 않게 균형을 지키는 게 핵심이에요. 상황에 따라 밀고 당기는 조절이 잘 맞아요.";
  }

  // 두드러진/비어 있는 십성 그룹.
  const entries = (Object.entries(groupCount) as [TenGodGroup, number][]);
  const sorted = [...entries].sort((a, b) => b[1] - a[1]);
  const dominantGroup =
    sorted[0] && sorted[0][1] > 0 ? sorted[0][0] : null;
  const lackingEntry = [...entries].sort((a, b) => a[1] - b[1])[0];
  const lackingGroup =
    lackingEntry && lackingEntry[1] === 0 ? lackingEntry[0] : null;

  const branches = [
    pillars.year?.branch,
    pillars.month?.branch,
    pillars.day?.branch,
    pillars.hour?.branch,
  ].filter((b): b is string => !!b);

  return {
    dayMaster: dm,
    dayElementKo: ELEMENT_KO[dayEl],
    strength,
    supportRatio,
    dominantGroup,
    lackingGroup,
    favorableKo,
    natalRelations: natalBranchRelations(branches),
    sinsal: natalSinsalAndStage(pillars),
    gyeokguk: gyeokgukOf(dm, pillars.month?.branch),
  };
}

/**
 * /saju 심층 풀이용 — 정밀 분석을 프롬프트 내부 블록(쉬운 한국어)으로 빌드.
 * 용어는 내부 참고로만 두고, 본문에선 쉬운 비유로 옮기라고 명시한다.
 */
export function buildNatalAnalysisBlock(a: NatalAnalysis): string {
  const lines: string[] = [
    "[명리 정밀 분석 — 이미 정확히 계산된 결과. 추측·재계산 금지. 이 분석을 풀이의 뼈대로 삼되, 서술 필드 본문에는 사주 용어·한자를 쓰지 말고 전부 쉬운 일상어로 옮겨라]",
    `타고난 기운의 강약: ${a.strength} (일간을 돕는 기운 비율 약 ${Math.round(
      a.supportRatio * 100,
    )}%) — 추정치이니 단정적으로 쓰지 말 것.`,
    `→ 도움이 되는 방향(용신): ${a.favorableKo}`,
  ];
  if (a.gyeokguk) {
    lines.push(
      `사주의 큰 구조(격국): ${a.gyeokguk.name} — ${a.gyeokguk.note} 이 사람 정체성의 큰 틀이니 personality·summary 의 중심으로 삼아라(단, '격국'·'정관격' 같은 용어는 본문에 쓰지 말 것).`,
    );
  }
  if (a.dominantGroup) {
    lines.push(
      `가장 두드러진 결: ${a.dominantGroup} — ${TEN_GOD_GROUP_MEANING[a.dominantGroup]}. 이게 이 사람 성격·적성의 중심축이다. 강점·직업·연애 풀이에 이 결을 반영해라.`,
    );
  }
  if (a.lackingGroup) {
    lines.push(
      `거의 비어 있는 결: ${a.lackingGroup} — ${TEN_GOD_GROUP_MEANING[a.lackingGroup]}. 이 부분이 약하거나 채우고 싶어 하는 지점이다. 주의·보완 풀이에 자연스럽게 녹여라.`,
    );
  }
  if (a.natalRelations.length > 0) {
    lines.push("사주 안의 기운 관계:");
    for (const r of a.natalRelations) lines.push(`- ${r}`);
  }
  if (a.sinsal.length > 0) {
    lines.push(
      "타고난 특별한 결(신살·기운의 단계) — 강점·성격·연애·적성 풀이에 자연스럽게 녹여라:",
    );
    for (const s of a.sinsal) lines.push(`- ${s}`);
  }
  return lines.join("\n");
}
