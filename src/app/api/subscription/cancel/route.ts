/**
 * 구독 취소 API.
 *
 * POST /api/subscription/cancel
 *
 * - 본인 구독만 취소 가능
 * - LS API 호출 → webhook 으로 DB 반영 (또는 직접 업데이트)
 */
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";

import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { requireUser } from "@/lib/auth/get-user";
import { cancelSubscription } from "@/lib/payment/lemonsqueezy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const user = await requireUser();

  // 사용자의 활성 구독을 찾는다.
  const [active] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, user.id),
        inArray(subscriptions.status, ["active", "on_trial"]),
      ),
    )
    .limit(1);

  if (!active) {
    return NextResponse.json(
      { ok: false, error: { code: "NO_ACTIVE_SUBSCRIPTION" } },
      { status: 404 },
    );
  }

  try {
    // provider 별 분기 — LS 는 외부 API 호출, Toss 는 DB 플래그만 (cron 이 처리).
    if (active.provider === "toss") {
      // Toss: 빌링키 자체는 유지, cancelAtPeriodEnd 만 설정. 다음 cron 자동 청구 안 함.
      // 실제 DB 업데이트는 아래 공통 코드가 처리.
    } else if (active.lsSubscriptionId) {
      await cancelSubscription(active.lsSubscriptionId);
    } else {
      return NextResponse.json(
        { ok: false, error: { code: "UNKNOWN_PROVIDER" } },
        { status: 400 },
      );
    }
  } catch (e) {
    const tErr = await getTranslations("actionErrors");
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "CANCEL_FAILED",
          message: e instanceof Error ? e.message : tErr("subscriptionCancelFailed"),
        },
      },
      { status: 500 },
    );
  }

  // 즉시 DB 에 cancel_at_period_end 표시 (webhook 도착 전이라도 UI 가 즉시 갱신).
  await db
    .update(subscriptions)
    .set({ cancelAtPeriodEnd: true })
    .where(eq(subscriptions.id, active.id));

  return NextResponse.json({ ok: true });
}
