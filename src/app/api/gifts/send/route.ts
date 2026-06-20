/**
 * 멤버에게 선물 보내기.
 *
 * POST /api/gifts/send   body: { characterId, giftId }
 *   → { ok: true, data: { balance, thanks, affinityPoints, giftName } }
 *
 * 별조각 잔액에서 선물 가격을 차감하고, 해당 멤버 친밀도를 올린다.
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireProfile } from "@/lib/auth/get-user";
import { CHARACTERS, type CharacterId } from "@/lib/chat/characters";
import { sendGift } from "@/lib/gifts/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  characterId: z.string().min(1).max(30),
  giftId: z.string().min(1).max(40),
});

export async function POST(req: NextRequest) {
  let parsed;
  try {
    parsed = bodySchema.safeParse(await req.json());
  } catch {
    return NextResponse.json(
      { ok: false, error: { message: "요청을 해석하지 못했어요." } },
      { status: 400 },
    );
  }
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { message: "요청 값이 올바르지 않아요." } },
      { status: 400 },
    );
  }

  const characterId = parsed.data.characterId as CharacterId;
  if (!CHARACTERS[characterId]) {
    return NextResponse.json(
      { ok: false, error: { message: "알 수 없는 멤버예요." } },
      { status: 400 },
    );
  }

  const { profile } = await requireProfile();
  const result = await sendGift(profile.userId, characterId, parsed.data.giftId);

  if (!result.ok) {
    const message =
      result.code === "INSUFFICIENT_BALANCE"
        ? "별조각이 부족해요. 충전 후 다시 시도해주세요."
        : "알 수 없는 선물이에요.";
    return NextResponse.json(
      { ok: false, error: { code: result.code, message } },
      { status: result.code === "INSUFFICIENT_BALANCE" ? 402 : 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      balance: result.balance,
      thanks: result.thanks,
      affinityPoints: result.affinityPoints,
      giftName: result.gift.name,
      giftEmoji: result.gift.emoji,
    },
  });
}
