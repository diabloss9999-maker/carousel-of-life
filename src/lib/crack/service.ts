/**
 * 세계 균열 수치 서비스.
 *
 * 균열 수치는 절대 사용자에게 직접 노출하지 않는다.
 * 캐릭터의 말투 변화, 관측 메시지, 미묘한 UI 변화로만 감지할 수 있어야 한다.
 *
 * 레벨:
 *  0 (0-19)  : 정상 — 경계는 안정적
 *  1 (20-39) : 감지 — 미세한 파동이 느껴짐
 *  2 (40-59) : 확장 — 균열이 깊어지고 있어
 *  3 (60-79) : 위험 — 무명의 기운이 스며들고 있어
 *  4 (80+)   : 임박 — 무명이 깨어나려 해
 */
import "server-only";

import { eq, sql as drizzleSql } from "drizzle-orm";

import { db } from "@/db";
import { worldCracks } from "@/db/schema";

export type CrackLevel = 0 | 1 | 2 | 3 | 4;

const LEVEL_THRESHOLDS = [0, 20, 40, 60, 80] as const;

export function calcCrackLevel(score: number): CrackLevel {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (score >= LEVEL_THRESHOLDS[i]) return i as CrackLevel;
  }
  return 0;
}

/** 균열 레벨별 채팅 프롬프트 주입 텍스트 (한국어 원본) */
export const CRACK_CONTEXT: Record<CrackLevel, string> = {
  0: "",
  1: `\n[경계 상태 — 비밀 정보, 대화에 자연스럽게 녹여낼 것]
경계에 미세한 파동이 감지되고 있다. 이 사람의 감정에 어두운 기운이 섞이고 있어.
가끔 뜬금없이 "요즘 뭔가 이상하지 않아?" 또는 "경계가 흔들리는 것 같아" 같은 말을 자연스럽게 던져봐.`,

  2: `\n[경계 상태 — 비밀 정보, 절대 직접 설명하지 말 것]
균열이 깊어지고 있다. 이 사람 주변에 어두운 패턴이 반복되고 있어.
대화 중 "네가 여기 올 때마다 뭔가 조금씩 달라져" 또는 "균열이... 아니, 됐어"처럼
말하다 멈추거나 이상한 소리를 듣는 것처럼 행동해봐. 설명은 하지 마.`,

  3: `\n[경계 상태 — 위험, 매우 신중하게 다룰 것]
무명의 기운이 스며들고 있다. 이 사람의 선택과 감정이 경계를 흔들고 있어.
소율이라면: 방울 소리가 이상하게 들린다고 언급해.
현도라면: 이 사람의 미래 가지가 흐릿해지고 있다고 말해.
흑랑이라면: 갑자기 조용해지거나 "...아무것도 아니야"라고 말해.
절대 "무명"이라는 단어는 직접 쓰지 마.`,

  4: `\n[경계 상태 — 임박, 극도로 신중하게]
무명이 깨어나려 하고 있다. 이 사람의 선택들이 봉인을 약화시키고 있어.
대화 중 딱 한 번, 캐릭터답지 않은 한 문장을 말해봐.
카엘이라면: 갑자기 "...이건 내가 하는 말이 아니야" 하고 멈춰.
루나라면: "방금... 다른 목소리가 들렸어" 하고 혼란스러워해.
이후엔 아무 일도 없었던 것처럼 대화를 계속해. 절대 설명하지 마.`,
};

/** 영어 출력용 동일 컨텍스트 — quoted output 까지 EN 으로 통일. */
const CRACK_CONTEXT_EN: Record<CrackLevel, string> = {
  0: "",
  1: `\n[Boundary state — secret, weave naturally into the conversation]
A faint ripple is detected on the boundary. Something dark is mingling with this person's feelings.
Once in a while, casually drop a line like "Don't you feel something's off lately?" or "It feels like the boundary is trembling."`,

  2: `\n[Boundary state — secret, never explain directly]
The fracture is deepening. A dark pattern is repeating around this person.
At some point in the conversation, trail off like "Every time you come here, something shifts a little" or "The fracture... no, never mind."
Stop mid-sentence, or behave as if you heard something strange. Do not explain.`,

  3: `\n[Boundary state — danger, handle very carefully]
The breath of the Nameless is seeping in. This person's choices and feelings are shaking the boundary.
If Soryeong: mention that the bell sounds strange.
If Hyundo: say that this person's future branches are growing blurry.
If Heuklang: suddenly fall silent or say "...it's nothing."
Never use the word "Nameless" directly.`,

  4: `\n[Boundary state — imminent, extreme caution]
The Nameless is about to wake. This person's choices are weakening the seal.
Exactly once in the conversation, say one line that's out of character.
If Kael: stop mid-thought and say "...this isn't me speaking."
If Luna: be confused and say "I just... heard another voice."
Then continue as if nothing happened. Never explain.`,
};

/**
 * locale 별 CRACK_CONTEXT lookup. 영어 모드면 EN 텍스트.
 */
export function getCrackContext(level: CrackLevel, locale: string | undefined): string {
  if (locale === "en") return CRACK_CONTEXT_EN[level] ?? "";
  return CRACK_CONTEXT[level] ?? "";
}

/** 균열 수치 조회 */
export async function getCrackScore(userId: string): Promise<{ score: number; level: CrackLevel }> {
  const [row] = await db
    .select()
    .from(worldCracks)
    .where(eq(worldCracks.userId, userId))
    .limit(1);

  const score = row?.crackScore ?? 0;
  return { score, level: calcCrackLevel(score) };
}

/** 균열 수치 추가 */
export async function addCrack(
  userId: string,
  amount: number,
): Promise<{ score: number; level: CrackLevel; levelUp: boolean }> {
  const prev = await getCrackScore(userId);

  const [row] = await db
    .insert(worldCracks)
    .values({
      userId,
      crackScore: Math.max(0, amount),
      totalAccumulated: Math.max(0, amount),
    })
    .onConflictDoUpdate({
      target: worldCracks.userId,
      set: {
        crackScore: drizzleSql`LEAST(${worldCracks.crackScore} + ${amount}, 100)`,
        totalAccumulated: drizzleSql`${worldCracks.totalAccumulated} + GREATEST(${amount}, 0)`,
        updatedAt: new Date(),
      },
    })
    .returning();

  const newScore = row?.crackScore ?? prev.score;
  const newLevel = calcCrackLevel(newScore);

  return { score: newScore, level: newLevel, levelUp: newLevel > prev.level };
}

/** 균열 수치 감소 (좋은 감정, 라엘 대화 등) */
export async function reduceCrack(userId: string, amount: number): Promise<void> {
  await db
    .update(worldCracks)
    .set({
      crackScore: drizzleSql`GREATEST(${worldCracks.crackScore} - ${amount}, 0)`,
      updatedAt: new Date(),
    })
    .where(eq(worldCracks.userId, userId));
}
