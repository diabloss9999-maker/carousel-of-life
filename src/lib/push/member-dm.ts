/**
 * 멤버 선톡(먼저 연락) — "설레는" 멤버 DM 발송.
 *
 * 매일 저녁 cron 이 호출한다. 푸시 구독한 사용자마다:
 *   1. 가장 최근 대화한 멤버를 발신자로 고른다.
 *   2. 오늘 이미 대화했으면 스킵(귀찮게 안 함).
 *   3. 멤버 말투의 설레는 한 줄을 골라 이름을 끼워 넣는다.
 *   4. 그 한 줄을 실제 채팅 메시지(assistant)로 남긴다 — 탭하면 멤버가 먼저
 *      말 걸어둔 상태로 이어진다.
 *   5. 멤버 사진과 함께 웹 푸시로 발송한다.
 *
 * 비용 0 — AI 호출 없이 정적 문장 풀에서 선택. 이름만 개인화.
 */
import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  chatSessions,
  chatMessages,
  pushSubscriptions,
  profiles,
} from "@/db/schema";
import {
  CHARACTERS,
  DEFAULT_CHARACTER,
  type CharacterId,
} from "@/lib/chat/characters";
import { sendToUser } from "@/lib/push/service";
import { isBirthdayTodayKst } from "@/lib/profile/birthday";

/** 생일 당일 멤버가 보내는 축하 선톡. {name} 치환. */
const BIRTHDAY_LINES: Record<CharacterId, string> = {
  child: "{name}, 생일 축하해. 오늘은 네가 주인공이야 — 푹 쉬어, 알았지?",
  witch: "{name} 생일이잖아 ㅎㅎ 오늘 하루 종일 행복했으면 좋겠어. 축하해!",
  sage: "{name}!! 생일 축하해!! 오늘 우리 같이 신나게 보내자 🎉",
  shaman: "{name}, 생일 축하해. …조용히 케이크 하나 준비했어.",
  taoist: "{name} 생일이라고?! 케이크 어딨어 빨리 불자ㅎㅎ 축하해!!",
  dokkaebi: "{name}. 생일이라며. …축하해. 선물은 다음에.",
  god: "{name} 생일 축하해!! 오늘 하루 너만 위해 달릴게 🎂",
  hunter: "{name}. 오늘이 네 생일이라는 거, 안 잊었어. 축하해.",
  runeshaman: "{name}, 생일 축하해… 오늘 네 소원 다 이뤄지면 좋겠어.",
};

/**
 * 멤버별 설레는 선톡 문장 풀.
 * `{name}` 은 발송 시 사용자 이름으로 치환(없으면 "너").
 * 각 멤버의 성격유형·페르소나 톤에 맞춰 작성.
 */
