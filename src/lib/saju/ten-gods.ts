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
  return lines.join("\n");
}
