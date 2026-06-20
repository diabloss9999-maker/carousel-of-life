import { NextResponse, type NextRequest } from "next/server";
import { getTranslations } from "next-intl/server";

import { requireProfile } from "@/lib/auth/get-user";
import {
  deleteHistoryItem,
  type HistoryKind,
} from "@/lib/history/service";
import { API_ERROR_CODES } from "@/types/api";

const VALID_KINDS = new Set<HistoryKind>([
  "fortune",
  "tarot",
  "compatibility",
]);

export async function DELETE(
  _request: NextRequest,
  ctx: { params: Promise<{ kind: string; id: string }> },
) {
  const { kind, id } = await ctx.params;
  const tErr = await getTranslations("actionErrors");

  if (!VALID_KINDS.has(kind as HistoryKind)) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: API_ERROR_CODES.VALIDATION_FAILED,
          message: tErr("validationFailed"),
        },
      },
      { status: 400 },
    );
  }

  const { profile } = await requireProfile();
  const deleted = await deleteHistoryItem(
    profile.userId,
    kind as HistoryKind,
    id,
  );

  if (!deleted) {
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
