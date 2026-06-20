/**
 * PortOne 빌링키 발급 검증 + 첫 청구 + DB 저장.
 *
 * 기운:
 *  1. 브라우저 SDK 가 `requestIssueBillingKey()` → successUrl 로 issueId 전달
 *  2. /api/billing/portone/callback 이 이 함수 호출
 *  3. 여기서:
 *     a) PortOne API 로 issueId 검증 + billingKey·카드정보 획득
 *     b) 즉시 첫 달 청구 (chargeWithBillingKey)
 *     c) subscriptions + portone_payments DB 행 생성
 */
import "server-only";

import { and, eq, gt, inArray, isNull, or } from "drizzle-orm";

import { db } from "@/db";
import { subscriptions, portonePayments } from "@/db/schema";
import {
  getBillingKeyByIssueId,
  chargeWithBillingKey,
  cancelPayment,
  deleteBillingKey,
  buildPaymentId,
  buildOrderId,
  userIdToCustomerId,
  PortOneError,
} from "@/lib/payment/portone";
import { SUBSCRIPTION } from "@/lib/constants";

export type CreatePortOneSubscriptionResult =
  | {
      ok: true;
      subscriptionId: string;
      billingKey: string;
      paymentId: string;
      amount: number;
    }
  | {
      ok: false;
      code:
        | "BILLING_KEY_INVALID"
        | "CHARGE_FAILED"
        | "DB_FAILED"
        | "ALREADY_SUBSCRIBED";
      message: string;
    };

