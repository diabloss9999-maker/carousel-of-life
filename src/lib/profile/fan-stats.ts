/**
 * 팬 프로필 통계 — 최애와 함께한 일수, 친밀도, 선물 수, 별조각 잔액.
 *
 * 설정 페이지 상단 팬 프로필 카드와 주간 리포트에서 사용.
 */
import "server-only";

import { count, eq } from "drizzle-orm";

import { db } from "@/db";
import { giftLogs } from "@/db/schema";
import { getAffinity } from "@/lib/affinity/service";
import type { CharacterId } from "@/lib/chat/characters";
import { getBalance } from "@/lib/gifts/service";

export interface FanStats {
  /** 최애 친밀도 레코드 생성일 기준 D+n (오늘이 D+1). 최애 없으면 null. */
  daysTogether: number | null;
  level: number;
  points: number;
  giftCount: number;
  starBalance: number;
}

/** KST 자정 기준 두 시점 사이 일수. */
function kstDaysBetween(from: Date, to: Date): number {
  const fmt = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
  const a = new Date(`${fmt(from)}T00:00:00Z`).getTime();
  const b = new Date(`${fmt(to)}T00:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000);
}

export async function getFanStats(
  userId: string,
  biasCharacterId: CharacterId | null,
): Promise<FanStats> {
  const [affinity, giftRows, starBalance] = await Promise.all([
    biasCharacterId ? getAffinity(userId, biasCharacterId) : Promise.resolve(null),
    db
      .select({ n: count() })
      .from(giftLogs)
      .where(eq(giftLogs.userId, userId)),
    getBalance(userId).catch(() => 0),
  ]);

  const points = affinity?.points ?? 0;
  return {
    daysTogether: affinity?.createdAt
      ? kstDaysBetween(new Date(affinity.createdAt), new Date()) + 1
      : null,
    level: Math.floor(points / 10),
    points,
    giftCount: giftRows[0]?.n ?? 0,
    starBalance,
  };
}
