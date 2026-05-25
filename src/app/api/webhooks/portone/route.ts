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
 *   PortOne 은 webhook-signature 헤더에 HMAC-SHA256 (base64) 를 보냄.
 *   환경변수 PORTONE_WEBHOOK_SECRET 으로 검증. 빈 값이면 dev 단계라 검증 생략.
 */
import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";
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

function verifySignature(rawBody: string, header: string | null): boolean {
  const secret = serverEnv.PORTONE_WEBHOOK_SECRET;
  if (!secret) {
    // production 에선 secret 필수 — fail-closed
    if (process.env.NODE_ENV === "production") {
      console.error("[portone webhook] PORTONE_WEBHOOK_SECRET 미설정 (production)");
      return false;
    }
    console.warn("[portone webhook] PORTONE_WEBHOOK_SECRET 미설정 — dev 검증 생략");
    return true;
  }
  if (!header) return false;
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(rawBody).digest("base64");
  const a = Buffer.from(digest);
  const b = Buffer.from(header);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get("webhook-signature") ?? req.headers.get("x-portone-signature");

  if (!verifySignature(rawBody, sig)) {
    return NextResponse.json(
      { ok: false, error: "INVALID_SIGNATURE" },
      { status: 401 },
    );
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
