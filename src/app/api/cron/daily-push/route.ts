/**
 * Daily morning push cron.
 *
 * Vercel Cron calls this at 08:00 KST (23:00 UTC previous day):
 *   vercel.json:
 *     { "path": "/api/cron/daily-push", "schedule": "0 23 * * *" }
 *
 * The actual reading is generated when the user opens /today. This route only
 * picks a deterministic teaser by userId + date, so large sends stay cheap.
 */
import { NextResponse, type NextRequest } from "next/server";

import { sendToAll, type PushPayload } from "@/lib/push/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorizedCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

const TEASER_MESSAGES: ReadonlyArray<{ title: string; body: string }> = [
  { title: "오늘의 한 줄", body: "오늘은 빠른 답보다 덜 후회할 답을 고르는 날이에요." },
  { title: "오늘의 한 줄", body: "괜찮은 척을 오래 하면, 진짜 괜찮아질 시간이 줄어들어요." },
  { title: "오늘의 한 줄", body: "오늘의 운은 크게 이기는 쪽보다 흐트러지지 않는 쪽에 가까워요." },
  { title: "오늘의 한 줄", body: "상대의 말보다 내 반응이 오늘의 방향을 더 많이 바꿔요." },
  { title: "오늘의 한 줄", body: "지금 붙잡고 있는 일이 나를 지키는 건지, 묶는 건지 봐야 해요." },
  { title: "오늘의 한 줄", body: "오늘은 먼저 움직이는 것보다, 한 번 덜 설명하는 게 이득이에요." },
  { title: "오늘의 한 줄", body: "마음이 급해지는 순간이 오늘의 가장 중요한 신호예요." },
  { title: "오늘의 한 줄", body: "좋은 기회는 시끄럽게 오지 않고, 이상하게 자꾸 눈에 밟혀요." },
  { title: "오늘의 한 줄", body: "오늘은 더 잘하려고 애쓰기보다 덜 망가지는 선택이 필요해요." },
  { title: "오늘의 한 줄", body: "대답을 미루는 것도 오늘은 꽤 정확한 대답이 될 수 있어요." },
  { title: "오늘의 한 줄", body: "돈은 아끼는 것보다 새는 구멍을 알아차리는 쪽이 먼저예요." },
  { title: "오늘의 한 줄", body: "괜히 날카로워지는 사람보다 조용히 거리를 조절하는 사람이 이겨요." },
  { title: "오늘의 한 줄", body: "오늘은 시작보다 마무리가 운을 데려와요." },
  { title: "오늘의 한 줄", body: "나를 피곤하게 만드는 약속은 좋은 약속이어도 조정이 필요해요." },
  { title: "오늘의 한 줄", body: "오늘의 행운은 새로운 선택보다 이미 알고 있던 정답 쪽에 있어요." },
  { title: "오늘의 한 줄", body: "자존심이 올라오는 순간, 사실은 마음이 다친 쪽을 봐야 해요." },
  { title: "오늘의 한 줄", body: "오늘은 센 말보다 정확한 침묵이 더 오래 남아요." },
  { title: "오늘의 한 줄", body: "지금 너무 쉬운 선택은 나중에 설명이 길어질 수 있어요." },
  { title: "오늘의 한 줄", body: "관계운은 다가가는 힘보다 멈출 줄 아는 감각에서 좋아져요." },
  { title: "오늘의 한 줄", body: "오늘은 나를 증명하는 날이 아니라 나를 소모하지 않는 날이에요." },
  { title: "오늘의 한 줄", body: "한 번 더 확인하는 사람이 오늘의 실수를 가장 적게 가져가요." },
  { title: "오늘의 한 줄", body: "감정이 앞설수록 메시지는 짧게, 결정은 늦게가 좋아요." },
  { title: "오늘의 한 줄", body: "좋아 보이는 흐름보다 편안하게 유지되는 흐름을 믿어도 돼요." },
  { title: "오늘의 한 줄", body: "오늘의 핵심은 더 많이 하는 게 아니라, 덜 흔들리는 거예요." },
  { title: "오늘의 한 줄", body: "혼자 감당하려는 습관이 오늘의 피로를 키울 수 있어요." },
  { title: "오늘의 한 줄", body: "작게 미룬 일이 의외로 크게 마음을 편하게 만들어요." },
  { title: "오늘의 한 줄", body: "오늘은 예감보다 기록을 믿는 쪽이 더 안전해요." },
  { title: "오늘의 한 줄", body: "상대가 애매할수록 내 기준은 더 간단해야 해요." },
  { title: "오늘의 한 줄", body: "오늘의 좋은 운은 크게 오는 게 아니라, 덜 새는 쪽으로 와요." },
  { title: "오늘의 한 줄", body: "마음이 복잡하면 답을 찾기 전에 먼저 속도를 낮춰야 해요." },
];

function hashUserDay(userId: string, dayOfYear: number): number {
  let hash = dayOfYear;
  for (let i = 0; i < userId.length; i += 1) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function dayOfYear(now: Date): number {
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86_400_000);
}

function pickTeaserFor(userId: string, day: number): { title: string; body: string } {
  return TEASER_MESSAGES[hashUserDay(userId, day) % TEASER_MESSAGES.length];
}

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const today = new Date();
  const day = dayOfYear(today);
  const dateTag = `daily-${today.toISOString().slice(0, 10)}`;

  const result = await sendToAll((userId) => {
    const teaser = pickTeaserFor(userId, day);
    const payload: PushPayload = {
      title: teaser.title,
      body: teaser.body,
      url: "/today",
      tag: dateTag,
      renotify: false,
    };
    return payload;
  });

  return NextResponse.json({ ok: true, ...result });
}
