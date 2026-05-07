/**
 * 운세 점수 추이 — 최근 N일 일자별 general 점수 조회.
 *
 * /today 페이지 sparkline 위젯용.
 */
import "server-only";

import { and, eq, gte, sql } from "drizzle-orm";

import { db } from "@/db";
import { dailyFortunes } from "@/db/schema";
import { getTodayInSeoul } from "@/lib/usage/quota";

export interface FortuneTrendPoint {
  /** YYYY-MM-DD (서울 기준 날짜). */
  date: string;
  /** 1-100 점수, 그 날 운세를 안 봤다면 null. */
  score: number | null;
}

export interface FortuneTrend {
  points: FortuneTrendPoint[];
  /** 점수가 있는 항목만 평균 (반올림). 데이터 없으면 null. */
  average: number | null;
  /** 최고 점수 / 최저 점수, 데이터 없으면 null. */
  max: number | null;
  min: number | null;
  /** 점수 기록이 있는 날 수. */
  recorded: number;
}

/**
 * 사용자의 최근 N일 general 운세 점수.
 *
 * 빈 날은 score:null 로 채워서 반환한다 — 호출 측에서 시각화 시
 * 일관된 길이의 배열을 받게 하기 위함.
 */
export async function getFortuneTrend(
  userId: string,
  days = 14,
): Promise<FortuneTrend> {
  // 서울 기준 오늘 → N일 전까지의 일자 배열 생성.
  const todayStr = getTodayInSeoul();
  const dayList = lastNDaysFrom(todayStr, days);
  const startDateStr = dayList[0];

  const rows = await db
    .select({
      date: sql<string>`${dailyFortunes.fortuneDate}::text`,
      score: dailyFortunes.score,
    })
    .from(dailyFortunes)
    .where(
      and(
        eq(dailyFortunes.userId, userId),
        eq(dailyFortunes.category, "general"),
        gte(dailyFortunes.fortuneDate, startDateStr),
      ),
    );

  const byDate = new Map<string, number>();
  for (const r of rows) {
    byDate.set(r.date, r.score);
  }

  const points: FortuneTrendPoint[] = dayList.map((ymd) => ({
    date: ymd,
    score: byDate.get(ymd) ?? null,
  }));

  const recordedScores = points
    .map((p) => p.score)
    .filter((s): s is number => s !== null);

  const average =
    recordedScores.length > 0
      ? Math.round(
          recordedScores.reduce((a, b) => a + b, 0) / recordedScores.length,
        )
      : null;

  return {
    points,
    average,
    max: recordedScores.length > 0 ? Math.max(...recordedScores) : null,
    min: recordedScores.length > 0 ? Math.min(...recordedScores) : null,
    recorded: recordedScores.length,
  };
}

/**
 * `todayStr` (YYYY-MM-DD) 기준 N일 분의 일자 배열 (오래된 → 최신).
 *
 * 시간대 변환을 피하기 위해 정수 연산만 사용.
 */
function lastNDaysFrom(todayStr: string, n: number): string[] {
  const [y, m, d] = todayStr.split("-").map((s) => Number.parseInt(s, 10));
  // UTC 노이즈를 피하기 위해 UTC 자정 기준으로 다룬다.
  const base = Date.UTC(y, m - 1, d);
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const ms = base - i * 24 * 60 * 60 * 1000;
    const dt = new Date(ms);
    const yy = dt.getUTCFullYear();
    const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(dt.getUTCDate()).padStart(2, "0");
    out.push(`${yy}-${mm}-${dd}`);
  }
  return out;
}
