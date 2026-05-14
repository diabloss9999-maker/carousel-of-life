/**
 * 세션 삭제 API.
 *
 * DELETE /api/chat/sessions/[sessionId]
 */
import { NextResponse, type NextRequest } from "next/server";
import { getTranslations } from "next-intl/server";

import { requireProfile } from "@/lib/auth/get-user";
import { deleteSession } from "@/lib/chat/service";
import { API_ERROR_CODES } from "@/types/api";

export async function DELETE(
  _request: NextRequest,
  ctx: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await ctx.params;
  const { profile } = await requireProfile();

  const ok = await deleteSession({ sessionId, userId: profile.userId });
  if (!ok) {
    const tErr = await getTranslations("actionErrors");
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: API_ERROR_CODES.NOT_FOUND,
          message: tErr("sessionNotFound"),
        },
      },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, data: { deleted: true } });
}
