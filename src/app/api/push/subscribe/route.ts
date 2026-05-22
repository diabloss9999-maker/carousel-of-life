/**
 * 웹 푸시 구독 등록 API.
 *
 * POST /api/push/subscribe
 *   body: PushSubscription.toJSON() 결과
 *     {
 *       endpoint: string,
 *       keys: { p256dh: string, auth: string }
 *     }
 *
 * - 인증 필수 (anonymous 구독 X)
 * - endpoint 가 unique 라 같은 디바이스 재구독 시 UPSERT (user_id 도 함께 갱신)
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";

import { requireUser } from "@/lib/auth/get-user";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { API_ERROR_CODES } from "@/types/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export async function POST(request: Request) {
  const user = await requireUser();

  let parsed;
  try {
    const body = await request.json();
    parsed = subscribeSchema.safeParse(body);
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: API_ERROR_CODES.VALIDATION_FAILED,
          message: "요청 형식이 올바르지 않아요.",
        },
      },
      { status: 400 },
    );
  }
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: API_ERROR_CODES.VALIDATION_FAILED,
          message: "PushSubscription 형식이 올바르지 않아요.",
        },
      },
      { status: 400 },
    );
  }

  const { endpoint, keys } = parsed.data;

  try {
    // endpoint 가 UNIQUE — 충돌 시 user_id, keys, errorCount 갱신
    await db
      .insert(pushSubscriptions)
      .values({
        userId: user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: {
          userId: user.id,
          p256dh: keys.p256dh,
          auth: keys.auth,
          errorCount: 0,
          lastSentAt: sql`NULL`,
        },
      });
  } catch (e) {
    console.error("[push/subscribe] DB error", e);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: API_ERROR_CODES.INTERNAL_ERROR,
          message: "구독 저장에 실패했어요. 잠시 후 다시 시도해 주세요.",
        },
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, data: { subscribed: true } });
}

/** 현재 사용자의 구독 여부 조회 — 토글 초기 상태용. */
export async function GET() {
  const user = await requireUser();
  const rows = await db
    .select({ endpoint: pushSubscriptions.endpoint })
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, user.id))
    .limit(50);

  return NextResponse.json({
    ok: true,
    data: {
      count: rows.length,
      endpoints: rows.map((r) => r.endpoint),
    },
  });
}
