/**
 * 웹 푸시 구독 해제 API.
 *
 * POST /api/push/unsubscribe
 *   body: { endpoint: string }  — 해당 endpoint 만 삭제 (단일 디바이스)
 *   body: { all: true }         — 현재 사용자의 모든 구독 삭제
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";

import { requireUser } from "@/lib/auth/get-user";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { API_ERROR_CODES } from "@/types/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const unsubscribeSchema = z.union([
  z.object({ endpoint: z.string().url() }),
  z.object({ all: z.literal(true) }),
]);

export async function POST(request: Request) {
  const user = await requireUser();

  let parsed;
  try {
    const body = await request.json();
    parsed = unsubscribeSchema.safeParse(body);
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
          message: "해제할 endpoint 가 누락되었어요.",
        },
      },
      { status: 400 },
    );
  }

  try {
    if ("all" in parsed.data) {
      await db
        .delete(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, user.id));
    } else {
      await db
        .delete(pushSubscriptions)
        .where(
          and(
            eq(pushSubscriptions.userId, user.id),
            eq(pushSubscriptions.endpoint, parsed.data.endpoint),
          ),
        );
    }
  } catch (e) {
    console.error("[push/unsubscribe] DB error", e);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: API_ERROR_CODES.INTERNAL_ERROR,
          message: "해제에 실패했어요. 잠시 후 다시 시도해 주세요.",
        },
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, data: { unsubscribed: true } });
}
