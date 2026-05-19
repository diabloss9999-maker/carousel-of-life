/**
 * 토스 구독 취소.
 *
 * POST /api/billing/cancel
 *
 * 빌링키 자체는 보관 (사용자가 재구독 시 카드 재입력 없이 사용 가능).
 * subscriptions.cancelAtPeriodEnd=true 로 표시 → 다음 cron 자동 청구 X.
 * currentPeriodEndsAt 까지는 구독 효력 유지.
 */
import { NextResponse } from "next/server";
import { and, eq, inArray, gt, or, isNull } from "drizzle-orm";

import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { requireProfile } from "@/lib/auth/get-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const { profile } = await requireProfile();
  const now = new Date();

  const [active] = await db
    .select({ id: subscriptions.id, provider: subscriptions.provider })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, profile.userId),
        eq(subscriptions.provider, "toss"),
        inArray(subscriptions.status, ["active", "on_trial", "past_due"]),
        or(
          isNull(subscriptions.currentPeriodEndsAt),
          gt(subscriptions.currentPeriodEndsAt, now),
        ),
      ),
    )
    .limit(1);

  if (!active) {
    return NextResponse.json(
      { ok: false, error: { code: "NO_ACTIVE_TOSS_SUBSCRIPTION" } },
      { status: 404 },
    );
  }

  await db
    .update(subscriptions)
    .set({
      cancelAtPeriodEnd: true,
      updatedAt: now,
    })
    .where(eq(subscriptions.id, active.id));

  return NextResponse.json({
    ok: true,
    message: "구독 취소가 예약되었습니다. 다음 결제일까지는 계속 이용 가능해요.",
  });
}
