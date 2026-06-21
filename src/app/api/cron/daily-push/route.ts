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
  { title: "오늘 운세가 준비됐어요", body: "하루를 시작하기 전에 오늘 조심할 점과 행운 포인트를 확인해요." },
  { title: "오늘의 흐름 확인하기", body: "관계, 일, 컨디션 중 어디에 힘을 줄지 짧게 정리해볼까요?" },
  { title: "아침 운세 리포트", body: "오늘의 선택 기준과 피하면 좋은 타이밍을 가볍게 확인해요." },
  { title: "오늘 조심할 점", body: "말, 돈, 일정 중 어디를 살피면 좋을지 오늘 운세에서 확인해요." },
  { title: "오늘의 행운 포인트", body: "색, 시간대, 대화 흐름까지 오늘 써먹을 힌트를 모았어요." },
  { title: "잠깐, 오늘 운세", body: "하루가 바빠지기 전에 오늘의 방향을 먼저 잡아보세요." },
  { title: "오늘 마음 체크", body: "지금 감정이 어디로 기울어 있는지 운세로 가볍게 정리해요." },
  { title: "오늘의 선택 기준", body: "밀어붙일 일과 한 박자 늦출 일을 먼저 구분해볼까요?" },
  { title: "오늘 대화운 보기", body: "괜히 오해가 생기기 쉬운 말투와 좋은 대화 타이밍을 확인해요." },
  { title: "오늘 금전운 보기", body: "소비, 기회, 조율할 지점을 짧게 점검해보세요." },
  { title: "오늘 일운 보기", body: "일정과 집중력이 잘 맞는 시간을 먼저 확인해요." },
  { title: "오늘 컨디션 체크", body: "무리하기 좋은 날인지, 쉬어가야 하는 날인지 먼저 살펴봐요." },
  { title: "오늘 타로 한 장", body: "마음에 걸리는 질문이 있다면 카드 한 장으로 정리해볼 수 있어요." },
  { title: "오늘의 관계 힌트", body: "다가갈지, 기다릴지, 짧게 말할지 오늘 흐름으로 확인해요." },
  { title: "오늘의 리듬", body: "빠르게 움직일 순간과 천천히 봐야 할 순간을 나눠봤어요." },
  { title: "오늘 운세 1분 체크", body: "길게 읽기 전, 오늘의 핵심만 먼저 확인해보세요." },
  { title: "오늘 해볼 작은 선택", body: "크게 바꾸지 않아도 되는 하루의 작은 방향을 추천해요." },
  { title: "오늘의 주의 신호", body: "반복되는 실수를 줄이기 위한 짧은 체크포인트가 있어요." },
  { title: "오늘의 좋은 시간", body: "연락, 결정, 정리에 어울리는 시간을 확인해요." },
  { title: "오늘의 한 줄", body: "지금 필요한 태도와 오늘의 키워드를 짧게 정리했어요." },
  { title: "하루 시작 전 체크", body: "오늘 운세로 마음의 속도와 일의 우선순위를 맞춰봐요." },
  { title: "오늘의 기분 방향", body: "기분이 흔들릴 때 붙잡을 기준을 먼저 확인해요." },
  { title: "오늘의 타이밍", body: "서두를 일과 기다릴 일을 나눠보면 하루가 조금 편해져요." },
  { title: "오늘 필요한 말", body: "관계에서 도움이 되는 말투와 피하면 좋은 표현을 확인해요." },
  { title: "오늘의 집중 포인트", body: "일, 공부, 정리 중 어디에 힘을 쓰면 좋을지 살펴봐요." },
  { title: "오늘의 운세 알림", body: "하루를 시작하기 전에 오늘의 흐름을 짧게 확인해요." },
  { title: "오늘 나에게 맞는 흐름", body: "내 프로필 기준으로 오늘의 운세를 다시 정리해볼까요?" },
  { title: "오늘의 작은 전략", body: "관계, 돈, 일에서 무리하지 않는 방향을 먼저 잡아봐요." },
  { title: "오늘의 체크리스트", body: "좋은 흐름은 살리고, 조심할 흐름은 가볍게 피해가요." },
  { title: "오늘 운세 보러가기", body: "오늘의 핵심, 행운 포인트, 조심할 점이 준비됐어요." },
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
