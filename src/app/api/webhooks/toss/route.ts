/**
 * 토스페이먼츠 webhook 수신.
 *
 * 토스 대시보드에 등록할 URL: https://carouseloflife.com/api/webhooks/toss
 *
 * 이벤트 (토스 공식):
 *   - PAYMENT_STATUS_CHANGED: 결제 상태 변경 (예: DONE → CANCELED)
 *
 * 시그니처 검증:
 *   토스는 webhook 요청에 X-TossPayments-Signature 헤더(또는 secret 기반 IP 화이트리스트)
 *   를 사용. 현재 spec 은 secret 토큰을 body 와 함께 HMAC-SHA256 으로 검증하는 방식
 *   이지만 토스 대시보드 설정에 따라 다름. 환경변수 TOSS_WEBHOOK_SECRET 이 비어있으면
 *   검증을 생략(개발 단계). 운영 전 반드시 설정.
 */
import { NextResponse, type NextRequest } from "next/server";
import crypto from "crypto";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { tossPayments, subscriptions } from "@/db/schema";
import { serverEnv } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface TossWebhookPayload {
  eventType?: string;
  createdAt?: string;
  data?: {
    paymentKey?: string;
    orderId?: string;
    status?: string;
    totalAmount?: number;
    canceledAt?: string;
    cancels?: Array<{ cancelReason?: string; canceledAt?: string }>;
  };
}

function verifySignature(rawBody: string, headerSig: string | null): boolean {
  const secret = serverEnv.TOSS_WEBHOOK_SECRET;
  if (!secret) {
    // dev / 설정 전 — 검증 생략 (운영 전 반드시 설정)
    console.warn("[toss webhook] TOSS_WEBHOOK_SECRET 미설정 — 시그니처 검증 생략");
    return true;
  }
  if (!headerSig) return false;
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(rawBody).digest("hex");
  // timing-safe 비교
  const a = Buffer.from(digest);
  const b = Buffer.from(headerSig);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get("tosspayments-webhook-signature");

  if (!verifySignature(rawBody, sig)) {
    console.error("[toss webhook] invalid signature");
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let payload: TossWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as TossWebhookPayload;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const eventType = payload.eventType;
  const data = payload.data;

  // 결제 상태 변경 — 보통 CANCELED 일 때만 처리 필요
  if (eventType === "PAYMENT_STATUS_CHANGED" && data?.paymentKey && data.status) {
    const [row] = await db
      .select({ id: tossPayments.id, subscriptionId: tossPayments.subscriptionId })
      .from(tossPayments)
      .where(eq(tossPayments.paymentKey, data.paymentKey))
      .limit(1);

    if (!row) {
      // 우리 시스템에 없는 paymentKey — 무시 (반환 200 으로 토스에게 ack)
      console.warn("[toss webhook] unknown paymentKey", data.paymentKey);
      return NextResponse.json({ received: true });
    }

    const cancelReason = data.cancels?.[0]?.cancelReason ?? null;
    const canceledAt =
      data.cancels?.[0]?.canceledAt ?? data.canceledAt ?? null;

    await db
      .update(tossPayments)
      .set({
        status: data.status,
        canceledAt: canceledAt ? new Date(canceledAt) : null,
        cancelReason,
      })
      .where(eq(tossPayments.id, row.id));

    // 결제가 환불됐으면 구독도 비활성화
    if (data.status === "CANCELED" && row.subscriptionId) {
      await db
        .update(subscriptions)
        .set({
          status: "cancelled",
          endedAt: new Date(),
          cancelAtPeriodEnd: true,
        })
        .where(eq(subscriptions.id, row.subscriptionId));
    }
  }

  return NextResponse.json({ received: true });
}
