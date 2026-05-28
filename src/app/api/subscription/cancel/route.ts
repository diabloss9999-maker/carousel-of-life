/**
 * 구독 취소 API.
 *
 * POST /api/subscription/cancel
 *
 * - 본인 구독만 취소 가능
 * - PortOne: 빌링키 자체는 유지, cancel_at_period_end 만 설정.
 *   다음 cron 이 자동 청구하지 않음 → 기간 만료 후 자연 종료.
 */
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";

import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { requireUser } from "@/lib/auth/get-user";

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
    await db
      .update(subscriptions)
      .set({ cancelAtPeriodEnd: true, updatedAt: new Date() })
      .where(eq(subscriptions.id, active.id));
  } catch (e) {
    const tErr = await getTranslations("actionErrors");
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "CANCEL_FAILED",
          message:
            e instanceof Error
              ? e.message
              : tErr("subscriptionCancelFailed"),
        },
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
