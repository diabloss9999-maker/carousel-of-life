/**
 * PortOne webhook 수신.
 *
 * 대시보드 등록 URL: https://carouseloflife.com/api/webhooks/portone
 *
 * 이벤트:
 *   - Transaction.Paid       — 결제 성공
 *   - Transaction.Cancelled  — 결제 취소·환불
 *   - Transaction.Failed     — 결제 실패
 *   - BillingKey.Issued      — 빌링키 발급
 *   - BillingKey.Deleted     — 빌링키 삭제
 *
 * 시그니처 검증:
 *   PortOne V2 는 standardwebhooks(svix) 표준 — webhook-id · webhook-timestamp ·
 *   webhook-signature 헤더를 함께 본다. `@portone/server-sdk` 의 Webhook.verify 사용.
 */
import { NextResponse, type NextRequest } from "next/server";
import { Webhook } from "@portone/server-sdk";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { portonePayments, subscriptions } from "@/db/schema";
import { serverEnv } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PortOneWebhookPayload {
  type?: string;
  timestamp?: string;
  data?: {
    paymentId?: string;
    billingKey?: string;
    transactionId?: string;
    storeId?: string;
  };
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const secret = serverEnv.PORTONE_WEBHOOK_SECRET;

  // 1) 시그니처 검증 — PortOne 공식 SDK 의 Webhook.verify 사용.
  //    내부적으로 standardwebhooks(svix) 표준:
  //      · webhook-id · webhook-timestamp · webhook-signature 헤더 검증
  //      · HMAC-SHA256({id}.{timestamp}.{body}) === signature
  //      · timestamp ±5분 허용
  //      · secret 이 whsec_ prefix 면 base64 decode
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error("[portone webhook] PORTONE_WEBHOOK_SECRET 미설정 (production)");
      return NextResponse.json({ error: "no_secret" }, { status: 500 });
    }
    console.warn("[portone webhook] PORTONE_WEBHOOK_SECRET 미설정 — dev 검증 생략");
  } else {
    try {
      // headers 객체를 plain 으로 변환 (case-insensitive)
      const headersObj: Record<string, string> = {};
      req.headers.forEach((v, k) => {
        headersObj[k] = v;
      });
      await Webhook.verify(secret, rawBody, headersObj);
    } catch (e) {
      if (e instanceof Webhook.WebhookVerificationError) {
        console.error("[portone webhook] signature 검증 실패", e.message);
        return NextResponse.json(
          { ok: false, error: "INVALID_SIGNATURE" },
          { status: 401 },
        );
      }
      console.error("[portone webhook] verify error", e);
      return NextResponse.json(
        { ok: false, error: "VERIFY_FAILED" },
        { status: 401 },
      );
    }
  }

  let payload: PortOneWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { ok: false, error: "INVALID_BODY" },
      { status: 400 },
    );
  }

  const eventType = payload.type ?? "";

  try {
    // Transaction 이벤트들 처리
    if (eventType.startsWith("Transaction.") && payload.data?.paymentId) {
      await handleTransactionEvent(eventType, payload.data.paymentId, payload);
    }

    // BillingKey 이벤트 — 빌링키 삭제 시 구독 강제 만료
    if (eventType === "BillingKey.Deleted" && payload.data?.billingKey) {
      await handleBillingKeyDeleted(payload.data.billingKey);
    }
  } catch (e) {
    console.error("[portone webhook] handler error", e);
    // 5xx 반환하면 PortOne 이 재시도 (최대 7회 / 3일 19시간)
    return NextResponse.json(
      { ok: false, error: "HANDLER_FAILED" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

async function handleTransactionEvent(
  eventType: string,
  paymentId: string,
  payload: PortOneWebhookPayload,
): Promise<void> {
  const [existing] = await db
    .select()
    .from(portonePayments)
    .where(eq(portonePayments.paymentId, paymentId))
    .limit(1);

  let newStatus: string;
  let cancelledAt: Date | null = null;
  const cancelReason: string | null = null;

  if (eventType === "Transaction.Paid") {
    newStatus = "PAID";
  } else if (eventType === "Transaction.Cancelled") {
    newStatus = "CANCELLED";
    cancelledAt = new Date();
  } else if (eventType === "Transaction.PartialCancelled") {
    newStatus = "PARTIAL_CANCELLED";
    cancelledAt = new Date();
  } else if (eventType === "Transaction.Failed") {
    newStatus = "FAILED";
  } else {
    return; // 알 수 없는 이벤트는 무시
  }

  if (existing) {
    await db
      .update(portonePayments)
      .set({
        status: newStatus,
        ...(cancelledAt ? { cancelledAt } : {}),
        ...(cancelReason ? { cancelReason } : {}),
        rawResponse: payload as unknown as Record<string, unknown>,
      })
      .where(eq(portonePayments.id, existing.id));

    // 환불 시 구독도 cancel 처리
    if (
      (newStatus === "CANCELLED" || newStatus === "PARTIAL_CANCELLED") &&
      existing.subscriptionId
    ) {
      await db
        .update(subscriptions)
        .set({ status: "cancelled", endedAt: new Date() })
        .where(eq(subscriptions.id, existing.subscriptionId));
    }
  }
  // existing 이 없으면 우리 시스템 외부 결제거나 race condition — 무시
}

async function handleBillingKeyDeleted(billingKey: string): Promise<void> {
  // 빌링키만 폐기. 사용자의 잔여 구독 기간은 유지하되 다음 갱신을 막는다.
  // status='cancelled' 즉시 변경은 사용자 잔여 기간을 무시하게 되므로 지양.
  await db
    .update(subscriptions)
    .set({ cancelAtPeriodEnd: true, updatedAt: new Date() })
    .where(eq(subscriptions.portoneBillingKey, billingKey));
}