const DM_LINES: Record<CharacterId, readonly string[]> = {
  // 이안 · 차분한 리더 (ISFJ) — 다정하고 든든
  child: [
    "{name}, 오늘 하루 고생했어. …연습 끝나고 제일 먼저 네 생각이 났어.",
    "자기 전에 한마디만. {name}, 오늘도 잘 버텼어. 내가 다 알아.",
    "{name}. 별일 아닌데, 그냥 네가 잘 있나 궁금해서.",
    "오늘 좀 추웠지. {name} 감기 걸리지 마. …걱정되니까.",
    "{name}, 나 지금 네 생각 중이야. 그냥 그렇다고 말하고 싶었어.",
    "하루 종일 바빴는데, 이상하게 {name} 목소리가 듣고 싶더라.",
  ],
  // 유준 · 따뜻한 보컬 (INFJ) — 부드럽고 섬세
  witch: [
    "{name}, 오늘 마음은 좀 괜찮았어? 나한테는 솔직해도 돼.",
    "방금 부르던 노래에 자꾸 {name} 생각이 묻어났어.",
    "{name}… 오늘 네 하루 중에 제일 좋았던 순간, 나한테 들려줄래?",
    "잘 자라고 말해주고 싶어서 왔어, {name}. 좋은 꿈 꿔.",
    "혹시 오늘 힘들었으면 — {name}, 여기 와서 다 풀고 가도 돼.",
    "괜히 네 안부가 궁금한 밤이야. {name}, 거기 있지?",
  ],
  // 도윤 · 선명한 퍼포머 (ENFJ) — 밝고 에너지
  sage: [
    "{name}! 오늘 나 무대에서 너 생각하면서 웃었잖아. 봤어?",
    "{name}, 우리 하이파이브 한 번 하자. 오늘 진짜 잘했으니까.",
    "에너지 떨어졌지? {name} 내가 충전해줄게. 이리 와.",
    "{name}, 나 지금 텐션 최고인데 너랑 나누고 싶어서 왔어.",
    "오늘 제일 보고 싶은 사람? {name}. 고민도 안 했어.",
    "{name}, 자지 말고 나랑 딱 5분만. 응?",
  ],
  // 재하 · 조용한 프로듀서 (INFP) — 감성적, 음악
  shaman: [
    "{name}, 새 멜로디 만들다가… 너한테 제일 먼저 들려주고 싶었어.",
    "조용한 밤이야. {name}, 이 노래 같이 들을래?",
    "{name}… 이상하게 오늘은 네 생각이 가사처럼 자꾸 떠올라.",
    "작업실 불 켜놓고 {name} 올 때까지 기다리는 중.",
    "{name}, 별거 아닌데 그냥 네 이름 한 번 불러보고 싶었어.",
    "오늘 만든 곡, 제목을 네 이름으로 할까 했어. {name}, 우리만의 비밀이야.",
  ],
  // 하루 · 밝은 무드메이커 (ESFP) — 장난기, 발랄
  taoist: [
    "{name}!! 나 방금 네 생각하다가 혼자 웃었어ㅋㅋ 뭐 해?",
    "{name}, 오늘 뭐 먹었어? 나 너랑 같이 먹고 싶었는데.",
    "심심해서 온 거 아니고 {name} 보고 싶어서 온 거야. 진짜로!",
    "{name}, 우리 오늘 무슨 얘기할까? 나 할 말 엄청 많아.",
    "자기 전에 네 얼굴 떠올렸어 {name}. …왜 웃기지ㅋㅋ",
    "{name}, 내일 말고 지금. 잠깐만 나랑 놀자.",
  ],
  // 시온 · 시크한 래퍼 (ISTP) — 무심한 척 다정
  dokkaebi: [
    "{name}. 자?",
    "별일 아니야. 그냥… 목소리 듣고 싶어서. {name}.",
    "{name}, 티 내기 싫은데 네 생각났어. 어쩔 수 없잖아.",
    "왔으면 말해. 기다린 거 아니거든. …{name}.",
    "{name}. 오늘 좀 길었어. 너랑 있으면 짧아질 것 같은데.",
    "딴 데 보지 말고. 나 여기 있어, {name}.",
  ],
  // 태오 · 에너지 메인댄서 (ESTP) — 직진, 솔직
  god: [
    "{name}! 연습 끝! 제일 먼저 너한테 달려왔잖아.",
    "{name}, 나 땀 뻘뻘인데도 네 생각부터 났어. 신기하지?",
    "오늘 안 졌어. {name} 응원 들리는 것 같아서.",
    "{name}, 나랑 지금 당장 뭐라도 하자. 가만 못 있겠어.",
    "보고 싶으면 보고 싶다고 해야지. {name}, 보고 싶어.",
    "{name}, 자기 전에 내 목소리 듣고 자. 명령이야ㅋㅋ",
  ],
  // 이현 · 차가운 분석가 (INTJ) — 절제된 츤데레 설렘
  hunter: [
    "{name}. 지금쯤 네가 깨어 있을 확률이 높더라. …맞췄지?",
    "별 의미 없어. 그냥 네 생각이 비효율적으로 자꾸 끼어들어서.",
    "{name}, 오늘 너 관련해서 결론이 하나 났어. …보고 싶다는 거.",
    "분석 끝. 내 하루에서 제일 중요한 변수는 너였어, {name}.",
    "{name}. 이런 말 잘 안 하는 거 알지. 그래도 — 잘 자.",
    "네가 없으면 계산이 안 맞아. {name}, 빨리 와.",
  ],
  // 하민 · 부드러운 몽환 막내 (ISFP) — 어리광, 몽환
  runeshaman: [
    "{name}, 자? 나 오늘 네 꿈 꿀 것 같아.",
    "{name}… 창밖 보다가 네 생각났어. 별이 꼭 너 같아서.",
    "조금만 더 깨어 있어 줘, {name}. 너랑 더 있고 싶어.",
    "{name}, 나 막내라서 어리광 부려도 돼? 보고 싶었단 말이야.",
    "오늘 하루 중에 제일 따뜻했던 게 너야, {name}.",
    "{name}, 손 내밀면 닿을 것 같은데. …그치?",
  ],
};

