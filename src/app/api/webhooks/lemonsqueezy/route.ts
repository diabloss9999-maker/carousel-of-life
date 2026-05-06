/**
 * Lemon Squeezy Webhook 엔드포인트.
 *
 * - HMAC-SHA256 서명 검증
 * - 멱등 처리
 * - 이벤트 라우팅 → DB 반영
 */
import { NextResponse, type NextRequest } from "next/server";

import { processWebhook, verifySignature } from "@/lib/payment/webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("X-Signature") ?? "";

  let valid = false;
  try {
    valid = verifySignature(rawBody, signature);
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "WEBHOOK_NOT_CONFIGURED", message: e instanceof Error ? e.message : "" },
      },
      { status: 500 },
    );
  }

  if (!valid) {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_SIGNATURE" } },
      { status: 401 },
    );
  }

  // event_id 헤더 우선 사용. 없으면 payload data.id + event_name 합성.
  const headerEventId = request.headers.get("X-Event-Id");
  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_JSON" } },
      { status: 400 },
    );
  }

  const eventId =
    headerEventId ??
    `${payload?.meta?.event_name ?? "unknown"}_${payload?.data?.id ?? "unknown"}`;

  const result = await processWebhook({
    eventId,
    payload,
    raw: rawBody,
  });

  if (!result.ok) {
    // 5xx 반환 → LS 가 자동 재시도.
    return NextResponse.json(
      { ok: false, error: { code: "PROCESS_FAILED", message: result.error } },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, deduped: result.deduped });
}
