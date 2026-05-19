/**
 * 정기결제 자동 갱신 cron.
 *
 * Vercel Cron 이 매일 03:00 KST (UTC 18:00 전날) 호출:
 *   vercel.json:
 *     "crons": [{ "path": "/api/cron/charge-subscriptions", "schedule": "0 18 * * *" }]
 *
 * 로직:
 *   1. provider='toss' AND status='active' AND currentPeriodEndsAt <= now + 24h
 *      AND cancelAtPeriodEnd=false 인 구독 찾기
 *   2. 빌링키로 결제 청구 (멱등성 orderId 사용해 같은 날 중복 방지)
 *   3. 성공: currentPeriodEndsAt 한 달 연장
 *   4. 실패: status='past_due' 로 표시 (다음 cron 에서 재시도)
 *
 * 인증:
 *   Vercel Cron 은 요청에 `x-vercel-cron-signature` 또는 환경변수 `CRON_SECRET`
 *   기반 Bearer 토큰을 보낸다. 환경변수 CRON_SECRET 이 설정되어 있으면 검증.
 */
import { NextResponse, type NextRequest } from "next/server";
import { and, eq, lte } from "drizzle-orm";

import { db } from "@/db";
import { subscriptions, tossPayments } from "@/db/schema";
import {
  buildSubscriptionOrderId,
  chargeWithBillingKey,
  TossError,
} from "@/lib/payment/toss";
import { SUBSCRIPTION } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Vercel Cron 인증. CRON_SECRET 미설정이면 검증 생략 (개발). */
function isAuthorizedCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // dev
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

interface ChargeOutcome {
  subscriptionId: string;
  ok: boolean;
  reason?: string;
}

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 만료 임박 (24시간 이내) + active + 취소 예약 안 됨 + 토스 구독
  const cutoff = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const due = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.provider, "toss"),
        eq(subscriptions.status, "active"),
        eq(subscriptions.cancelAtPeriodEnd, false),
        lte(subscriptions.currentPeriodEndsAt, cutoff),
      ),
    );

  const outcomes: ChargeOutcome[] = [];

  for (const sub of due) {
    // 안전 체크 — 빌링키와 customerKey 가 있어야 청구 가능
    if (!sub.tossBillingKey || !sub.tossCustomerKey) {
      outcomes.push({
        subscriptionId: sub.id,
        ok: false,
        reason: "MISSING_BILLING_KEY",
      });
      continue;
    }

    // 플랜 추론 — masked card 만 갖고는 못 하므로 결제 이력의 마지막 금액으로 (단순화)
    // 라이트 4900 / 프로 9900. 분기 안 되면 라이트로 폴백.
    const lastPayment = await db
      .select({ amount: tossPayments.amount })
      .from(tossPayments)
      .where(eq(tossPayments.subscriptionId, sub.id))
      .orderBy(tossPayments.createdAt)
      .limit(1);
    const lastAmount = lastPayment[0]?.amount ?? SUBSCRIPTION.lite.monthlyPriceKRW;
    const planLabel =
      lastAmount === SUBSCRIPTION.pro.monthlyPriceKRW ? "프로" : "라이트";

    const orderId = buildSubscriptionOrderId(sub.userId);
    const orderName = `${planLabel} 정기 결제 (${lastAmount.toLocaleString()}원)`;

    try {
      const charge = await chargeWithBillingKey({
        billingKey: sub.tossBillingKey,
        customerKey: sub.tossCustomerKey,
        amount: lastAmount,
        orderId,
        orderName,
      });

      // 결제 이력 저장 + 구독 기간 연장
      await db.insert(tossPayments).values({
        userId: sub.userId,
        subscriptionId: sub.id,
        paymentKey: charge.paymentKey,
        orderId: charge.orderId,
        amount: charge.totalAmount,
        status: charge.status,
        method: charge.method,
        approvedAt: charge.approvedAt ? new Date(charge.approvedAt) : null,
        rawResponse: charge as unknown as Record<string, unknown>,
      });

      const nextEnd = new Date(sub.currentPeriodEndsAt ?? new Date());
      nextEnd.setMonth(nextEnd.getMonth() + 1);

      await db
        .update(subscriptions)
        .set({
          currentPeriodStartsAt: sub.currentPeriodEndsAt,
          currentPeriodEndsAt: nextEnd,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, sub.id));

      outcomes.push({ subscriptionId: sub.id, ok: true });
    } catch (e) {
      const code =
        e instanceof TossError ? e.code : "UNKNOWN_ERROR";
      console.error("[charge-subscriptions] failed", {
        subscriptionId: sub.id,
        code,
        message: e instanceof Error ? e.message : String(e),
      });
      // past_due 표시 — 다음 cron 에서 재시도. 며칠 연속 실패 시 cancelled 처리는
      // 별도 정책으로 (예: 3회 실패 → cancelled).
      await db
        .update(subscriptions)
        .set({ status: "past_due", updatedAt: new Date() })
        .where(eq(subscriptions.id, sub.id));
      outcomes.push({ subscriptionId: sub.id, ok: false, reason: code });
    }
  }

  return NextResponse.json({
    processed: outcomes.length,
    succeeded: outcomes.filter((o) => o.ok).length,
    failed: outcomes.filter((o) => !o.ok).length,
    outcomes,
  });
}
