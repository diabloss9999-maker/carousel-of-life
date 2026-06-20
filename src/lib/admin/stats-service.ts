/**
 * 운영자 통계 집계 서비스 (마스터 전용).
 *
 * 모든 함수는 server-only. 호출 전 isAdmin() 가드를 반드시 통과시킬 것.
 *
 * 통계 출처:
 *   - 결제·매출    → portone_payments (status='PAID')
 *   - 구독         → subscriptions
 *   - 가입         → profiles.created_at
 *   - 기능 사용    → usage_quotas + 각 readings 테이블
 *   - 멤버 인기  → chat_sessions.character + chat_messages
 *   - 활동 시간대  → chat_messages.created_at 의 시(hour) 분포 (KST)
 *
 * 방문자(page view) 추적은 별도 테이블이 없으므로 "활동 사용자" 로 근사한다.
 * 정확한 page view·시간대별 트래픽은 Vercel Analytics 콘솔에서 확인.
 */
import "server-only";

import { and, count, desc, eq, gte, sql, sum } from "drizzle-orm";

import { db } from "@/db";
import {
  profiles,
  subscriptions,
  portonePayments,
  chatSessions,
  chatMessages,
  runeReadings,
  lenormandReadings,
  compatibilityReadings,
  usageQuotas,
} from "@/db/schema";
import { SUBSCRIPTION } from "@/lib/constants";
import type { CharacterId } from "@/lib/chat/characters";

/** KST 기준 오늘 00:00 의 UTC Date 를 반환. */
function kstTodayStartUtc(): Date {
  const kstDate = new Date().toLocaleDateString("sv-SE", {
    timeZone: "Asia/Seoul",
  });
  return new Date(`${kstDate}T00:00:00+09:00`);
}

/** KST 기준 N일 전 00:00 의 UTC Date. */
function kstDaysAgoStartUtc(daysAgo: number): Date {
  const base = kstTodayStartUtc();
  base.setDate(base.getDate() - daysAgo);
  return base;
}

// ─────────────────────────────────────────────────────────────────────────────
// 오늘 요약
// ─────────────────────────────────────────────────────────────────────────────

export interface TodaySummary {
  newSignups: number;
  payingUsers: number;
  revenueKRW: number;
  litePayments: number;
  proPayments: number;
  activeChatUsers: number;
}

