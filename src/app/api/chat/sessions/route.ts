/**
 * 새 채팅 세션 생성 API.
 *
 * POST /api/chat/sessions
 *   body: { character?: CharacterId }
 *  → { sessionId } 반환
 */
import { NextResponse, type NextRequest } from "next/server";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { requireProfile } from "@/lib/auth/get-user";
import { createSession, findOrCreateSessionForCharacter } from "@/lib/chat/service";
import { DEFAULT_CHARACTER } from "@/lib/chat/characters";
import { getCharacterVacation } from "@/lib/chat/character-vacation";
import { API_ERROR_CODES } from "@/types/api";

const bodySchema = z.object({
  character: z
    .enum([
      "witch", "child", "sage",
      "shaman", "taoist", "dokkaebi",
      "hunter", "runeshaman", "god",
    ])
    .optional(),
  /** true이면 강제로 새 세션 생성. 기본은 false (기존 세션 이어가기). */
  fresh: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { profile } = await requireProfile();

    let character = DEFAULT_CHARACTER;
    let fresh = false;
    try {
      const body = await request.json();
      const parsed = bodySchema.safeParse(body);
      if (parsed.success) {
        if (parsed.data.character) character = parsed.data.character;
        if (parsed.data.fresh) fresh = true;
      }
    } catch {
      // body 없으면 기본값 사용
    }

    const vacation = getCharacterVacation(character);
    if (vacation) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: API_ERROR_CODES.CHARACTER_ON_VACATION,
            message: "오늘은 이 점술사가 휴가 중이에요. 다른 점술사를 추천할게요.",
            details: {
              characterId: vacation.characterId,
              recommendationId: vacation.recommendationId,
            },
          },
        },
        { status: 409 },
      );
    }

    // fresh=true면 새로 생성, 아니면 기존 세션 이어가기
    const { session, resumed } = fresh
      ? { session: await createSession({ userId: profile.userId, character }), resumed: false }
      : await findOrCreateSessionForCharacter({ userId: profile.userId, character });

    return NextResponse.json({
      ok: true,
      data: { sessionId: session.id, resumed },
    });
  } catch (e) {
    const tErr = await getTranslations("actionErrors");
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: API_ERROR_CODES.INTERNAL_ERROR,
          message: e instanceof Error ? e.message : tErr("sessionCreateFailed"),
        },
      },
      { status: 500 },
    );
  }
}
