/**
 * 르노르망(Lenormand) 카드 점술 비즈니스 로직.
 *
 * - single: 한 장 — 오늘의 메시지
 * - three: 세 장 — 과거·현재·미래
 *
 * 무료 사용자는 일일 한도(`FREE_DAILY_LENORMAND`) 적용.
 */
import "server-only";

import { and, count, desc, eq, gte } from "drizzle-orm";

import { db } from "@/db";
import {
  lenormandReadings,
  type LenormandReading,
  type Profile,
} from "@/db/schema";
import { generateJson } from "@/lib/ai/generate";
import { buildUserContext } from "@/lib/ai/prompts";
import { lenormandSingleAiSchema } from "@/lib/ai/types";
import { AI_LIMITS, AI_MODELS } from "@/lib/constants";
import { drawLenormand } from "@/lib/lenormand/draw";
import type { LenormandCard } from "@/lib/lenormand/cards";

/** 무료 사용자 일일 르노르망 뽑기 한도. */
export const FREE_DAILY_LENORMAND = 3;

/** DB 의 cards 컬럼에 저장되는 형태. */
export interface LenormandCardEntry {
  id: number;
  position: "single" | "past" | "present" | "future";
}

export type LenormandResult =
  | { ok: true; reading: LenormandReading }
  | { ok: false; reason: "quota_exceeded"; max: number }
  | { ok: false; reason: "ai_failed"; message: string };

/**
 * 오늘(KST 기준) 사용자가 뽑은 르노르망 결과 목록.
 */
export async function getTodayLenormandReadings(
  userId: string,
): Promise<LenormandReading[]> {
  const todayKstStr = new Date().toLocaleDateString("sv-SE", {
    timeZone: "Asia/Seoul",
  });
  const todayStartUtc = new Date(`${todayKstStr}T00:00:00+09:00`);

  return db
    .select()
    .from(lenormandReadings)
    .where(
      and(
        eq(lenormandReadings.userId, userId),
        gte(lenormandReadings.createdAt, todayStartUtc),
      ),
    )
    .orderBy(desc(lenormandReadings.createdAt))
    .limit(20);
}

/**
 * 르노르망 점술 1회를 수행한다.
 */