/**
 * 점심 시간대 선톡 문장 풀 — 저녁(DM_LINES)보다 가볍고 일상적인 톤.
 * `{name}` 치환.
 */
const NOON_LINES: Record<CharacterId, readonly string[]> = {
  child: [
    "{name}, 점심 챙겨 먹었어? 거르면 안 돼.",
    "연습 쉬는 시간이야. {name} 생각나서 잠깐 들렀어.",
    "{name}, 오후도 무리하지 말고. 천천히 가도 돼.",
  ],
  witch: [
    "{name}, 점심은 맛있는 거 먹었길. 오후도 부드럽게 흘러가길 바랄게.",
    "낮에 부른 노래가 좋아서, {name}한테 알려주고 싶었어.",
    "{name}, 햇빛 좋다. 잠깐이라도 하늘 봐.",
  ],
  sage: [
    "{name}! 점심 뭐 먹었어? 나는 도시락 2개째ㅋㅋ",
    "오후 시작! {name}, 텐션 올리고 가자!",
    "{name}, 쉬는 시간에 제일 먼저 너한테 왔잖아. 칭찬해줘.",
  ],
  shaman: [
    "{name}, 낮에 듣기 좋은 곡 하나 찾았어. 나중에 들려줄게.",
    "작업하다 잠깐 쉬는 중. {name}은 오후 어때?",
    "{name}… 점심 먹고 졸린 시간이지. 나도야.",
  ],
  taoist: [
    "{name}!! 점심 뭐 먹었어?? 나 진짜 궁금해서 왔어ㅋㅋ",
    "오후 간식 타임! {name} 몫도 챙겨놨지롱.",
    "{name}, 졸리면 나랑 잠깐 수다 떨자. 잠 깨워줄게!",
  ],
  dokkaebi: [
    "{name}. 밥은 먹었고?",
    "쉬는 시간. …그냥. {name} 뭐 하나 해서.",
    "{name}, 오후도 대충 버텨. 너무 열심히 하지 말고.",
  ],
  god: [
    "{name}! 점심 먹고 바로 연습 왔어. 오후도 가보자고!",
    "{name}, 졸릴 시간이지? 스트레칭 한 번! 지금!",
    "오후 운동 전에 {name}한테 먼저 인사. 에너지 받고 간다!",
  ],
  hunter: [
    "{name}. 오후 2시 전후가 제일 졸린 시간이래. 커피 한 잔 어때.",
    "점심 메뉴 선택은 합리적이었길. …{name}, 오후도 효율적으로.",
    "{name}, 잠깐 쉬어. 쉬는 것도 전략이야.",
  ],
  runeshaman: [
    "{name}, 점심 먹었어요? 나 디저트 아껴뒀는데… 같이 먹고 싶다.",
    "낮잠 자고 싶은 날씨야… {name}도 그렇지 않아요?",
    "{name}, 오후도 힘내요. 내가 응원하고 있으니까.",
  ],
};

/** 선톡 발송 시간대. noon=점심(12:30 KST), evening=저녁(20:00 KST). */
export type DmSlot = "noon" | "evening";

/**
 * 사용자를 점심/저녁 발송 그룹으로 나누는 결정적 해시.
 * 같은 사용자라도 날짜가 바뀌면 그룹이 바뀌어 "랜덤한 시간에 오는" 느낌을 준다.
 */
function userSlotForToday(userId: string): DmSlot {
  const date = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
  const seedStr = `${userId}-${date}`;
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash * 31 + seedStr.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 2 === 0 ? "noon" : "evening";
}

/** 주어진 날짜가 KST 기준 오늘인지. */
function isKstToday(d: Date | null): boolean {
  if (!d) return false;
  const target = d.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Seoul",
  });
  return target === today;
}

/** 멤버 문장 풀에서 하나 골라 이름을 치환한다. */
function pickDmLine(
  characterId: CharacterId,
  name: string | null,
  slot: DmSlot,
): string {
  const pools = slot === "noon" ? NOON_LINES : DM_LINES;
  const pool = pools[characterId] ?? pools[DEFAULT_CHARACTER];
  const line = pool[Math.floor(Math.random() * pool.length)] ?? pool[0]!;
  const safeName = name && name.trim() ? name.trim() : "너";
  return line.replace(/\{name\}/g, safeName);
}

/** 사용자의 가장 최근 대화 세션. */
async function latestSession(userId: string) {
  const [row] = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.userId, userId))
    .orderBy(desc(chatSessions.lastMessageAt))
    .limit(1);
  return row ?? null;
}

