/**
 * 별조각 잔액 조회.
 *
 * GET /api/currency → { ok: true, data: { balance } }
 */
import { NextResponse } from "next/server";

import { requireProfile } from "@/lib/auth/get-user";
import { getBalance } from "@/lib/gifts/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { profile } = await requireProfile();
    const balance = await getBalance(profile.userId);
    return NextResponse.json({ ok: true, data: { balance } });
  } catch {
    return NextResponse.json(
      { ok: false, error: { message: "잔액을 불러오지 못했어요." } },
      { status: 500 },
    );
  }
}
