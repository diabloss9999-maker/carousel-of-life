/**
 * 사용자 구독 상태 조회 헬퍼.
 *
 * 한도 체크·UI 분기에서 공통으로 사용한다.
 */
import "server-only";

import { and, eq, inArray, gt, or, isNull } from "drizzle-orm";

import { db } from "@/db";
import { subscriptions, type Subscription } from "@/db/schema";
import { serverEnv } from "@/lib/env";
import { isFreeAccessDay } from "@/lib/payment/promo";

/**
 * 사용자가 활성 구독을 갖고 있는지.
 *
 * - status 가 active / on_trial 이고
 * - current_period_ends_at 이 미래이거나 null
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  // 프로모션 — 무료 개방일엔 모든 사용자가 활성 구독자로 동작.
  if (isFreeAccessDay()) return true;
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

export type SubscriptionTier = "free" | "lite" | "pro";

/**
 * 사용자의 구독 티어를 반환한다.
 *
 * - pro: `LEMONSQUEEZY_PRO_VARIANT_ID` 환경변수와 구독 variant 일치
 * - lite: 활성 구독이지만 pro 가 아닌 경우
 * - free: 활성 구독 없음
 */
export async function getSubscriptionTier(
  userId: string,
): Promise<SubscriptionTier> {
  // 프로모션 — 무료 개방일엔 모든 사용자에게 PRO 한도·기능 적용.
  if (isFreeAccessDay()) return "pro";
  const now = new Date();
  const [row] = await db
    .select({ lsVariantId: subscriptions.lsVariantId })
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
    .orderBy(subscriptions.createdAt)
    .limit(1);

  if (!row) return "free";

  const proVariantId = serverEnv.LEMONSQUEEZY_PRO_VARIANT_ID;
  if (proVariantId && row.lsVariantId === proVariantId) return "pro";

  return "lite";
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
