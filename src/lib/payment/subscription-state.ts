/**
 * 사용자 구독 상태 조회 헬퍼.
 *
 * 한도 체크·UI 분기에서 공통으로 사용한다.
 *
 * 티어 판정 로직:
 *   - active/on_trial 구독이 있고
 *   - 가장 최근 portone_payments.amount 가 PRO 가격이면 → "pro"
 *   - 그 외 활성 구독은 → "lite"
 *   - 활성 구독 없음 → "free"
 *
 * Toss 사용자도 동일 로직 (tossPayments.amount 로 폴백).
 * LS 사용자(legacy)는 ls_variant_id 가 있는 경우 무조건 lite 로 폴백 처리.
 */
import "server-only";

import { and, eq, inArray, gt, or, isNull, desc } from "drizzle-orm";

import { db } from "@/db";
import {
  subscriptions,
  portonePayments,
  tossPayments,
  type Subscription,
} from "@/db/schema";
import { isFreeAccessDay } from "@/lib/payment/promo";
import { SUBSCRIPTION } from "@/lib/constants";

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
 * 판정:
 *   1. 활성 구독 없음 → "free"
 *   2. 활성 구독 + 최신 portone_payments.amount === PRO 가격 → "pro"
 *   3. 활성 구독 + 최신 toss_payments.amount === PRO 가격 → "pro"
 *   4. 활성 구독 + 그 외 → "lite"
 */
export async function getSubscriptionTier(
  userId: string,
): Promise<SubscriptionTier> {
  const now = new Date();
  const [sub] = await db
    .select({
      id: subscriptions.id,
      provider: subscriptions.provider,
      planKey: subscriptions.planKey,
    })
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
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  if (!sub) return "free";

  // 1) plan_key 가 있으면 그게 우선 — 가격 변동 안전
  if (sub.planKey === "pro") return "pro";
  if (sub.planKey === "lite") return "lite";

  const proPrice = SUBSCRIPTION.pro.monthlyPriceKRW;

  // 최신 PortOne 결제로 우선 판단
  const [portoneLast] = await db
    .select({ amount: portonePayments.amount })
    .from(portonePayments)
    .where(eq(portonePayments.subscriptionId, sub.id))
    .orderBy(desc(portonePayments.createdAt))
    .limit(1);
  if (portoneLast) {
    return portoneLast.amount >= proPrice ? "pro" : "lite";
  }

  // Toss 결제 폴백
  const [tossLast] = await db
    .select({ amount: tossPayments.amount })
    .from(tossPayments)
    .where(eq(tossPayments.subscriptionId, sub.id))
    .orderBy(desc(tossPayments.createdAt))
    .limit(1);
  if (tossLast) {
    return tossLast.amount >= proPrice ? "pro" : "lite";
  }

  // 결제 row 가 없으면 lite 로 안전 폴백 (LS legacy / dev_grant 등)
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
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);
  return row ?? null;
}