export async function createLenormandReading(opts: {
  profile: Profile;
  spreadType: "single" | "three";
  question: string | null;
  isSubscribed: boolean;
}): Promise<LenormandResult> {
  // 1. 한도 검사 (무료 사용자만).
  if (!opts.isSubscribed) {
    const todayKstStr = new Date().toLocaleDateString("sv-SE", {
      timeZone: "Asia/Seoul",
    });
    const todayStartUtc = new Date(`${todayKstStr}T00:00:00+09:00`);

    const [row] = await db
      .select({ value: count() })
      .from(lenormandReadings)
      .where(
        and(
          eq(lenormandReadings.userId, opts.profile.userId),
          gte(lenormandReadings.createdAt, todayStartUtc),
        ),
      );
    const used = Number(row?.value ?? 0);
    if (used >= FREE_DAILY_LENORMAND) {
      return {
        ok: false,
        reason: "quota_exceeded",
        max: FREE_DAILY_LENORMAND,
      };
    }
  }

  // 2. 카드 뽑기.
  const cardCount = opts.spreadType === "three" ? 3 : 1;
  const seedSource =
    Date.now() ^ (opts.profile.userId.charCodeAt(0) * 997);
  const drawnCards: LenormandCard[] = drawLenormand(cardCount, seedSource);

  // 3. AI 프롬프트 구성.
  const positions: ReadonlyArray<"past" | "present" | "future"> = [
    "past",
    "present",
    "future",
  ];
  const positionLabel: Record<string, string> = {
    past: "과거",
    present: "현재",
    future: "미래",
  };

  /** 36장 고정 카드 의미 정의 (AI 해석 기준) */
  const CARD_DEFS = `1.기수-소식·방문자·빠른도착 / 2.클로버-작은행운·일시적기쁨 / 3.배-여행·이동·외국 / 4.집-가정·안정·가족 / 5.나무-건강·성장·생명력 / 6.구름-혼란·불확실·의심 / 7.뱀-우회·복잡함·거짓 / 8.관-종결·깊은변환·질병 / 9.꽃다발-선물·기쁨·매력 / 10.낫-갑작스런단절·결단 / 11.채찍-갈등·반복·논쟁 / 12.새-대화·불안·두사람 / 13.어린이-새시작·순수·작은것 / 14.여우-속임수·직장·주의 / 15.곰-권력자·상사·재정 / 16.별-희망·이상·인도 / 17.황새-변화·임신·이주 / 18.개-친구·충성·신뢰 / 19.탑-권위·기관·고독 / 20.정원-공공장소·모임·대중 / 21.산-장애물·지연·무거움 / 22.갈림길-선택·결정·다중옵션 / 23.쥐-손실·스트레스·갉아먹힘 / 24.하트-사랑·애정·로맨스 / 25.반지-약속·계약·결혼 / 26.책-비밀·지식·미공개 / 27.편지-문서·메시지·소식 / 28.남자-파트너또는본인(여성질문자) / 29.여자-파트너또는본인(남성질문자) / 30.백합-평화·성숙·가족 / 31.태양-성공·진실·활력 / 32.달-감정·명성·직관 / 33.열쇠-해결·확실함·운명 / 34.물고기-돈·사업·풍요 / 35.닻-안정·직장·장기성 / 36.십자가-운명·시련·부담`;

  const cardDescriptions = drawnCards
    .map((c, i) => {
      const pos =
        opts.spreadType === "three"
          ? ` (${positionLabel[positions[i] ?? "present"]})`
          : "";
      return `${c.id}번 ${c.nameKo}${pos}`;
    })
    .join(", ");

  const userCtx = buildUserContext({ profile: opts.profile });
  const questionPart = opts.question ? `\n질문: "${opts.question}"` : "\n질문: (없음 — 오늘의 전반적 흐름)";

  const spreadInstruction =
    opts.spreadType === "three"
      ? `3장 스프레드 (과거·현재·미래):
1. 전체 분위기: 긍정/부정 카드 비율 파악
2. 핵심 흐름: 과거(배경) → 현재(핵심) → 미래(결과) 연결
3. 카드 조합: 인접 카드끼리 의미 결합 (예: 구름+열쇠 = "혼란이 해결된다")
4. 결론: 한 문장으로 답`
      : `1장 리딩:
1. 카드의 핵심 의미를 사용자 상황에 직접 연결
2. 실용적 조언 제시
3. 결론: 한 문장으로 답`;

  const userPrompt = `[사용자 정보]
${userCtx}${questionPart}

[뽑힌 르노르망 카드]
${cardDescriptions}

[카드 의미 정의 — 반드시 이 정의만 사용]
${CARD_DEFS}

[해석 절차]
${spreadInstruction}

[톤 규칙]
- 점쟁이 흉내 X. 예언 투·신비주의 표현 금지.
- 차분하고 분석적인 어조.
- 카드 의미를 사용자 상황에 구체적으로 연결.
- 부정 카드도 솔직히 전달하되 대응 방법 함께 제시.
- 마크다운 기호(*, #, -, ** 등) 절대 사용 금지.
- 의학·법률·재정 결정은 카드만으로 단정 금지 (참고용임을 짧게 명시).

반드시 아래 JSON 형식으로만 응답하세요:
{
  "interpretation": "카드 해석 본문 (6~9문장, 마크다운 없이)",
  "summary": "한 줄 요약 (20자 이내)",
  "cardCombination": "${opts.spreadType === "three" ? "세 카드 조합이 전하는 핵심 메시지" : "이 카드가 전하는 핵심"} (1~2문장)"
}`;

  // 4. AI 호출.
  let aiOutput;
  try {
    aiOutput = await generateJson({
      schema: lenormandSingleAiSchema,
      userPrompt,
      model: AI_MODELS.premium,
      maxTokens: AI_LIMITS.fortuneMaxTokens,
      systemSuffix:
        "당신은 숙련된 르노르망 카드 리더입니다. 카드 의미는 제공된 정의만 사용하고, 마크다운 없이 JSON으로만 응답하세요.",
    });
  } catch (e) {
    return {
      ok: false,
      reason: "ai_failed",
      message:
        "르노르망의 메시지를 읽지 못했어요: " +
        (e instanceof Error ? e.message : "알 수 없는 원인"),
    };
  }

  // 5. DB 저장.
  const cardsPayload: LenormandCardEntry[] = drawnCards.map((c, i) => ({
    id: c.id,
    position:
      opts.spreadType === "three"
        ? (positions[i] ?? "present")
        : "single",
  }));

  const interpretationText = aiOutput.cardCombination
    ? `${aiOutput.cardCombination}\n\n${aiOutput.interpretation}`
    : aiOutput.interpretation;

  const [inserted] = await db
    .insert(lenormandReadings)
    .values({
      userId: opts.profile.userId,
      spreadType: opts.spreadType,
      question: opts.question,
      cards: cardsPayload,
      interpretation: interpretationText,
      model: AI_MODELS.premium,
    })
    .returning();

  if (!inserted) {
    return {
      ok: false,
      reason: "ai_failed",
      message: "르노르망 결과 저장에 실패했어요.",
    };
  }

  return { ok: true, reading: inserted };
}
