/**
 * 멤버 선톡 cron.
 *
 * Vercel Cron 매일 20:00 KST (UTC 11:00) 호출:
 *   vercel.json:
 *     { "path": "/api/cron/member-dm", "schedule": "0 11 * * *" }
 *
 * 푸시 구독한 사용자에게, 최근 대화한 멤버가 "설레는 한 줄"을 먼저 보낸다.
 * 상세 로직은 @/lib/push/member-dm 참고.
 */
import { NextResponse, type NextRequest } from "next/server";

import { sendMemberDms, type DmSlot } from "@/lib/push/member-dm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Vercel Cron 인증. CRON_SECRET 미설정이면 production 외에서만 허용. */
function isAuthorizedCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // ?slot=noon(12:30 KST) | evening(20:00 KST, 기본). 사용자별 일일 해시로
  // 두 시간대 중 하나에만 발송된다 — 매일 다른 시간에 오는 느낌.
  const slotParam = req.nextUrl.searchParams.get("slot");
  const slot: DmSlot = slotParam === "noon" ? "noon" : "evening";

  const result = await sendMemberDms(slot);
  return NextResponse.json({ ok: true, slot, ...result });
}
