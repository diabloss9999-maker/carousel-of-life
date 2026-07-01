/**
 * 운의 시간 다층(大運·歲運·月運) — 정확도의 "배경 틸트".
 *
 * 일진(日辰)이 "오늘 하루"의 결이라면, 이 모듈은 그 하루가 놓인 더 큰 시간의 결을
 * 계산한다:
 *  1) 대운(大運): 10년 단위 인생의 큰 흐름 (양남음녀 순행/역행 — lunar-typescript 가
 *     절기 기반 대운수까지 정확히 처리)
 *  2) 세운(歲運): 올해의 흐름 (입춘 기준 년주)
 *  3) 월운(月運): 이달의 흐름 (절기 기준 월주)
 *
 * 각 층이 일간(日干)에게 어떤 십성 기운을 흘리는지 + 그 기운이 용신(강약 기반)에
 * 맞는지를 판정해서, 오늘의 점수에 "지금 시기" 배경값을 더하고 AI 풀이에
 * "올해·이달·요즘 큰 흐름" 맥락을 쉬운 한국어로 주입한다. 전부 결정론적.
 */
import "server-only";

import { Solar } from "lunar-typescript";

import type { Profile } from "@/db/schema";
import { getBirthEightChar } from "@/lib/saju/calculate";
import {
  analyzeNatal,
  tenGodForStem,
  tenGodGroup,
  TEN_GOD_GROUP_MEANING,
  type NatalPillars,
  type StrengthLabel,
  type TenGodGroup,
} from "@/lib/saju/ten-gods";

/** 분석 신호 한 건 — daily-manse 의 signals 와 동일한 모양. */
export interface CycleSignal {
  note: string;
  weight: number;
}

/** 지지 충(冲) 쌍 — 한자 기준. (대운/세운 지지 vs 일지 판정용 최소 집합) */
const CHUNG_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ["子", "午"],
  ["丑", "未"],
  ["寅", "申"],
  ["卯", "酉"],
  ["辰", "戌"],
  ["巳", "亥"],
];

/** 지지 육합(六合) 쌍 — 한자 기준. */
const YUKHAP_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ["子", "丑"],
  ["寅", "亥"],
  ["卯", "戌"],
  ["辰", "酉"],
  ["巳", "申"],
  ["午", "未"],
];

function isPair(
  pairs: ReadonlyArray<readonly [string, string]>,
  a: string,
  b: string,
): boolean {
  return pairs.some(
    ([x, y]) => (a === x && b === y) || (a === y && b === x),
  );
}

/** sajuPillars(jsonb) → NatalPillars. */
function toNatalPillars(raw: unknown): NatalPillars | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as {
    year?: { stem?: string; branch?: string };
    month?: { stem?: string; branch?: string };
    day?: { stem?: string; branch?: string };
    hour?: { stem?: string; branch?: string } | null;
  };
  const norm = (
    x: { stem?: string; branch?: string } | null | undefined,
  ): { stem: string; branch: string } | null =>
    x?.stem && x?.branch ? { stem: x.stem, branch: x.branch } : null;
  return {
    year: norm(p.year),
    month: norm(p.month),
    day: norm(p.day),
    hour: norm(p.hour),
  };
}

/** "male"|"female"|"other" → lunar-typescript gender(1=남,0=여). other 는 null(대운 생략). */
function genderToNum(gender: string | null | undefined): 0 | 1 | null {
  if (gender === "male") return 1;
  if (gender === "female") return 0;
  return null;
}

/**
 * 일간 강약 → 어떤 십성 그룹이 도움(용신)/부담인지.
 * day-precision 의 yongsinDirection 과 동일한 명리 규칙.
 */
function favorability(
  strength: StrengthLabel,
  grp: TenGodGroup,
): "favor" | "against" | "neutral" {
  if (strength === "신강") {
    if (grp === "식상" || grp === "재성" || grp === "관성") return "favor";
    if (grp === "비겁" || grp === "인성") return "against";
    return "neutral";
  }
  if (strength === "신약") {
    if (grp === "인성" || grp === "비겁") return "favor";
    return "against";
  }
  return "neutral"; // 중화
}

interface PeriodPillar {
  stem: string;
  branch: string;
}

