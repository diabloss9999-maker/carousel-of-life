/**
 * 운세 공유 페이지 생성 API.
 *
 * POST /api/share/create
 *   body: {
 *     fortuneId: string (uuid),   // 본인의 daily_fortunes.id
 *     showDisplayName?: boolean,  // 익명 vs 닉네임 노출 (기본 false)
 *   }
 *
 * 응답: { id: string, url: string }
 *
 * - 본인의 운세만 봉인 가능 (userId 검증)
 * - 같은 운세를 여러 번 봉인해도 매번 새 토큰 발급 (SNS 채널별 추적)
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";

import { requireProfile } from "@/lib/auth/get-user";
import { db } from "@/db";
import { dailyFortunes } from "@/db/schema";
import {
  createSharedFortune,
  buildShareUrl,
  type FortuneSnapshot,
} from "@/lib/share/service";
import { CHARACTERS } from "@/lib/chat/characters";
import {
  getTodayCharacter,
  getTodayCharacterByCategory,
} from "@/lib/daily-question/rotation";
import { clientEnv } from "@/lib/env";
import { API_ERROR_CODES } from "@/types/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  fortuneId: z.string().uuid(),
  showDisplayName: z.boolean().optional(),
});

/** 카테고리·날짜 기반 해설 캐릭터 — FortuneCard 와 동일 로직. */
function pickCharacter(category: string, date: string) {
  if (category === "zodiac")
    return getTodayCharacterByCategory("북유럽", date);
  if (category === "chinese_zodiac")
    return getTodayCharacterByCategory("동양", date);
  return getTodayCharacter(date);
}

export async function POST(request: Request) {
  const { user, profile } = await requireProfile();

  let parsed;
  try {
    const body = await request.json();
    parsed = bodySchema.safeParse(body);
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
          message: "fortuneId 가 필요해요.",
        },
      },
      { status: 400 },
    );
  }

  // 본인의 운세 row 가져오기
  const [fortune] = await db
    .select()
    .from(dailyFortunes)
    .where(
      and(
        eq(dailyFortunes.id, parsed.data.fortuneId),
        eq(dailyFortunes.userId, user.id),
      ),
    )
    .limit(1);

  if (!fortune) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: API_ERROR_CODES.NOT_FOUND,
          message: "공유할 운세를 찾지 못했어요.",
        },
      },
      { status: 404 },
    );
  }

  // 캐릭터 결정
  const charId = pickCharacter(fortune.category, fortune.fortuneDate);
  const character = CHARACTERS[charId];

  const snapshot: FortuneSnapshot = {
    title: fortune.title,
    content: fortune.content,
    score: fortune.score,
    luckyColor: fortune.luckyColor,
    luckyNumber: fortune.luckyNumber,
    luckyDirection: fortune.luckyDirection,
    fortuneDate: fortune.fortuneDate,
    character: {
      id: charId,
      name: character?.name ?? "점술사",
      title: character?.title ?? "",
    },
  };

  let id: string;
  try {
    id = await createSharedFortune({
      userId: user.id,
      category: fortune.category,
      snapshot,
      showDisplayName: parsed.data.showDisplayName ?? false,
    });
  } catch (e) {
    console.error("[share/create] failed", e);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: API_ERROR_CODES.INTERNAL_ERROR,
          message: "공유 링크 생성에 실패했어요. 잠시 후 다시 시도해 주세요.",
        },
      },
      { status: 500 },
    );
  }

  // displayName 가 노출 옵션일 때 fallback 처리
  void profile.displayName;

  const origin = clientEnv.NEXT_PUBLIC_APP_URL ?? "https://carouseloflife.com";
  return NextResponse.json({
    ok: true,
    data: {
      id,
      url: buildShareUrl(id, origin),
    },
  });
}
