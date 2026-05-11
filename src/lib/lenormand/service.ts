/**
 * 르노르망(Lenormand) 카드 점술 비즈니스 로직.
 *
 * 지원 스프레드:
 * - single        : 한 장 — 오늘의 메시지
 * - three         : 세 장 — 과거·현재·미래
 * - nine          : 아홉 장 — 3×3 종합 (프리미엄)
 * - grand_tableau : 36장 전체 — 그랑 타블로 (프리미엄)
 *
 * 무료 사용자는 일일 한도(`FREE_DAILY_LENORMAND`) 적용.
 * 9장·그랑타블로는 프리미엄 전용.
 */
import "server-only";

import { and, count, desc, eq, gte } from "drizzle-orm";

import { db } from "@/db";
import {
  lenormandReadings,
  type LenormandReading,
  type Profile,
} from "@/db/schema";
import { generateJson, generateMarkdown } from "@/lib/ai/generate";
import { buildUserContext } from "@/lib/ai/prompts";
import { lenormandSingleAiSchema } from "@/lib/ai/types";
import { AI_LIMITS, AI_MODELS } from "@/lib/constants";
import type { LenormandCard } from "@/lib/lenormand/cards";
import {
  drawGrandTableau,
  drawLenormand,
  drawNineCards,
} from "@/lib/lenormand/draw";
import {
  analyzeGrandTableau,
  type GrandTableauAnalysis,
} from "@/lib/lenormand/grand-tableau";

/** 무료 사용자 일일 르노르망 뽑기 한도. */
export const FREE_DAILY_LENORMAND = 3;

/** DB 의 cards 컬럼에 저장되는 형태. */
export interface LenormandCardEntry {
  id: number;
  position:
    | "single"
    | "past"
    | "present"
    | "future"
    | "nine"
    | "grand";
}

export type LenormandSpreadType =
  | "single"
  | "three"
  | "nine"
  | "grand_tableau";

export type LenormandResult =
  | { ok: true; reading: LenormandReading }
  | { ok: false; reason: "quota_exceeded"; max: number }
  | { ok: false; reason: "premium_only"; message: string }
  | { ok: false; reason: "ai_failed"; message: string }
  | { ok: false; reason: "invalid_input"; message: string };

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

/** 36장 카드 의미 정의 (AI 해석 기준). */
const CARD_DEFS = `1.기수-소식·방문자·빠른도착 / 2.클로버-작은행운·일시적기쁨 / 3.배-여행·이동·외국 / 4.집-가정·안정·가족 / 5.나무-건강·성장·생명력 / 6.구름-혼란·불확실·의심 / 7.뱀-우회·복잡함·거짓 / 8.관-종결·깊은변환·질병 / 9.꽃다발-선물·기쁨·매력 / 10.낫-갑작스런단절·결단 / 11.채찍-갈등·반복·논쟁 / 12.새-대화·불안·두사람 / 13.어린이-새시작·순수·작은것 / 14.여우-속임수·직장·주의 / 15.곰-권력자·상사·재정 / 16.별-희망·이상·인도 / 17.황새-변화·임신·이주 / 18.개-친구·충성·신뢰 / 19.탑-권위·기관·고독 / 20.정원-공공장소·모임·대중 / 21.산-장애물·지연·무거움 / 22.갈림길-선택·결정·다중옵션 / 23.쥐-손실·스트레스·갉아먹힘 / 24.하트-사랑·애정·로맨스 / 25.반지-약속·계약·결혼 / 26.책-비밀·지식·미공개 / 27.편지-문서·메시지·소식 / 28.남자-파트너또는본인(여성질문자) / 29.여자-파트너또는본인(남성질문자) / 30.백합-평화·성숙·가족 / 31.태양-성공·진실·활력 / 32.달-감정·명성·직관 / 33.열쇠-해결·확실함·운명 / 34.물고기-돈·사업·풍요 / 35.닻-안정·직장·장기성 / 36.십자가-운명·시련·부담`;

/**
 * single / three 스프레드 처리 — 기존 흐름.
 */
