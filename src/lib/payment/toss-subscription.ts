/**
 * 토스 정기결제 — 빌링키 발급 + 첫 결제 + DB 기록 통합 흐름.
 *
 * 호출 순서:
 *   1. 클라이언트가 토스 위젯에서 카드 입력 → successUrl 로 redirect
 *   2. /api/billing/auth/callback 이 createTossSubscription() 호출
 *      → 빌링키 발급 → 즉시 첫 결제 → subscriptions row 생성 → 결제 이력 저장
 *
 * 멱등성: orderId 가 unique 라 같은 주문 두 번 실행되어도 DB 가 막아준다.
 */
import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { subscriptions, tossPayments } from "@/db/schema";
import {
  buildSubscriptionOrderId,
  chargeWithBillingKey,
  issueBillingKey,
  refundPayment,
} from "@/lib/payment/toss";
import { SUBSCRIPTION } from "@/lib/constants";

export type TossPlan = "lite" | "pro";

interface CreateOpts {
  userId: string;
  email: string;
  displayName?: string | null;
  plan: TossPlan;
  authKey: string;
  customerKey: string;
}

interface CreateResult {
  ok: true;
  subscriptionId: string;
  paymentKey: string;
  receiptUrl?: string;
}

interface CreateError {
  ok: false;
  code:
    | "BILLING_KEY_ISSUE_FAILED"
    | "CHARGE_FAILED"
    | "DB_FAILED"
    | "ALREADY_SUBSCRIBED";
  message: string;
}

export async function createTossSubscription(
  opts: CreateOpts,
): Promise<CreateResult | CreateError> {
  const amount = SUBSCRIPTION[opts.plan].monthlyPriceKRW;
  const orderName = `${SUBSCRIPTION[opts.plan].label} 구독 (${amount.toLocaleString()}원)`;

  // 이미 활성 구독이 있으면 중복 결제 차단
  const existing = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(eq(subscriptions.userId, opts.userId))
    .limit(1);

  for (const row of existing) {
    const [check] = await db
      .select({ status: subscriptions.status })
      .from(subscriptions)
      .where(eq(subscriptions.id, row.id))
      .limit(1);
    if (check && (check.status === "active" || check.status === "on_trial")) {
      return {
        ok: false,
        code: "ALREADY_SUBSCRIBED",
        message: "이미 활성 구독이 있어요.",
      };
    }
  }

  // 1) 빌링키 발급
  let billing;
  try {
    billing = await issueBillingKey({
      authKey: opts.authKey,
      customerKey: opts.customerKey,
    });
  } catch (e) {
    console.error("[createTossSubscription] issueBillingKey failed", e);
    return {
      ok: false,
      code: "BILLING_KEY_ISSUE_FAILED",
      message: "카드 인증에 실패했어요. 다시 시도해주세요.",
    };
  }

  // 2) 첫 결제 청구
  const orderId = buildSubscriptionOrderId(opts.userId);
  let charge;
  try {
    charge = await chargeWithBillingKey({
      billingKey: billing.billingKey,
      customerKey: opts.customerKey,
      amount,
      orderId,
      orderName,
      customerEmail: opts.email,
      customerName: opts.displayName ?? undefined,
    });
  } catch (e) {
    console.error("[createTossSubscription] charge failed", e);
    return {
      ok: false,
      code: "CHARGE_FAILED",
      message: "결제에 실패했어요. 카드를 확인하고 다시 시도해주세요.",
    };
  }

  // 3) DB 기록 — 구독 + 결제 이력 (트랜잭션)
  try {
    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const subscriptionId = await db.transaction(async (tx) => {
      const [sub] = await tx
        .insert(subscriptions)
        .values({
          userId: opts.userId,
          provider: "toss",
          tossBillingKey: billing.billingKey,
          tossCustomerKey: opts.customerKey,
          tossCardCompany: billing.card.company,
          tossCardNumberMasked: billing.card.number,
          status: "active",
          currentPeriodStartsAt: now,
          currentPeriodEndsAt: nextMonth,
          cancelAtPeriodEnd: false,
        })
        .returning({ id: subscriptions.id });

      if (!sub) {
        throw new Error("subscription insert returned no row");
      }

      await tx.insert(tossPayments).values({
        userId: opts.userId,
        subscriptionId: sub.id,
        paymentKey: charge.paymentKey,
        orderId: charge.orderId,
        amount: charge.totalAmount,
        status: charge.status,
        method: charge.method,
        approvedAt: charge.approvedAt ? new Date(charge.approvedAt) : null,
        rawResponse: charge as unknown as Record<string, unknown>,
      });

      return sub.id;
    });

    return {
      ok: true,
      subscriptionId,
      paymentKey: charge.paymentKey,
      receiptUrl: charge.receipt?.url,
    };
  } catch (e) {
    console.error("[createTossSubscription] db insert failed", e);
    try {
      await refundPayment({
        paymentKey: charge.paymentKey,
        cancelReason: "구독 정보 저장 실패로 자동 결제 취소",
      });
    } catch (refundError) {
      console.error(
        "[createTossSubscription] compensation refund failed",
        refundError,
      );
    }
    return {
      ok: false,
      code: "DB_FAILED",
      message:
        "결제 기록에 실패해 자동 취소를 시도했어요. 카드 청구 내역을 확인한 뒤 다시 시도해주세요.",
    };
  }
}