export async function createPortOneSubscription(opts: {
  userId: string;
  email: string;
  displayName?: string | null;
  plan: "lite" | "pro";
  issueId: string;
}): Promise<CreatePortOneSubscriptionResult> {
  const { userId, email, displayName, plan, issueId } = opts;

  // 0) 이미 활성 구독이 있는지 사전 체크 (이중 결제 방지).
  //    있으면 빌링키만 발급된 상태이므로 즉시 삭제하고 ALREADY_SUBSCRIBED 반환.
  const now0 = new Date();
  const [active] = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        inArray(subscriptions.status, ["active", "on_trial"]),
        or(
          isNull(subscriptions.currentPeriodEndsAt),
          gt(subscriptions.currentPeriodEndsAt, now0),
        ),
      ),
    )
    .limit(1);

  if (active) {
    // 발급된 빌링키 즉시 삭제 (PortOne 측 orphan 방지). 실패해도 결과엔 영향 없음.
    try {
      const issued = await getBillingKeyByIssueId(issueId);
      if (issued.status === "ISSUED" && issued.billingKey) {
        await deleteBillingKey(issued.billingKey).catch(() => undefined);
      }
    } catch {
      /* 무시 */
    }
    return {
      ok: false,
      code: "ALREADY_SUBSCRIBED",
      message: "이미 활성 멤버십이 있어요. 설정 페이지에서 확인해 주세요.",
    };
  }

  // 1) 빌링키 발급 결과 검증
  let billingKey: string;
  let cardCompany: string | undefined;
  let cardNumberMasked: string | undefined;
  let channelKey: string | undefined;
  try {
    const result = await getBillingKeyByIssueId(issueId);
    if (result.status !== "ISSUED" || !result.billingKey) {
      return {
        ok: false,
        code: "BILLING_KEY_INVALID",
        message: `빌링키 발급 실패 (status: ${result.status})`,
      };
    }
    billingKey = result.billingKey;
    cardCompany = result.card?.company ?? result.card?.name;
    cardNumberMasked = result.card?.number;
    channelKey = result.channelKey;
  } catch (e) {
    return {
      ok: false,
      code: "BILLING_KEY_INVALID",
      message:
        e instanceof PortOneError
          ? `PortOne 빌링키 조회 실패 (${e.status ?? "?"}: ${e.message})`
          : `PortOne 빌링키 조회 실패: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  // 2) 첫 달 즉시 청구.
  //    SUBSCRIPTION 상수를 직접 사용 — UI 노출가 = 결제 금액 보장
  //    (NHN KCP 가맹점 심사 6번: "사이트 노출 금액 = 결제창 금액" 일치 요건).
  const amount =
    plan === "pro"
      ? SUBSCRIPTION.pro.monthlyPriceKRW
      : SUBSCRIPTION.lite.monthlyPriceKRW;
  const orderName =
    plan === "pro"
      ? "인생의 회전목마 — 프로 멤버십"
      : "인생의 회전목마 — 라이트 멤버십";
  const paymentId = buildPaymentId(userId);
  const orderId = buildOrderId(userId, plan);
  const customerId = userIdToCustomerId(userId);

  let paymentResult;
  try {
    paymentResult = await chargeWithBillingKey({
      paymentId,
      billingKey,
      orderName,
      amountKRW: amount,
      customer: {
        id: customerId,
        name: displayName ?? undefined,
        email,
      },
    });
    if (paymentResult.status !== "PAID") {
      return {
        ok: false,
        code: "CHARGE_FAILED",
        message: `첫 청구 실패 (status: ${paymentResult.status})`,
      };
    }
    // PG 응답 amount 검증 — 우리가 요청한 금액과 다르면 사기 시나리오
    const paidAmount = paymentResult.amount?.total ?? amount;
    if (paidAmount !== amount) {
      console.error("[portone-subscription] amount mismatch", {
        requested: amount,
        paid: paidAmount,
      });
      // 보상 환불
      try {
        await cancelPayment({
          paymentId,
          reason: "결제 금액 불일치 (자동 환불)",
        });
      } catch {
        /* 무시 */
      }
      try {
        await deleteBillingKey(billingKey);
      } catch {
        /* 무시 */
      }
      return {
        ok: false,
        code: "CHARGE_FAILED",
        message: `결제 금액 불일치 (요청 ${amount} / 응답 ${paidAmount})`,
      };
    }
  } catch (e) {
    return {
      ok: false,
      code: "CHARGE_FAILED",
      message:
        e instanceof PortOneError
          ? `PortOne 청구 실패 (${e.status ?? "?"}: ${e.message})`
          : `PortOne 청구 실패: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  // 3) DB 저장 — subscriptions + portone_payments 동시
  try {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const [sub] = await db
      .insert(subscriptions)
      .values({
        userId,
        provider: "portone",
        portoneBillingKey: billingKey,
        portoneCustomerId: customerId,
        portoneChannelKey: channelKey ?? null,
        portoneCardCompany: cardCompany ?? null,
        portoneCardNumberMasked: cardNumberMasked ?? null,
        planKey: plan,
        status: "active",
        currentPeriodStartsAt: now,
        currentPeriodEndsAt: periodEnd,
        raw: paymentResult as unknown as Record<string, unknown>,
      })
      .returning({ id: subscriptions.id });

    await db.insert(portonePayments).values({
      userId,
      subscriptionId: sub.id,
      paymentId,
      orderId,
      txId: paymentResult.pgTxId ?? null,
      amount,
      status: paymentResult.status,
      method: paymentResult.method?.type ?? null,
      pgProvider: paymentResult.pgProvider ?? null,
      paidAt: paymentResult.paidAt ? new Date(paymentResult.paidAt) : new Date(),
      rawResponse: paymentResult as unknown as Record<string, unknown>,
    });

    return {
      ok: true,
      subscriptionId: sub.id,
      billingKey,
      paymentId,
      amount,
    };
  } catch (e) {
    console.error("[portone-subscription] DB insert failed — 보상 환불 시도", e);
    // 사용자 돈만 빠지고 시스템엔 흔적 없는 상황 방지 — 자동 환불.
    try {
      await cancelPayment({
        paymentId,
        reason: "DB 저장 실패에 의한 자동 환불",
      });
    } catch (refundErr) {
      console.error(
        "[portone-subscription] 보상 환불 실패 — 수동 조치 필요",
        { paymentId, billingKey, refundErr },
      );
    }
    // 빌링키도 정리 (남겨두면 다음 cron 에서 또 사용)
    try {
      await deleteBillingKey(billingKey);
    } catch {
      /* 무시 */
    }
    return {
      ok: false,
      code: "DB_FAILED",
      message: `DB 저장 실패: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}
