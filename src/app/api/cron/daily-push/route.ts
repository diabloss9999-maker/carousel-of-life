/**
 * 매일 아침 푸시 알림 cron.
 *
 * Vercel Cron 매일 08:00 KST (UTC 23:00 전날) 호출:
 *   vercel.json:
 *     { "path": "/api/cron/daily-push", "schedule": "0 23 * * *" }
 *
 * 로직:
 *   1. push_subscriptions 전체 순회 (sendToAll)
 *   2. 한국 시간 요일·날짜 기반으로 짧은 teaser 메시지 선택
 *   3. 클릭 → /today (개인화된 오늘의 운세)
 *
 * 비용 고려:
 *   - 사용자별 AI 호출 없이 정적 메시지 풀에서 선택 → 1만 명 발송도 무비용
 *   - 실제 운세는 /today 진입 시점에 생성 (기존 캐시 활용)
 */
import { NextResponse, type NextRequest } from "next/server";

import { sendToAll, type PushPayload } from "@/lib/push/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Vercel Cron 인증. CRON_SECRET 미설정이면 검증 생략. */
function isAuthorizedCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

/**
 * 오늘의 teaser 메시지 풀.
 * 30개 — 한 달간 매일 다른 알림.
 */
const TEASER_MESSAGES: ReadonlyArray<{ title: string; body: string }> = [
  { title: "오늘의 별 — 인생의 회전목마", body: "별의 흐름이 새 페이지를 넘겼어요. 오늘의 운세를 확인해보세요." },
  { title: "오늘은 어떤 카드가 떠올랐을까", body: "타로 한 장이 당신을 기다리고 있어요." },
  { title: "사주의 한 줄", body: "오늘 당신에게 어울리는 사주풀이가 도착했어요." },
  { title: "별이 속삭이는 아침", body: "오늘의 별자리 운세가 준비되었어요." },
  { title: "오늘의 한 줄", body: "회전목마가 한 바퀴 더 돌았어요. 오늘의 운명을 살펴봐요." },
  { title: "운명의 신호", body: "오늘은 어떤 점이 당신을 부를까요? 들어와 확인해보세요." },
  { title: "조심스레 도착한 메시지", body: "오늘 당신을 위한 별빛 한 조각이 도착했어요." },
  { title: "별의 흐름이 바뀌었어요", body: "오늘 하루를 풀어줄 한 마디가 기다려요." },
  { title: "오늘의 카드 한 장", body: "타로가 당신에게 건네는 오늘의 조언." },
  { title: "운세가 도착했어요", body: "잠깐 들러서 오늘의 별을 받아가요." },
  { title: "별이 살짝 기울었어요", body: "오늘은 평소와 조금 다른 흐름이에요. 확인해볼래요?" },
  { title: "오늘 어울리는 색", body: "별이 골라준 오늘의 컬러가 있어요." },
  { title: "오늘의 사주 한 마디", body: "당신의 천간이 들려주는 짧은 이야기." },
  { title: "회전목마, 오늘의 좌석", body: "오늘 당신이 앉을 자리를 별이 정해뒀어요." },
  { title: "타로, 오늘의 답", body: "어제의 질문에 카드가 답을 준비했어요." },
  { title: "오늘의 운, 한 조각", body: "사주가 알려주는 오늘의 작은 길조." },
  { title: "별이 비추는 방향", body: "오늘 발걸음을 어디로 옮기면 좋을까요?" },
  { title: "오늘의 키워드", body: "별이 골라준 단어 하나, 오늘을 비춰줄 거예요." },
  { title: "별과 카드, 그 사이", body: "오늘의 풀이를 가볍게 살펴봐요." },
  { title: "회전목마가 한 칸 돌았어요", body: "어제와 다른 오늘이 펼쳐졌어요." },
  { title: "오늘의 행운 시간", body: "사주가 짚어준 오늘의 좋은 시간대가 있어요." },
  { title: "별빛 짧은 인사", body: "오늘도 잘 부탁해요 — 오늘의 운세 확인해보기." },
  { title: "오늘의 조심할 점", body: "별이 살짝 알려주는 오늘의 주의 사항." },
  { title: "타로, 짧은 한 장", body: "오늘은 어떤 카드가 떠올랐을까요?" },
  { title: "오늘의 만남", body: "오늘 마주칠 사람과의 흐름을 별이 짚어줘요." },
  { title: "오늘의 마음 자세", body: "사주가 권하는 오늘의 마음가짐." },
  { title: "별이 골라준 오늘", body: "당신을 위한 오늘의 한 줄이 도착했어요." },
  { title: "오늘은 어떤 날일까", body: "별의 흐름이 정해준 오늘을 살펴봐요." },
  { title: "운명, 오늘의 한 줄", body: "회전목마가 들려주는 오늘의 짧은 풀이." },
  { title: "오늘의 별이 떴어요", body: "들어와서 오늘의 운세를 받아가세요." },
];

/** 날짜 기반 인덱스 — 같은 날은 같은 메시지. */
function pickTeaser(): { title: string; body: string } {
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24),
  );
  return TEASER_MESSAGES[dayOfYear % TEASER_MESSAGES.length];
}

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const teaser = pickTeaser();
  const payload: PushPayload = {
    title: teaser.title,
    body: teaser.body,
    url: "/today",
    tag: `daily-${new Date().toISOString().slice(0, 10)}`,
    renotify: false,
  };

  const result = await sendToAll(payload);

  return NextResponse.json({
    ok: true,
    payload: { title: payload.title, body: payload.body },
    ...result,
  });
}
