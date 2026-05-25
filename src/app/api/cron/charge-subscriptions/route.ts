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
import { and, eq, lte, or } from "drizzle-orm";

import { db } from "@/db";
import { subscriptions, tossPayments, portonePayments } from "@/db/schema";
import {
  buildSubscriptionOrderId,
  chargeWithBillingKey,
  TossError,
} from "@/lib/payment/toss";
import {
  chargeWithBillingKey as portoneCharge,
  buildRecurringPaymentId as portoneBuildRecurringPaymentId,
  buildOrderId as portoneBuildOrderId,
  userIdToCustomerId as portoneCustomerIdFor,
  PortOneError,
} from "@/lib/payment/portone";
import { SUBSCRIPTION } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Vercel Cron 인증. production 에서는 secret 필수. */
function isAuthorizedCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
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

  // 만료 임박 (24시간 이내) + active + 취소 예약 안 됨 + 한국 PG (toss·portone) 구독
  const cutoff = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const due = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        or(
          eq(subscriptions.provider, "toss"),
          eq(subscriptions.provider, "portone"),
        ),
        eq(subscriptions.status, "active"),
        eq(subscriptions.cancelAtPeriodEnd, false),
        lte(subscriptions.currentPeriodEndsAt, cutoff),
      ),
    );

  const outcomes: ChargeOutcome[] = [];

  for (const sub of due) {
    try {
      if (sub.provider === "portone") {
        await chargePortOneSub(sub);
        outcomes.push({ subscriptionId: sub.id, ok: true });
      } else if (sub.provider === "toss") {
        await chargeTossSub(sub);
        outcomes.push({ subscriptionId: sub.id, ok: true });
      } else {
        outcomes.push({
          subscriptionId: sub.id,
          ok: false,
          reason: "UNKNOWN_PROVIDER",
        });
      }
    } catch (e) {
      const code =
        e instanceof TossError
          ? e.code
          : e instanceof PortOneError
            ? (e.code ?? "PORTONE_ERROR")
            : "UNKNOWN_ERROR";
      console.error("[charge-subscriptions] failed", {
        subscriptionId: sub.id,
        provider: sub.provider,
        code,
        message: e instanceof Error ? e.message : String(e),
      });
      await db
        .update(subscriptions)
        .set({ status: "past_due", updatedAt: new Date() })
        .where(eq(subscriptions.id, sub.id));
      outcomes.push({ subscriptionId: sub.id, ok: false, reason: String(code) });
    }
  }

  async function chargeTossSub(
    sub: typeof subscriptions.$inferSelect,
  ): Promise<void> {
    if (!sub.tossBillingKey || !sub.tossCustomerKey) {
      throw new Error("MISSING_BILLING_KEY: 토스 빌링키 누락");
    }
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

    const charge = await chargeWithBillingKey({
      billingKey: sub.tossBillingKey,
      customerKey: sub.tossCustomerKey,
      amount: lastAmount,
      orderId,
      orderName,
    });

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
  }

  async function chargePortOneSub(
    sub: typeof subscriptions.$inferSelect,
  ): Promise<void> {
    if (!sub.portoneBillingKey) {
      throw new PortOneError("PortOne 빌링키 누락");
    }
    const lastPayment = await db
      .select({ amount: portonePayments.amount })
      .from(portonePayments)
      .where(eq(portonePayments.subscriptionId, sub.id))
      .orderBy(portonePayments.createdAt)
      .limit(1);
    const lastAmount =
      lastPayment[0]?.amount ?? SUBSCRIPTION.lite.monthlyPriceKRW;
    const planLabel =
      lastAmount === SUBSCRIPTION.pro.monthlyPriceKRW ? "프로" : "라이트";

    // 결정론적 paymentId — 같은 구독·같은 갱신 주기엔 같은 ID 사용.
    // cron 재실행/중복 호출 시 PortOne 측에서 자동으로 중복 청구 차단.
    const periodEnd = sub.currentPeriodEndsAt ?? new Date();
    const paymentId = portoneBuildRecurringPaymentId(sub.id, periodEnd);
    const orderId = portoneBuildOrderId(
      sub.userId,
      lastAmount === SUBSCRIPTION.pro.monthlyPriceKRW ? "pro" : "lite",
    );
    const customerId =
      sub.portoneCustomerId ?? portoneCustomerIdFor(sub.userId);

    const charge = await portoneCharge({
      paymentId,
      billingKey: sub.portoneBillingKey,
      orderName: `${planLabel} 정기 결제 (${lastAmount.toLocaleString()}원)`,
      amountKRW: lastAmount,
      customer: { id: customerId },
    });

    if (charge.status !== "PAID") {
      throw new PortOneError(`결제 상태 비정상: ${charge.status}`, undefined, charge.status);
    }

    await db.insert(portonePayments).values({
      userId: sub.userId,
      subscriptionId: sub.id,
      paymentId,
      orderId,
      txId: charge.pgTxId ?? null,
      amount: lastAmount,
      status: charge.status,
      method: charge.method?.type ?? null,
      pgProvider: charge.pgProvider ?? null,
      paidAt: charge.paidAt ? new Date(charge.paidAt) : new Date(),
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
  }

  return NextResponse.json({
    processed: outcomes.length,
    succeeded: outcomes.filter((o) => o.ok).length,
    failed: outcomes.filter((o) => !o.ok).length,
    outcomes,
  });
}
