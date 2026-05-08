/**
 * 새 채팅 세션 생성 API.
 *
 * POST /api/chat/sessions
 *   body: { character?: "witch" | "child" | "sage" }
 *  → { sessionId } 반환
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireProfile } from "@/lib/auth/get-user";
import { createSession } from "@/lib/chat/service";
import { DEFAULT_CHARACTER } from "@/lib/chat/characters";
import { API_ERROR_CODES } from "@/types/api";

const bodySchema = z.object({
  character: z.enum(["witch", "child", "sage"]).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { profile } = await requireProfile();

    let character = DEFAULT_CHARACTER;
    try {
      const body = await request.json();
      const parsed = bodySchema.safeParse(body);
      if (parsed.success && parsed.data.character) {
        character = parsed.data.character;
      }
    } catch {
      // body 없으면 기본 캐릭터 사용
    }

    const session = await createSession({ userId: profile.userId, character });
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