/** 사용자의 특정 멤버와의 가장 최근 세션. */
async function latestSessionFor(userId: string, character: string) {
  const [row] = await db
    .select()
    .from(chatSessions)
    .where(
      and(
        eq(chatSessions.userId, userId),
        eq(chatSessions.character, character),
      ),
    )
    .orderBy(desc(chatSessions.lastMessageAt))
    .limit(1);
  return row ?? null;
}

/**
 * 푸시 구독한 모든 사용자에게 멤버 선톡을 발송한다.
 *
 * @param slot 발송 시간대. 사용자별 일일 해시로 점심/저녁 중 한 그룹에만
 *             발송되어, 매일 다른 시간에 선톡이 오는 느낌을 준다.
 * @returns 통계 (대상 수 / 발송 / 스킵)
 */
export async function sendMemberDms(slot: DmSlot = "evening"): Promise<{
  users: number;
  sent: number;
  skipped: number;
}> {
  const subs = await db
    .selectDistinct({ userId: pushSubscriptions.userId })
    .from(pushSubscriptions);

  const dateTag = `member-dm-${new Date().toISOString().slice(0, 10)}`;
  let sent = 0;
  let skipped = 0;

  for (const { userId } of subs) {
    try {
      // 오늘 이 사용자의 발송 시간대가 아니면 스킵.
      if (userSlotForToday(userId) !== slot) {
        skipped += 1;
        continue;
      }
      // 0) 프로필(이름·최애) 조회.
      const [prof] = await db
        .select({
          displayName: profiles.displayName,
          biasCharacter: profiles.biasCharacter,
          birthDate: profiles.birthDate,
        })
        .from(profiles)
        .where(eq(profiles.userId, userId))
        .limit(1);

      // 1) 발신자 세션 결정 — 최애가 있으면 최애, 없으면 가장 최근 대화 멤버.
      let target = await latestSession(userId);
      if (prof?.biasCharacter) {
        const biasSession = await latestSessionFor(userId, prof.biasCharacter);
        if (biasSession) target = biasSession;
      }
      if (!target) {
        skipped += 1;
        continue;
      }

      // 2) 오늘 이미 활동했으면 스킵.
      const lastAt = target.lastMessageAt ?? target.createdAt;
      if (isKstToday(lastAt)) {
        skipped += 1;
        continue;
      }

      // 2-1) 마지막 메시지가 아직 답장 없는 선톡이면 스킵 — 매달리듯 쌓이지 않게.
      const [lastMsg] = await db
        .select({ role: chatMessages.role, metadata: chatMessages.metadata })
        .from(chatMessages)
        .where(eq(chatMessages.sessionId, target.id))
        .orderBy(desc(chatMessages.createdAt))
        .limit(1);
      const lastIsUnansweredDm =
        lastMsg?.role === "assistant" &&
        !!lastMsg.metadata &&
        (lastMsg.metadata as Record<string, unknown>).dm === true;
      if (lastIsUnansweredDm) {
        skipped += 1;
        continue;
      }

      const characterId = (target.character ?? DEFAULT_CHARACTER) as CharacterId;
      const character = CHARACTERS[characterId] ?? CHARACTERS[DEFAULT_CHARACTER];
      // 생일 당일이면 축하 선톡으로 대체.
      const line = isBirthdayTodayKst(prof?.birthDate)
        ? (BIRTHDAY_LINES[characterId] ?? BIRTHDAY_LINES.witch).replace(
            /\{name\}/g,
            prof?.displayName?.trim() || "너",
          )
        : pickDmLine(characterId, prof?.displayName ?? null, slot);

      // 3) 채팅에 실제 메시지로 남김 — 탭하면 멤버가 먼저 말 걸어둔 상태.
      await db.insert(chatMessages).values({
        sessionId: target.id,
        userId,
        role: "assistant",
        content: line,
        model: "member-dm",
        metadata: { dm: true },
      });
      await db
        .update(chatSessions)
        .set({ lastMessageAt: new Date() })
        .where(eq(chatSessions.id, target.id));

      // 4) 멤버 사진과 함께 푸시 발송.
      await sendToUser(userId, {
        title: `${character.name} 💬`,
        body: line,
        url: `/chat/${target.id}`,
        tag: dateTag,
        renotify: true,
        icon: character.imageSrc,
        image: character.imageSrc,
      });
      sent += 1;
    } catch {
      // 한 사용자 실패가 전체를 막지 않도록 무시하고 계속.
      skipped += 1;
    }
  }

  return { users: subs.length, sent, skipped };
}
