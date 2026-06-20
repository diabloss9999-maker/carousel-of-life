/**
 * Chat session creation API.
 *
 * POST /api/chat/sessions
 * body: { character?: CharacterId, fresh?: boolean }
 * returns: { sessionId, resumed }
 */
import { NextResponse, type NextRequest } from "next/server";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { requireProfile } from "@/lib/auth/get-user";
import {
  createSession,
  findOrCreateSessionForCharacter,
} from "@/lib/chat/service";
import { DEFAULT_CHARACTER } from "@/lib/chat/characters";
import { API_ERROR_CODES } from "@/types/api";

const bodySchema = z.object({
  character: z
    .enum([
      "witch",
      "child",
      "sage",
      "shaman",
      "taoist",
      "dokkaebi",
      "hunter",
      "runeshaman",
      "god",
    ])
    .optional(),
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
      // Empty or invalid JSON body falls back to defaults.
    }

    const { session, resumed } = fresh
      ? {
          session: await createSession({ userId: profile.userId, character }),
          resumed: false,
        }
      : await findOrCreateSessionForCharacter({
          userId: profile.userId,
          character,
        });

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
