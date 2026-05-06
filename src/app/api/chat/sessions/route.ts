/**
 * 새 채팅 세션 생성 API.
 *
 * POST /api/chat/sessions
 *  → { sessionId } 반환
 */
import { NextResponse } from "next/server";

import { requireProfile } from "@/lib/auth/get-user";
import { createSession } from "@/lib/chat/service";
import { API_ERROR_CODES } from "@/types/api";

export async function POST() {
  try {
    const { profile } = await requireProfile();
    const session = await createSession({ userId: profile.userId });
    return NextResponse.json({ ok: true, data: { sessionId: session.id } });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: API_ERROR_CODES.INTERNAL_ERROR,
          message: e instanceof Error ? e.message : "세션 생성 실패",
        },
      },
      { status: 500 },
    );
  }
}
