import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth/get-user";
import { sendByEndpoint } from "@/lib/push/service";
import { API_ERROR_CODES } from "@/types/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const testPushSchema = z.object({
  endpoint: z.string().url(),
});

export async function POST(request: Request) {
  const user = await requireUser();

  let parsed;
  try {
    parsed = testPushSchema.safeParse(await request.json());
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
          message: "알림 endpoint가 올바르지 않아요.",
        },
      },
      { status: 400 },
    );
  }

  const result = await sendByEndpoint(user.id, parsed.data.endpoint, {
    title: "인생의 회전목마",
    body: "테스트 알림이 도착했어요. 이제 오늘 운세와 리포트 알림을 받을 수 있어요.",
    url: "/settings",
    tag: "carousel-test-push",
    renotify: true,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: API_ERROR_CODES.INTERNAL_ERROR,
          message:
            result.message ??
            "테스트 알림 발송에 실패했어요. 알림을 껐다가 다시 켜 주세요.",
        },
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, data: { sent: true } });
}