/** 한 시간층(대운/세운/월운)을 일간 대비 평가해 신호로 변환. */
function evalPeriod(opts: {
  pillar: PeriodPillar;
  scale: "대운" | "세운" | "월운";
  dayMaster: string;
  dayBranch: string | null;
  strength: StrengthLabel;
}): CycleSignal[] {
  const { pillar, scale, dayMaster, dayBranch, strength } = opts;
  const out: CycleSignal[] = [];

  // 시간대 표현 — 노트가 "오늘"로 오인되지 않도록 명시적 시간 어휘를 쓴다.
  const when =
    scale === "대운" ? "요즘 몇 년의 큰 흐름은" : scale === "세운" ? "올해는" : "이달은";

  // 층별 가중치 스케일 — 큰 흐름일수록 배경에 깔리는 무게가 크다.
  const favorWeight = scale === "대운" ? 3 : scale === "세운" ? 2 : 1;

  // 1) 천간 십성 — 이 시기에 어떤 영역의 기운이 도는지 + 용신 적합도.
  const god = tenGodForStem(dayMaster, pillar.stem);
  if (god) {
    const grp = tenGodGroup(god);
    const fav = favorability(strength, grp);
    const meaning = TEN_GOD_GROUP_MEANING[grp];
    if (fav === "favor") {
      out.push({
        weight: favorWeight,
        note: `${when} ${meaning} 쪽 기운이 네 결에 힘이 되어주는 시기예요. 이 방향으로 움직이면 받쳐주는 흐름이 있어요.`,
      });
    } else if (fav === "against") {
      out.push({
        weight: -favorWeight,
        note: `${when} ${meaning} 쪽 기운이 다소 과하게 들어오는 시기예요. 욕심내기보다 균형을 챙기며 가는 편이 좋아요.`,
      });
    } else {
      out.push({
        weight: 0,
        note: `${when} ${meaning} 쪽 기운이 도는 시기예요.`,
      });
    }
  }

  // 2) 지지 vs 일지 — 충(변동)·육합(안정). 대운·세운만 (월운은 변동 폭이 작아 생략).
  if (dayBranch && scale !== "월운") {
    if (isPair(CHUNG_PAIRS, pillar.branch, dayBranch)) {
      out.push({
        weight: scale === "대운" ? -2 : -1,
        note: `${when} 네 중심 자리를 흔드는 변동의 기운이 함께 있어요. 큰 변화나 이동이 생기기 쉬우니, 중요한 결정은 한 번 더 살피면 좋아요.`,
      });
    } else if (isPair(YUKHAP_PAIRS, pillar.branch, dayBranch)) {
      out.push({
        weight: scale === "대운" ? 1 : 1,
        note: `${when} 네 중심 자리와 부드럽게 맞물리는 기운이 있어요. 관계와 일이 자연스럽게 풀리는 안정된 시기예요.`,
      });
    }
  }

  return out;
}

export interface LuckCycles {
  /** daily-manse 에 합쳐질 신호(노트 + 가중치). */
  signals: CycleSignal[];
  /** 현재 대운이 잡혔는지(성별 미상이면 false). */
  hasDaeun: boolean;
}

/**
 * 오늘이 놓인 대운·세운·월운을 계산해 일일 운세용 신호로 반환한다.
 * 사주/생년월일이 부족하면 빈 신호.
 */
export function getCurrentLuckCycles(
  profile: Profile,
  fortuneDate: string,
): LuckCycles {
  const empty: LuckCycles = { signals: [], hasDaeun: false };

  const natalPillars = toNatalPillars(profile.sajuPillars);
  const dayMaster = natalPillars?.day?.stem ?? null;
  if (!natalPillars || !dayMaster) return empty;

  const natal = analyzeNatal(natalPillars);
  if (!natal) return empty;
  const strength = natal.strength;
  const dayBranch = natalPillars.day?.branch ?? null;

  const signals: CycleSignal[] = [];

  // ── 세운·월운 — 운세 날짜의 년주/월주(입춘·절기 경계 자동 처리) ──
  const [fy, fm, fd] = fortuneDate.split("-").map((v) => parseInt(v, 10));
  if (Number.isFinite(fy) && Number.isFinite(fm) && Number.isFinite(fd)) {
    const fEc = Solar.fromYmdHms(fy, fm, fd, 12, 0, 0).getLunar().getEightChar();
    signals.push(
      ...evalPeriod({
        pillar: { stem: fEc.getYearGan(), branch: fEc.getYearZhi() },
        scale: "세운",
        dayMaster,
        dayBranch,
        strength,
      }),
      ...evalPeriod({
        pillar: { stem: fEc.getMonthGan(), branch: fEc.getMonthZhi() },
        scale: "월운",
        dayMaster,
        dayBranch,
        strength,
      }),
    );
  }

  // ── 대운 — 출생 기준 + 성별(양남음녀 순행/역행) ──
  const daeun = currentDaeunPillar(profile, fy);
  if (daeun) {
    signals.push(
      ...evalPeriod({
        pillar: daeun,
        scale: "대운",
        dayMaster,
        dayBranch,
        strength,
      }),
    );
  }

  return { signals, hasDaeun: daeun !== null };
}

/** 지정 연도에 해당하는 현재 대운의 천간/지지(한자). 성별 미상·실패 시 null. */
function currentDaeunPillar(
  profile: Profile,
  fy: number,
): { stem: string; branch: string } | null {
  const genderNum = genderToNum(profile.gender);
  if (genderNum === null || !Number.isFinite(fy)) return null;
  try {
    const { ec } = getBirthEightChar(profile);
    const current = ec
      .getYun(genderNum, 1)
      .getDaYun(9)
      .find((d) => {
        const gz = d.getGanZhi();
        return gz.length >= 2 && d.getStartYear() <= fy && fy <= d.getEndYear();
      });
    if (!current) return null;
    const gz = current.getGanZhi();
    return { stem: gz.charAt(0), branch: gz.charAt(1) };
  } catch {
    return null;
  }
}