async function processSingleOrThree(
  opts: {
    profile: Profile;
    spreadType: "single" | "three";
    question: string | null;
  },
): Promise<LenormandResult> {
  const cardCount = opts.spreadType === "three" ? 3 : 1;
  const seedSource = Date.now() ^ (opts.profile.userId.charCodeAt(0) * 997);
  const drawnCards: LenormandCard[] = drawLenormand(cardCount, seedSource);

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
  const questionPart = opts.question
    ? `\n질문: "${opts.question}"`
    : "\n질문: (없음 — 오늘의 전반적 흐름)";

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
- 의학·법률 등 전문 영역의 결정은 카드로 단정하지 않는다.

반드시 아래 JSON 형식으로만 응답하세요:
{
  "interpretation": "카드 해석 본문 (6~9문장, 마크다운 없이)",
  "summary": "한 줄 요약 (20자 이내)",
  "cardCombination": "${opts.spreadType === "three" ? "세 카드 조합이 전하는 핵심 메시지" : "이 카드가 전하는 핵심"} (1~2문장)"
}`;

  let aiOutput;
  try {
    aiOutput = await generateJson({
      schema: lenormandSingleAiSchema,
      userPrompt,
      model: AI_MODELS.premium,
      maxTokens: AI_LIMITS.fortuneMaxTokens,
      systemSuffix:
        "당신은 숙련된 르노르망 카드 리더입니다. 카드 의미는 제공된 정의만 사용하세요. 사람이 자연스럽게 이야기하듯 대화체로 작성하고, 이모지·##·**·* 등 마크다운 기호와 빈 줄 삽입을 금지합니다. JSON으로만 응답하세요.",
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

/**
 * 9장(3×3) 스프레드 처리 — 프리미엄 전용.
 */
async function processNine(opts: {
  profile: Profile;
  question: string | null;
}): Promise<LenormandResult> {
  const drawnCards = drawNineCards();

  const userCtx = buildUserContext({ profile: opts.profile });
  const questionPart = opts.question
    ? `\n질문: "${opts.question}"`
    : "\n질문: (없음 — 전반적 흐름)";

  const cardLines = drawnCards
    .map((c, i) => {
      const role =
        i === 4 ? "중심" : i < 3 ? "상단/과거" : i < 6 ? "중단/현재" : "하단/미래";
      return `[${i}] ${c.id}번 ${c.nameKo} — ${c.keywords.slice(0, 3).join("·")} (${role})`;
    })
    .join("\n");

  const centerCard = drawnCards[4];
  const centerLabel = centerCard
    ? `[4] ${centerCard.id}번 ${centerCard.nameKo}`
    : "[4] (없음)";

  const userPrompt = `[사용자 정보]
${userCtx}${questionPart}

[뽑힌 9장 카드 — 3×3 박스]
${cardLines}

[배치 의미]
- [0][1][2] : 상단 — 과거/배경
- [3][4][5] : 중단 — 현재/핵심 ([4]가 중심 카드)
- [6][7][8] : 하단 — 미래/결과

[중심 카드]
${centerLabel}

[카드 의미 정의 — 반드시 이 정의만 사용]
${CARD_DEFS}

[해석 지침]
중심 카드([4])가 핵심이야. 먼저 중심 카드가 지금 상황에서 뭘 말하는지 이야기해줘.
그다음 상단(과거) → 중단(현재) → 하단(미래) 흐름을 자연스럽게 연결해서 이야기해.
인접한 카드끼리 조합을 짚어주고, 부정 카드도 솔직히 전달하되 대응 방향을 함께 제시해.
마지막에 실용적인 조언으로 마무리해.
이모지·##·**·* 등 마크다운 기호 쓰지 말고, 사람이 말하듯 자연스럽게. 빈 줄 넣지 마.`;

  let interpretation: string;
  try {
    interpretation = await generateMarkdown({
      userPrompt,
      model: AI_MODELS.fast,
      maxTokens: 1500,
      systemSuffix:
        "당신은 숙련된 르노르망 카드 리더입니다. 카드 의미는 제공된 정의만 사용합니다. 사람이 자연스럽게 이야기하듯 대화체로 작성하세요. 이모지·##·**·* 등 마크다운 기호 사용 금지. 빈 줄 삽입 금지. 줄바꿈은 문단 전환 시 한 번만.",
    });
  } catch (e) {
    return {
      ok: false,
      reason: "ai_failed",
      message:
        "르노르망 9장 해석을 만들지 못했어요: " +
        (e instanceof Error ? e.message : "알 수 없는 원인"),
    };
  }

  const cardsPayload: LenormandCardEntry[] = drawnCards.map((c) => ({
    id: c.id,
    position: "nine",
  }));

  const [inserted] = await db
    .insert(lenormandReadings)
    .values({
      userId: opts.profile.userId,
      spreadType: "nine",
      question: opts.question,
      cards: cardsPayload,
      interpretation,
      model: AI_MODELS.premium,
    })
    .returning();

  if (!inserted) {
    return {
      ok: false,
      reason: "ai_failed",
      message: "르노르망 9장 결과 저장에 실패했어요.",
    };
  }

  return { ok: true, reading: inserted };
}