/** 오늘(KST) 핵심 지표. */
export async function getTodaySummary(): Promise<TodaySummary> {
  const todayStart = kstTodayStartUtc();

  const [
    signupRows,
    paymentRows,
    chatUserRows,
  ] = await Promise.all([
    db
      .select({ n: count() })
      .from(profiles)
      .where(gte(profiles.createdAt, todayStart)),
    db
      .select({ amount: portonePayments.amount })
      .from(portonePayments)
      .where(
        and(
          eq(portonePayments.status, "PAID"),
          gte(portonePayments.createdAt, todayStart),
        ),
      ),
    db
      .select({ userId: chatMessages.userId })
      .from(chatMessages)
      .where(gte(chatMessages.createdAt, todayStart))
      .groupBy(chatMessages.userId),
  ]);

  const proPrice = SUBSCRIPTION.pro.monthlyPriceKRW;
  let revenueKRW = 0;
  let litePayments = 0;
  let proPayments = 0;
  for (const p of paymentRows) {
    revenueKRW += p.amount;
    if (p.amount >= proPrice) proPayments += 1;
    else litePayments += 1;
  }

  return {
    newSignups: signupRows[0]?.n ?? 0,
    payingUsers: paymentRows.length,
    revenueKRW,
    litePayments,
    proPayments,
    activeChatUsers: chatUserRows.length,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 누적 지표
// ─────────────────────────────────────────────────────────────────────────────

export interface LifetimeSummary {
  totalMembers: number;
  activeSubscribers: number;
  totalRevenueKRW: number;
  totalPaidCount: number;
}

export async function getLifetimeSummary(): Promise<LifetimeSummary> {
  const [memberRows, subRows, revenueRows] = await Promise.all([
    db.select({ n: count() }).from(profiles),
    db
      .select({ n: count() })
      .from(subscriptions)
      .where(eq(subscriptions.status, "active")),
    db
      .select({
        total: sum(portonePayments.amount),
        n: count(),
      })
      .from(portonePayments)
      .where(eq(portonePayments.status, "PAID")),
  ]);

  return {
    totalMembers: memberRows[0]?.n ?? 0,
    activeSubscribers: subRows[0]?.n ?? 0,
    totalRevenueKRW: Number(revenueRows[0]?.total ?? 0),
    totalPaidCount: revenueRows[0]?.n ?? 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 기능 사용 랭킹 (오늘)
// ─────────────────────────────────────────────────────────────────────────────

export interface FeatureUsage {
  label: string;
  count: number;
}

/** 오늘(KST) 기능별 사용 횟수 랭킹. */
export async function getTodayFeatureUsage(): Promise<FeatureUsage[]> {
  const todayStart = kstTodayStartUtc();

  // usage_quotas 는 일별 누적 카운트 — 오늘 날짜 row 합산
  const todayKst = new Date().toLocaleDateString("sv-SE", {
    timeZone: "Asia/Seoul",
  });

  const [quotaRows, runeRows, lenoRows, compatRows] =
    await Promise.all([
      db
        .select({
          fortune: sum(usageQuotas.fortuneCount),
          tarot: sum(usageQuotas.tarotCount),
          chat: sum(usageQuotas.chatCount),
          palm: sum(usageQuotas.palmCount),
        })
        .from(usageQuotas)
        .where(eq(usageQuotas.usageDate, todayKst)),
      db
        .select({ n: count() })
        .from(runeReadings)
        .where(gte(runeReadings.createdAt, todayStart)),
      db
        .select({ n: count() })
        .from(lenormandReadings)
        .where(gte(lenormandReadings.createdAt, todayStart)),
      db
        .select({ n: count() })
        .from(compatibilityReadings)
        .where(gte(compatibilityReadings.createdAt, todayStart)),
    ]);

  const q = quotaRows[0];
  const usage: FeatureUsage[] = [
    { label: "오늘의 운세", count: Number(q?.fortune ?? 0) },
    { label: "멤버 대화", count: Number(q?.chat ?? 0) },
    { label: "타로", count: Number(q?.tarot ?? 0) },
    { label: "손금", count: Number(q?.palm ?? 0) },
    { label: "룬", count: runeRows[0]?.n ?? 0 },
    { label: "르노르망", count: lenoRows[0]?.n ?? 0 },
    { label: "궁합", count: compatRows[0]?.n ?? 0 },
  ];

  return usage.sort((a, b) => b.count - a.count);
}

// ─────────────────────────────────────────────────────────────────────────────
// 멤버 인기 랭킹 (오늘 대화 메시지 수 기준)
// ─────────────────────────────────────────────────────────────────────────────

export interface CharacterRank {
  characterId: string;
  messageCount: number;
}

/** 오늘(KST) 멤버별 대화 메시지 수 랭킹. */
export async function getTodayCharacterRank(): Promise<CharacterRank[]> {
  const todayStart = kstTodayStartUtc();

  // chat_messages 는 session 을 통해 character 와 연결됨.
  const rows = await db
    .select({
      character: chatSessions.character,
      n: count(chatMessages.id),
    })
    .from(chatMessages)
    .innerJoin(chatSessions, eq(chatMessages.sessionId, chatSessions.id))
    .where(gte(chatMessages.createdAt, todayStart))
    .groupBy(chatSessions.character)
    .orderBy(desc(count(chatMessages.id)));

  return rows.map((r) => ({
    characterId: (r.character ?? "witch") as CharacterId,
    messageCount: r.n,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// 활동 시간대 (오늘 chat_messages 의 KST 시(hour) 분포)
// ─────────────────────────────────────────────────────────────────────────────

export interface HourlyActivity {
  hour: number; // 0~23 (KST)
  count: number;
}

/** 오늘(KST) 시간대별 채팅 활동량 — "몇 시에 가장 활발했나" 근사치. */
export async function getTodayHourlyActivity(): Promise<HourlyActivity[]> {
  const todayStart = kstTodayStartUtc();

  // Postgres: created_at(UTC) → KST 변환 후 hour 추출
  const rows = await db
    .select({
      hour: sql<number>`extract(hour from (${chatMessages.createdAt} at time zone 'Asia/Seoul'))::int`,
      n: count(),
    })
    .from(chatMessages)
    .where(gte(chatMessages.createdAt, todayStart))
    .groupBy(
      sql`extract(hour from (${chatMessages.createdAt} at time zone 'Asia/Seoul'))`,
    );

  // 0~23 전체 시간대 채우기 (없는 시간은 0)
  const map = new Map<number, number>();
  for (const r of rows) map.set(Number(r.hour), r.n);
  return Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    count: map.get(h) ?? 0,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// 최근 7일 매출 추이
// ─────────────────────────────────────────────────────────────────────────────

export interface DailyRevenue {
  date: string; // YYYY-MM-DD (KST)
  revenueKRW: number;
  paidCount: number;
}

/** 최근 7일(오늘 포함) 일별 매출. */
export async function getRecentRevenue(): Promise<DailyRevenue[]> {
  const weekStart = kstDaysAgoStartUtc(6);

  const rows = await db
    .select({
      day: sql<string>`to_char((${portonePayments.createdAt} at time zone 'Asia/Seoul')::date, 'YYYY-MM-DD')`,
      total: sum(portonePayments.amount),
      n: count(),
    })
    .from(portonePayments)
    .where(
      and(
        eq(portonePayments.status, "PAID"),
        gte(portonePayments.createdAt, weekStart),
      ),
    )
    .groupBy(
      sql`(${portonePayments.createdAt} at time zone 'Asia/Seoul')::date`,
    );

  const map = new Map<string, { revenueKRW: number; paidCount: number }>();
  for (const r of rows) {
    map.set(r.day, { revenueKRW: Number(r.total ?? 0), paidCount: r.n });
  }

  // 7일 전체 채우기
  const result: DailyRevenue[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = kstDaysAgoStartUtc(i);
    const label = d.toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
    const entry = map.get(label);
    result.push({
      date: label,
      revenueKRW: entry?.revenueKRW ?? 0,
      paidCount: entry?.paidCount ?? 0,
    });
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// 전체 묶음 (페이지에서 한 번에 로드)
// ─────────────────────────────────────────────────────────────────────────────

export interface AdminStats {
  today: TodaySummary;
  lifetime: LifetimeSummary;
  featureUsage: FeatureUsage[];
  characterRank: CharacterRank[];
  hourlyActivity: HourlyActivity[];
  recentRevenue: DailyRevenue[];
}

export async function getAdminStats(): Promise<AdminStats> {
  const [
    today,
    lifetime,
    featureUsage,
    characterRank,
    hourlyActivity,
    recentRevenue,
  ] = await Promise.all([
    getTodaySummary(),
    getLifetimeSummary(),
    getTodayFeatureUsage(),
    getTodayCharacterRank(),
    getTodayHourlyActivity(),
    getRecentRevenue(),
  ]);

  return {
    today,
    lifetime,
    featureUsage,
    characterRank,
    hourlyActivity,
    recentRevenue,
  };
}
