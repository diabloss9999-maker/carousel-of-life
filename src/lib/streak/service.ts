/**
 * 출석 스트릭 서비스.
 *
 * - 하루 1회 체크인 (KST 기준)
 * - 연속 출석 시 스트릭 증가, 하루라도 빠지면 리셋
 * - 마일스톤 도달 시 보너스 가챠 크레딧 지급
 */
import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { streaks, type Streak } from "@/db/schema";
import { creditReward } from "@/lib/gifts/service";

/** 마일스톤 → 보너스 가챠 횟수 */
const MILESTONES: Record<number, number> = {
  3:  1,
  7:  2,
  14: 2,
  30: 3,
};

/** 매일 출석 별조각 보상. */
const DAILY_STAR_REWARD = 5;
/** 7일 연속마다 추가 별조각 보상. */
const WEEKLY_STAR_REWARD = 50;

/** 30일 초과 이후 매 30일마다 지급되는 보너스 */
const RECURRING_BONUS = 3;
const RECURRING_INTERVAL = 30;

export interface CheckInResult {
  /** 오늘 처음 체크인했는지 (이미 한 경우 false) */
  isNew: boolean;
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  bonusGachaCredits: number;
  /** 이번 체크인으로 받은 보너스 가챠 수 (0이면 마일스톤 없음) */
  milestoneBonus: number;
  /** 스트릭이 리셋됐는지 */
  wasReset: boolean;
  /** 이번 체크인으로 받은 별조각 (매일 +5, 7일 연속마다 +50). */
  starPiecesAwarded: number;
}

/** KST 오늘 날짜 YYYY-MM-DD */
function todayKst(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

/** 날짜 문자열(YYYY-MM-DD) 간 일수 차이 */
function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24),
  );
}

/** 마일스톤 체크 — 이전 스트릭 → 새 스트릭 사이에 해당하는 마일스톤 보너스 합산 */
function calcMilestoneBonus(prev: number, next: number): number {
  let bonus = 0;

  for (const [milestoneStr, reward] of Object.entries(MILESTONES)) {
    const milestone = Number(milestoneStr);
    if (prev < milestone && next >= milestone) {
      bonus += reward;
    }
  }

  // 30일 초과 구간의 recurring 보너스
  if (next > RECURRING_INTERVAL) {
    const prevCycles = Math.floor(prev / RECURRING_INTERVAL);
    const nextCycles = Math.floor(next / RECURRING_INTERVAL);
    if (nextCycles > prevCycles) {
      bonus += (nextCycles - prevCycles) * RECURRING_BONUS;
    }
  }

  return bonus;
}

/**
 * 오늘 출석 체크인을 수행한다.
 * 이미 오늘 체크인했으면 현재 상태만 반환한다.
 */
export async function checkInStreak(userId: string): Promise<CheckInResult> {
  const today = todayKst();

  const [existing] = await db
    .select()
    .from(streaks)
    .where(eq(streaks.userId, userId))
    .limit(1);

  // 오늘 이미 체크인
  if (existing?.lastCheckIn === today) {
    return {
      isNew: false,
      currentStreak: existing.currentStreak,
      longestStreak: existing.longestStreak,
      totalCheckIns: existing.totalCheckIns,
      bonusGachaCredits: existing.bonusGachaCredits,
      milestoneBonus: 0,
      wasReset: false,
      starPiecesAwarded: 0,
    };
  }

  const prevStreak = existing?.currentStreak ?? 0;
  const prevLongest = existing?.longestStreak ?? 0;
  const prevTotal = existing?.totalCheckIns ?? 0;
  const prevBonus = existing?.bonusGachaCredits ?? 0;

  // 연속 여부 판단
  let wasReset = false;
  let newStreak: number;

  if (!existing?.lastCheckIn) {
    newStreak = 1;
  } else {
    const diff = daysBetween(existing.lastCheckIn, today);
    if (diff === 1) {
      newStreak = prevStreak + 1;
    } else {
      newStreak = 1;
      wasReset = true;
    }
  }

  const newLongest = Math.max(newStreak, prevLongest);
  const newTotal = prevTotal + 1;
  const milestoneBonus = calcMilestoneBonus(prevStreak, newStreak);
  const newBonus = prevBonus + milestoneBonus;

  if (!existing) {
    await db.insert(streaks).values({
      userId,
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastCheckIn: today,
      bonusGachaCredits: newBonus,
      totalCheckIns: newTotal,
    });
  } else {
    await db
      .update(streaks)
      .set({
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastCheckIn: today,
        bonusGachaCredits: newBonus,
        totalCheckIns: newTotal,
        updatedAt: new Date(),
      })
      .where(eq(streaks.userId, userId));
  }

  // 출석 별조각 — 매일 +5, 7일 연속마다 +50. refId 로 하루 1회 보장.
  const starPieces =
    DAILY_STAR_REWARD +
    (newStreak > 0 && newStreak % 7 === 0 ? WEEKLY_STAR_REWARD : 0);
  let starPiecesAwarded = 0;
  try {
    const { awarded } = await creditReward(userId, starPieces, `streak-${today}`);
    if (awarded) starPiecesAwarded = starPieces;
  } catch {
    // 보상 지급 실패가 출석 자체를 막지 않도록 무시 (다음 날 다시 시도됨).
  }

  return {
    isNew: true,
    currentStreak: newStreak,
    longestStreak: newLongest,
    totalCheckIns: newTotal,
    bonusGachaCredits: newBonus,
    milestoneBonus,
    wasReset,
    starPiecesAwarded,
  };
}

/** 스트릭 현황 조회 (체크인 없이). */
export async function getStreak(userId: string): Promise<Streak | null> {
  const [row] = await db
    .select()
    .from(streaks)
    .where(eq(streaks.userId, userId))
    .limit(1);
  return row ?? null;
}

/**
 * 보너스 가챠 크레딧 1회 사용.
 * 잔여 크레딧이 없으면 false 반환.
 */
export async function consumeBonusGacha(userId: string): Promise<boolean> {
  const streak = await getStreak(userId);
  if (!streak || streak.bonusGachaCredits <= 0) return false;

  await db
    .update(streaks)
    .set({
      bonusGachaCredits: streak.bonusGachaCredits - 1,
      updatedAt: new Date(),
    })
    .where(eq(streaks.userId, userId));

  return true;
}