export interface PeriodFlow {
  /** 이 기간의 십성 그룹(테마·점수 분기용). */
  group: TenGodGroup;
  /** 그룹의 쉬운말 의미. */
  groupMeaning: string;
  /** 용신 적합도. */
  favor: "favor" | "against" | "neutral";
  /** 기간 지지 vs 일지 — 합(조화)·충(변동)·없음. */
  branch: "harmony" | "clash" | "none";
  /** 현재 대운 그룹의 쉬운말 의미 | null. */
  daeunMeaning: string | null;
}

/**
 * 월간/연간 운세용 — 이달(월운) 또는 올해(세운)의 흐름을 일간 대비 분석한다.
 * 십성 그룹 + 용신 적합도 + 일지 합충 + 현재 대운 배경. 사주 없으면 null.
 */
export function getPeriodFlow(
  profile: Profile,
  scope: "month" | "year",
  fortuneDate: string,
): PeriodFlow | null {
  const natalPillars = toNatalPillars(profile.sajuPillars);
  const dayMaster = natalPillars?.day?.stem ?? null;
  if (!natalPillars || !dayMaster) return null;

  const natal = analyzeNatal(natalPillars);
  if (!natal) return null;
  const dayBranch = natalPillars.day?.branch ?? null;

  const [fy, fm, fd] = fortuneDate.split("-").map((v) => parseInt(v, 10));
  if (![fy, fm, fd].every(Number.isFinite)) return null;
  const ec = Solar.fromYmdHms(fy, fm, fd, 12, 0, 0).getLunar().getEightChar();

  const stem = scope === "year" ? ec.getYearGan() : ec.getMonthGan();
  const periodBranch = scope === "year" ? ec.getYearZhi() : ec.getMonthZhi();

  const god = tenGodForStem(dayMaster, stem);
  if (!god) return null;
  const group = tenGodGroup(god);

  let branch: PeriodFlow["branch"] = "none";
  if (dayBranch) {
    if (isPair(YUKHAP_PAIRS, periodBranch, dayBranch)) branch = "harmony";
    else if (isPair(CHUNG_PAIRS, periodBranch, dayBranch)) branch = "clash";
  }

  const daeun = currentDaeunPillar(profile, fy);
  let daeunMeaning: string | null = null;
  if (daeun) {
    const dGod = tenGodForStem(dayMaster, daeun.stem);
    if (dGod) daeunMeaning = TEN_GOD_GROUP_MEANING[tenGodGroup(dGod)];
  }

  return {
    group,
    groupMeaning: TEN_GOD_GROUP_MEANING[group],
    favor: favorability(natal.strength, group),
    branch,
    daeunMeaning,
  };
}

/**
 * /saju 심층 풀이용 — 인생 전체 대운 타임라인을 쉬운 한국어 블록으로 빌드.
 * lifeFlow(인생 큰 흐름) 풀이가 지어내는 대신 실제 대운 순서를 기반으로 쓰도록.
 * 성별 미상이거나 사주가 없으면 null.
 */
export function buildDaeunTimelineBlock(profile: Profile): string | null {
  const natalPillars = toNatalPillars(profile.sajuPillars);
  const dayMaster = natalPillars?.day?.stem ?? null;
  if (!natalPillars || !dayMaster) return null;

  const natal = analyzeNatal(natalPillars);
  if (!natal) return null;

  const genderNum = genderToNum(profile.gender);
  if (genderNum === null) return null;

  let daYunList;
  try {
    const { ec } = getBirthEightChar(profile);
    daYunList = ec.getYun(genderNum, 1).getDaYun(9);
  } catch {
    return null;
  }

  const lines: string[] = [];
  for (const d of daYunList) {
    const gz = d.getGanZhi();
    if (gz.length < 2) continue; // 출생~첫 대운(빈 간지) 건너뜀.
    const god = tenGodForStem(dayMaster, gz.charAt(0));
    if (!god) continue;
    const grp = tenGodGroup(god);
    const fav = favorability(natal.strength, grp);
    const favKo =
      fav === "favor"
        ? "(힘이 실리는 시기)"
        : fav === "against"
          ? "(균형을 챙길 시기)"
          : "";
    lines.push(
      `- 약 ${d.getStartAge()}~${d.getEndAge()}세: ${TEN_GOD_GROUP_MEANING[grp]} 쪽 기운이 도는 흐름 ${favKo}`.trim(),
    );
  }

  if (lines.length === 0) return null;

  return [
    "[인생 대운 흐름 — 이미 정확히 계산된 10년 단위 큰 흐름. 추측·재계산 금지. lifeFlow(인생 큰 흐름) 풀이를 이 순서에 맞춰 쓰되, 본문에는 사주 용어·나이 표를 그대로 베끼지 말고 '어린 시절 / 20대 / 지금 시기 / 앞으로' 식의 쉬운 시기 언어로 자연스럽게 녹여라]",
    ...lines,
  ].join("\n");
}