/**
 * 그랑 타블로(36장) 처리 — 프리미엄 전용.
 */
async function processGrandTableau(opts: {
  profile: Profile;
  question: string | null;
  gender: "male" | "female";
}): Promise<LenormandResult> {
  const drawnCards = drawGrandTableau();

  let analysis: GrandTableauAnalysis;
  try {
    analysis = analyzeGrandTableau(drawnCards, opts.gender);
  } catch (e) {
    return {
      ok: false,
      reason: "ai_failed",
      message:
        "그랑 타블로 분석에 실패했어요: " +
        (e instanceof Error ? e.message : "알 수 없는 원인"),
    };
  }

  const userCtx = buildUserContext({ profile: opts.profile });
  const questionPart = opts.question
    ? `\n질문: "${opts.question}"`
    : "\n질문: (없음 — 전반적 인생 흐름)";

  const formatCard = (c: LenormandCard | null): string =>
    c ? `${c.id}번 ${c.nameKo}` : "(없음)";
  const formatCards = (cs: LenormandCard[]): string =>
    cs.length > 0 ? cs.map(formatCard).join(", ") : "(없음)";

  const sigLine = `${analysis.significatorCard.id}번 ${analysis.significatorCard.nameKo} (위치 ${analysis.significatorPos})`;

  const gridLines: string[] = [];
  for (let r = 0; r < 4; r++) {
    const row = drawnCards
      .slice(r * 8, r * 8 + 8)
      .map((c, idx) => {
        const pos = r * 8 + idx;
        const marker = pos === analysis.significatorPos ? "[시그]" : "";
        return `${marker}[${pos}] ${c.id}.${c.nameKo}`;
      })
      .join(" | ");
    gridLines.push(`R${r + 1}: ${row}`);
  }
  const soulLine = `영혼: ${drawnCards
    .slice(32, 36)
    .map((c, i) => `[${32 + i}] ${c.id}.${c.nameKo}`)
    .join(" | ")}`;

  const userPrompt = `[사용자 정보]
${userCtx}
시그니피케이터 성별: ${opts.gender === "male" ? "남성 (28번 신사)" : "여성 (29번 숙녀)"}${questionPart}

[그랑 타블로 36장 배치 — 8열 × 4행 + 하단 영혼 4장]
${gridLines.join("\n")}
${soulLine}

[시그니피케이터]
${sigLine}

[분석 데이터]
- 과거 카드(같은 행 왼쪽): ${formatCards(analysis.pastCards)}
- 미래 카드(같은 행 오른쪽): ${formatCards(analysis.futureCards)}
- 위(미래의 그림자/머릿속): ${formatCard(analysis.surrounding.top)}
- 아래(드러난 결과/발밑): ${formatCard(analysis.surrounding.bottom)}
- 왼쪽(직전): ${formatCard(analysis.surrounding.left)}
- 오른쪽(직후): ${formatCard(analysis.surrounding.right)}
- 좌상: ${formatCard(analysis.surrounding.topLeft)} / 우상: ${formatCard(analysis.surrounding.topRight)}
- 좌하: ${formatCard(analysis.surrounding.bottomLeft)} / 우하: ${formatCard(analysis.surrounding.bottomRight)}
- 같은 열(인생의 기둥): ${formatCards(analysis.sameCol)}
- 영혼 카드(내면 4장): ${formatCards(analysis.soulCards)}

[카드 의미 정의 — 반드시 이 정의만 사용]
${CARD_DEFS}

[해석 지침]
시그니피케이터(${sigLine})가 어디에 자리 잡고 있고 주변 분위기가 어떤지 먼저 이야기해줘.
그다음 같은 행의 왼쪽(과거) → 오른쪽(미래) 시간선을 따라 흐름을 설명해.
8방향 인접 카드들이 시그니피케이터에 미치는 영향을 구체적으로 짚어줘.
같은 열의 카드들이 반복적으로 강조하는 테마를 이야기하고,
영혼 카드 4장이 내면에서 말하는 흐름을 정리해줘.
마지막에 실용적인 조언으로 마무리해.
부정 카드도 솔직히 전달하되 대응 방향을 함께 제시해.
이모지·##·**·* 등 마크다운 기호 쓰지 말고, 사람이 말하듯 자연스럽게. 빈 줄 넣지 마.`;

  let interpretation: string;
  try {
    interpretation = await generateMarkdown({
      userPrompt,
      model: AI_MODELS.fast,
      maxTokens: 2000,
      systemSuffix:
        "당신은 숙련된 르노르망 카드 리더입니다. 카드 의미는 제공된 정의만 사용합니다. 사람이 자연스럽게 이야기하듯 대화체로 작성하세요. 이모지·##·**·* 등 마크다운 기호 사용 금지. 빈 줄 삽입 금지. 줄바꿈은 문단 전환 시 한 번만.",
    });
  } catch (e) {
    return {
      ok: false,
      reason: "ai_failed",
      message:
        "그랑 타블로 해석을 만들지 못했어요: " +
        (e instanceof Error ? e.message : "알 수 없는 원인"),
    };
  }

  const cardsPayload: LenormandCardEntry[] = drawnCards.map((c) => ({
    id: c.id,
    position: "grand",
  }));

  const [inserted] = await db
    .insert(lenormandReadings)
    .values({
      userId: opts.profile.userId,
      spreadType: "grand_tableau",
      question: opts.question,
      cards: cardsPayload,
      interpretation,
      model: AI_MODELS.premium,
      gender: opts.gender,
      significatorPosition: analysis.significatorPos,
    })
    .returning();

  if (!inserted) {
    return {
      ok: false,
      reason: "ai_failed",
      message: "그랑 타블로 결과 저장에 실패했어요.",
    };
  }

  return { ok: true, reading: inserted };
}

