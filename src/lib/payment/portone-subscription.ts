/**
 * PortOne 빌링키 발급 검증 + 첫 청구 + DB 저장.
 *
 * 흐름:
 *  1. 브라우저 SDK 가 `requestIssueBillingKey()` → successUrl 로 issueId 전달
 *  2. /api/billing/portone/callback 이 이 함수 호출
 *  3. 여기서:
 *     a) PortOne API 로 issueId 검증 + billingKey·카드정보 획득
 *     b) 즉시 첫 달 청구 (chargeWithBillingKey)
 *     c) subscriptions + portone_payments DB 행 생성
 */
import "server-only";


import { db } from "@/db";
import { subscriptions, portonePayments } from "@/db/schema";
import {
  getBillingKeyByIssueId,
  chargeWithBillingKey,
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

  // 중복 가입 자체는 막지 않음 (LS·Toss·PortOne 병행 가능성).
  // 추후 same-provider 중복 활성 구독 차단을 원하면 여기서 SELECT 추가.

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
    console.error("[portone-subscription] DB insert failed", e);
    return {
      ok: false,
      code: "DB_FAILED",
      message: `DB 저장 실패: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}
