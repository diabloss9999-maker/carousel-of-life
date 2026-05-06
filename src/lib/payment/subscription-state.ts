/**
 * 사용자 구독 상태 조회 헬퍼.
 *
 * 한도 체크·UI 분기에서 공통으로 사용한다.
 */
import "server-only";

import { and, eq, inArray, gt, or, isNull } from "drizzle-orm";

import { db } from "@/db";
import { subscriptions, type Subscription } from "@/db/schema";

/**
 * 사용자가 활성 구독을 갖고 있는지.
 *
 * - status 가 active / on_trial 이고
 * - current_period_ends_at 이 미래이거나 null
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const now = new Date();
  const [row] = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        inArray(subscriptions.status, ["active", "on_trial"]),
        or(
          isNull(subscriptions.currentPeriodEndsAt),
          gt(subscriptions.currentPeriodEndsAt, now),
        ),
      ),
    )
    .limit(1);

  return Boolean(row);
}

/**
 * 사용자의 가장 최근 구독 row 를 반환 (없으면 null).
 */
export async function getLatestSubscription(
  userId: string,
): Promise<Subscription | null> {
  const [row] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(subscriptions.createdAt)
    .limit(1);
  return row ?? null;
}