/**
 * 르노르망 점술 1회를 수행한다.
 *
 * - `single` / `three` : 무료 사용자도 일일 한도(`FREE_DAILY_LENORMAND`) 내 가능.
 * - `nine` / `grand_tableau` : 프리미엄 구독자 전용.
 */
export async function createLenormandReading(opts: {
  profile: Profile;
  spreadType: LenormandSpreadType;
  question: string | null;
  isSubscribed: boolean;
  gender?: "male" | "female";
}): Promise<LenormandResult> {
  // 1. 프리미엄 게이트 (9장 / 그랑 타블로).
  const isPremiumSpread =
    opts.spreadType === "nine" || opts.spreadType === "grand_tableau";
  if (isPremiumSpread && !opts.isSubscribed) {
    return {
      ok: false,
      reason: "premium_only",
      message: "이 스프레드는 프리미엄 구독자 전용이에요.",
    };
  }

  // 2. 무료 사용자 한도 검사 (single/three 만).
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

  // 3. 스프레드별 분기.
  if (opts.spreadType === "single" || opts.spreadType === "three") {
    return processSingleOrThree({
      profile: opts.profile,
      spreadType: opts.spreadType,
      question: opts.question,
    });
  }

  if (opts.spreadType === "nine") {
    return processNine({
      profile: opts.profile,
      question: opts.question,
    });
  }

  // grand_tableau
  if (!opts.gender) {
    return {
      ok: false,
      reason: "invalid_input",
      message: "그랑 타블로는 시그니피케이터 성별이 필요해요.",
    };
  }

  return processGrandTableau({
    profile: opts.profile,
    question: opts.question,
    gender: opts.gender,
  });
}
