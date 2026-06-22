/**
 * 사주팔자 계산 — 결정론적 알고리즘 + DB 캐시.
 *
 * lunar-typescript 라이브러리로 양력↔음력 변환과 24절기 기반
 * 60갑자 순환을 정확하게 계산한다. 이전엔 AI(Claude Haiku)에 위임했으나
 * 결정론적이지 않아 정확도가 흔들렸음 — 알고리즘 기반으로 교체.
 *
 * 규칙:
 * - 양력 입력: 그대로 Solar 객체로 변환
 * - 음력 입력: Lunar 객체로 변환 후 양력 보정
 * - 입춘(立春) 기준 년주, 절기 기반 월주, 60갑자 순환 일주, 일간×시진 시주
 * - 시각이 비어 있으면 시주(hour)는 null
 * - 오행 분포: 천간 4(또는 3) + 지지 4(또는 3) 합 = 8 또는 6
 */
import "server-only";

import { eq } from "drizzle-orm";
import { Solar, Lunar, type EightChar } from "lunar-typescript";

import { db } from "@/db";
import { profiles, type Profile } from "@/db/schema";

export interface SajuOutput {
  pillars: {
    year: { stem: string; branch: string };
    month: { stem: string; branch: string };
    day: { stem: string; branch: string };
    hour: { stem: string; branch: string } | null;
  };
  fiveElements: {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
}

/** 천간(天干) → 오행 매핑. */
const STEM_TO_ELEMENT: Record<string, keyof SajuOutput["fiveElements"]> = {
  甲: "wood",  乙: "wood",
  丙: "fire",  丁: "fire",
  戊: "earth", 己: "earth",
  庚: "metal", 辛: "metal",
  壬: "water", 癸: "water",
};

/** 지지(地支) → 오행 매핑. */
const BRANCH_TO_ELEMENT: Record<string, keyof SajuOutput["fiveElements"]> = {
  寅: "wood",  卯: "wood",
  巳: "fire",  午: "fire",
  辰: "earth", 戌: "earth", 丑: "earth", 未: "earth",
  申: "metal", 酉: "metal",
  亥: "water", 子: "water",
};

/** "YYYY-MM-DD" → [year, month, day]. */
function parseDate(birthDate: string): [number, number, number] {
  const [y, m, d] = birthDate.split("-").map((v) => parseInt(v, 10));
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    throw new Error(`Invalid birthDate: ${birthDate}`);
  }
  return [y, m, d];
}

/** "HH:MM" → [hour, minute]. 미지정 시 null. */
function parseTime(birthTime: string | null): [number, number] | null {
  if (!birthTime) return null;
  const [h, mn] = birthTime.split(":").map((v) => parseInt(v, 10));
  if (!Number.isFinite(h) || !Number.isFinite(mn)) return null;
  return [h, mn];
}

/** 출생 차트 — EightChar(8글자) + 보조 Lunar + 시각 입력 여부. */
export interface BirthChart {
  /** lunar-typescript EightChar — 년·월·일·시주 간지 추출용. */
  ec: EightChar;
  /** 보조 Lunar 객체 — 대운(getYun) 등 추가 계산용. */
  lunar: Lunar;
  /** birthTime 이 지정되어 시주가 유효한지. */
  hasTime: boolean;
}

/**
 * 생년월일시 + 양/음력으로 출생 EightChar 를 구성한다.
 *
 * calculateSaju(원국)·luck-cycles(대운/세운/월운)가 공유하는 단일 진입점.
 * - calendarSystem === "lunar": Lunar 입력 → 양력 보정
 * - 그 외: Solar 입력
 * - 시각이 없으면 정오 12:00 으로 잡아 일주 날짜 경계를 안정화(시주는 별도 null 처리)
 */
export function getBirthEightChar(
  profile: Pick<Profile, "birthDate" | "birthTime" | "calendarSystem">,
): BirthChart {
  const [year, month, day] = parseDate(profile.birthDate);
  const time = parseTime(profile.birthTime);
  const isLunar = profile.calendarSystem === "lunar";

  const hour = time ? time[0] : 12;
  const minute = time ? time[1] : 0;

  let solar;
  if (isLunar) {
    const lunar = time
      ? Lunar.fromYmdHms(year, month, day, hour, minute, 0)
      : Lunar.fromYmd(year, month, day);
    solar = lunar.getSolar();
  } else {
    solar = time
      ? Solar.fromYmdHms(year, month, day, hour, minute, 0)
      : Solar.fromYmd(year, month, day);
  }

  const lunar = solar.getLunar();
  return { ec: lunar.getEightChar(), lunar, hasTime: !!time };
}

/**
 * 사주팔자 결정론적 계산.
 *
 * - calendarSystem === "lunar": Lunar 입력으로 처리
 * - 그 외 (solar / unknown): Solar 입력으로 처리
 * - birthTime 없으면 시주 null + 6글자 기준 오행
 */
export function calculateSaju(
  profile: Pick<
    Profile,
    "birthDate" | "birthTime" | "calendarSystem"
  >,
): SajuOutput {
  // EightChar — 자동으로 입춘 기준 년주, 절기 기반 월주, 60갑자 일주 처리
  const { ec, hasTime: time } = getBirthEightChar(profile);

  const yearStem  = ec.getYearGan();
  const yearBr    = ec.getYearZhi();
  const monthStem = ec.getMonthGan();
  const monthBr   = ec.getMonthZhi();
  const dayStem   = ec.getDayGan();
  const dayBr     = ec.getDayZhi();

  // 시주는 birthTime 있을 때만 포함
  let hourPillar: { stem: string; branch: string } | null = null;
  if (time) {
    hourPillar = {
      stem: ec.getTimeGan(),
      branch: ec.getTimeZhi(),
    };
  }

  // 5) 오행 분포 계산
  const fiveElements = {
    wood: 0, fire: 0, earth: 0, metal: 0, water: 0,
  } as SajuOutput["fiveElements"];

  const stems = [yearStem, monthStem, dayStem];
  const branches = [yearBr, monthBr, dayBr];
  if (hourPillar) {
    stems.push(hourPillar.stem);
    branches.push(hourPillar.branch);
  }

  for (const s of stems) {
    const el = STEM_TO_ELEMENT[s];
    if (el) fiveElements[el] += 1;
  }
  for (const b of branches) {
    const el = BRANCH_TO_ELEMENT[b];
    if (el) fiveElements[el] += 1;
  }

  return {
    pillars: {
      year:  { stem: yearStem,  branch: yearBr },
      month: { stem: monthStem, branch: monthBr },
      day:   { stem: dayStem,   branch: dayBr },
      hour:  hourPillar,
    },
    fiveElements,
  };
}

/**
 * profile 에 사주가 캐시되어 있으면 그대로 반환,
 * 없으면 계산 + DB 저장 후 반환.
 *
 * 계산은 결정론적이라 cache miss 시 즉시(동기) 계산되지만,
 * DB 쓰기 일관성을 위해 async 시그니처 유지.
 */
export async function ensureSajuCalculated(profile: Profile): Promise<Profile> {
  if (profile.sajuPillars && profile.fiveElements) {
    return profile;
  }

  const saju = calculateSaju(profile);

  const [updated] = await db
    .update(profiles)
    .set({
      sajuPillars: saju.pillars,
      fiveElements: saju.fiveElements,
    })
    .where(eq(profiles.userId, profile.userId))
    .returning();

  return (
    updated ?? {
      ...profile,
      sajuPillars: saju.pillars,
      fiveElements: saju.fiveElements,
    }
  );
}
