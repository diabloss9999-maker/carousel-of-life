/**
 * 통합 풀이 기록 (history) 조회.
 *
 * 사용자가 지난 운세·타로·궁합을 한 곳에서 돌아볼 수 있도록.
 */
import "server-only";

import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  compatibilityReadings,
  dailyFortunes,
  tarotReadings,
  type CompatibilityReading,
  type DailyFortune,
  type TarotReading,
} from "@/db/schema";

/** 모든 종류의 history 항목을 통합 표현. */
export type HistoryItem =
  | { kind: "fortune"; data: DailyFortune; date: Date }
  | { kind: "tarot"; data: TarotReading; date: Date }
  | { kind: "compatibility"; data: CompatibilityReading; date: Date };

/**
 * 사용자의 전체 풀이 기록 (최신순, 합본).
 *
 * @param userId
 * @param limitPerKind 카테고리별 최대 N개 (default 50)
 */
export async function getHistory(
  userId: string,
  limitPerKind = 50,
): Promise<HistoryItem[]> {
  const [fortunes, tarots, compats] = await Promise.all([
    db
      .select()
      .from(dailyFortunes)
      .where(eq(dailyFortunes.userId, userId))
      .orderBy(desc(dailyFortunes.createdAt))
      .limit(limitPerKind),
    db
      .select()
      .from(tarotReadings)
      .where(eq(tarotReadings.userId, userId))
      .orderBy(desc(tarotReadings.createdAt))
      .limit(limitPerKind),
    db
      .select()
      .from(compatibilityReadings)
      .where(eq(compatibilityReadings.userId, userId))
      .orderBy(desc(compatibilityReadings.createdAt))
      .limit(limitPerKind),
  ]);

  const items: HistoryItem[] = [
    ...fortunes.map((f) => ({
      kind: "fortune" as const,
      data: f,
      date: new Date(f.createdAt),
    })),
    ...tarots.map((t) => ({
      kind: "tarot" as const,
      data: t,
      date: new Date(t.createdAt),
    })),
    ...compats.map((c) => ({
      kind: "compatibility" as const,
      data: c,
      date: new Date(c.createdAt),
    })),
  ];

  // 최신순 정렬.
  items.sort((a, b) => b.date.getTime() - a.date.getTime());

  return items;
}

/**
 * 카테고리별 카운트만 빠르게 조회 (탭 배지용).
 */
export async function getHistoryCounts(userId: string): Promise<{
  fortune: number;
  tarot: number;
  compatibility: number;
  total: number;
}> {
  const [fortunes, tarots, compats] = await Promise.all([
    db
      .select({ id: dailyFortunes.id })
      .from(dailyFortunes)
      .where(eq(dailyFortunes.userId, userId)),
    db
      .select({ id: tarotReadings.id })
      .from(tarotReadings)
      .where(eq(tarotReadings.userId, userId)),
    db
      .select({ id: compatibilityReadings.id })
      .from(compatibilityReadings)
      .where(eq(compatibilityReadings.userId, userId)),
  ]);

  return {
    fortune: fortunes.length,
    tarot: tarots.length,
    compatibility: compats.length,
    total: fortunes.length + tarots.length + compats.length,
  };
}
