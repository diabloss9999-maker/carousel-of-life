/**
 * 엘더 푸타르크 룬 점술 비즈니스 로직.
 *
 * 지원 스프레드:
 * - single : 한 개 — 오늘의 룬 / 핵심 메시지
 * - three  : 세 개 — 과거·현재·미래 (Norns)
 * - five   : 다섯 개 — 십자형 (프리미엄)
 * - nine   : 아홉 개 — 3×3 종합 (프리미엄)
 *
 * 무료 사용자는 일일 한도(`FREE_DAILY_RUNES`) 적용.
 * 5개·9개 스프레드는 프리미엄 전용.
 */
import "server-only";

import { and, count, desc, eq, gte } from "drizzle-orm";

import { db } from "@/db";
import {
  runeReadings,
  type Profile,
  type RuneReading,
} from "@/db/schema";
import { generateMarkdown } from "@/lib/ai/generate";
import { buildUserContext } from "@/lib/ai/prompts";
import { AI_MODELS } from "@/lib/constants";
import { drawRunes, RUNE_SPREAD_POSITIONS } from "@/lib/runes/draw";

/** 무료 사용자 일일 룬 뽑기 한도. */
export const FREE_DAILY_RUNES = 3;

export type RuneSpreadType = "single" | "three" | "five" | "nine";

/** DB의 runes 컬럼에 저장되는 형태. */
export interface RuneEntry {
  runeId: number;
  isReversed: boolean;
  position: string;
}

export type RuneResult =
  | { ok: true; reading: RuneReading }
  | { ok: false; reason: "quota_exceeded"; max: number }
  | { ok: false; reason: "premium_only"; message: string }
  | { ok: false; reason: "ai_failed"; message: string };

/** 24개 룬 의미 — AI 가 사용할 압축 정의. */
const RUNE_DEFS = `1.Fehu(페후)-풍요·재물·번영 / 2.Uruz(우루즈)-힘·건강·야성·의지 / 3.Thurisaz(투리사즈)-보호·충격·방어 / 4.Ansuz(안수즈)-지혜·영감·소통·신성 / 5.Raidho(라이도)-여정·리듬·방향 / 6.Kenaz(케나즈)-창조·지식·통찰 / 7.Gebo(게보)[불변]-선물·교환·균형 / 8.Wunjo(운조)-기쁨·조화·행복 / 9.Hagalaz(하갈라즈)[불변]-시련·파괴·정화 / 10.Nauthiz(나우티즈)[불변]-필요·인내·제약 / 11.Isa(이사)[불변]-정지·얼음·성찰·기다림 / 12.Jera(예라)[불변]-수확·순환·결실 / 13.Eihwaz(에이와즈)[불변]-지속성·생명력·변환 / 14.Perthro(페르스로)-비밀·운명·기회·신비 / 15.Algiz(알기즈)-보호·방어·직관 / 16.Sowilo(소윌로)[불변]-승리·태양·성공 / 17.Tiwaz(티와즈)-정의·희생·용기 / 18.Berkano(베르카노)-양육·성장·재생 / 19.Ehwaz(에화즈)-파트너십·신뢰·협력 / 20.Mannaz(만나즈)-인간성·자아·공동체 / 21.Laguz(라구즈)-흐름·직관·감정·치유 / 22.Ingwaz(잉와즈)[불변]-잠재력·씨앗·완성 / 23.Dagaz(다가즈)[불변]-돌파·전환·각성 / 24.Othala(오탈라)-유산·고향·뿌리·소속`;

/** 스프레드별 max_tokens. */
const MAX_TOKENS: Record<RuneSpreadType, number> = {
  single: 1200,
  three: 2000,
  five: 2800,
  nine: 4000,
};

/** 스프레드별 카드 수. */
const SPREAD_COUNT: Record<RuneSpreadType, 1 | 3 | 5 | 9> = {
  single: 1,
  three: 3,
  five: 5,
  nine: 9,
};

/**
 * 오늘(KST 기준) 사용자가 던진 룬 결과 목록.
 */
export async function getTodayRuneReadings(
  userId: string,
): Promise<RuneReading[]> {
  const todayKstStr = new Date().toLocaleDateString("sv-SE", {
    timeZone: "Asia/Seoul",
  });
  const todayStartUtc = new Date(`${todayKstStr}T00:00:00+09:00`);

  return db
    .select()
    .from(runeReadings)
    .where(
      and(
        eq(runeReadings.userId, userId),
        gte(runeReadings.createdAt, todayStartUtc),
      ),
    )
    .orderBy(desc(runeReadings.createdAt))
    .limit(20);
}

/**
 * 룬 점술 1회를 수행한다.
 *
 * - `single` / `three` : 무료 사용자도 일일 한도(`FREE_DAILY_RUNES`) 내 가능.
 * - `five` / `nine`    : 프리미엄 구독자 전용.
 */
export async function createRuneReading(opts: {
  profile: Profile;
  spreadType: RuneSpreadType;
  question: string | null;
  isSubscribed: boolean;
  reversedEnabled: boolean;
}): Promise<RuneResult> {
  // 1. 프리미엄 게이트.
  const isPremiumSpread =
    opts.spreadType === "five" || opts.spreadType === "nine";
  if (isPremiumSpread && !opts.isSubscribed) {
    return {
      ok: false,
      reason: "premium_only",
      message: "이 스프레드는 프리미엄 구독자 전용이에요.",
    };
  }

  // 2. 무료 사용자 한도 검사.
  if (!opts.isSubscribed) {
    const todayKstStr = new Date().toLocaleDateString("sv-SE", {
      timeZone: "Asia/Seoul",
    });
    const todayStartUtc = new Date(`${todayKstStr}T00:00:00+09:00`);

    const [row] = await db
      .select({ value: count() })
      .from(runeReadings)
      .where(
        and(
          eq(runeReadings.userId, opts.profile.userId),
          gte(runeReadings.createdAt, todayStartUtc),
        ),
      );
    const used = Number(row?.value ?? 0);
    if (used >= FREE_DAILY_RUNES) {
      return {
        ok: false,
        reason: "quota_exceeded",
        max: FREE_DAILY_RUNES,
      };
    }
  }

  // 3. 룬 뽑기.
  const cardCount = SPREAD_COUNT[opts.spreadType];
  const drawn = drawRunes(cardCount, opts.reversedEnabled);
  const positions = RUNE_SPREAD_POSITIONS[opts.spreadType];

  // 4. AI 프롬프트 구성.
  const userCtx = buildUserContext({ profile: opts.profile });
  const questionPart = opts.question
    ? `\n질문: "${opts.question}"`
    : "\n질문: (없음 — 전반적 흐름)";

  // 에트 분포·역방향 개수 통계.
  const aettCount = { Freyr: 0, Heimdall: 0, Tyr: 0 };
  let reversedCount = 0;
  for (const d of drawn) {
    aettCount[d.rune.aett] += 1;
    if (d.isReversed) reversedCount += 1;
  }
  const aettLine = `Freyr ${aettCount.Freyr}개 / Heimdall ${aettCount.Heimdall}개 / Tyr ${aettCount.Tyr}개`;
  const reversedLine = opts.reversedEnabled
    ? `역방향 ${reversedCount}개 / 정방향 ${cardCount - reversedCount}개`
    : "역방향 사용 안 함 (모두 정방향)";

  const runeLines = drawn
    .map((d, i) => {
      const orientationLabel = d.isReversed ? "역방향(머크스타브)" : "정방향";
      const invertibleTag = d.rune.isInvertible ? "" : " (불변룬)";
      const meaning = d.isReversed
        ? (d.rune.meaningReversed ?? d.rune.meaningUpright)
        : d.rune.meaningUpright;
      const pos = positions[i] ?? `위치 ${i + 1}`;
      return `[${i}] ${d.rune.id}.${d.rune.name}(${d.rune.nameKo})${invertibleTag} — ${orientationLabel} — ${pos}\n     의미: ${meaning}`;
    })
    .join("\n");

  const centerLine =
    opts.spreadType === "nine"
      ? `\n[중심 룬 — 위치 4 / 현재의 핵심]\n${(() => {
          const c = drawn[4];
          if (!c) return "(없음)";
          return `${c.rune.id}.${c.rune.name}(${c.rune.nameKo}) — ${c.isReversed ? "역방향" : "정방향"}`;
        })()}`
      : "";

  const spreadInstruction = buildSpreadInstruction(opts.spreadType);

  const userPrompt = `[사용자 정보]
${userCtx}${questionPart}

[던진 룬 (${cardCount}개)]
${runeLines}
${centerLine}

[에트 분포]
${aettLine}

[방향 분포]
${reversedLine}

[룬 의미 정의 — 반드시 이 정의만 사용]
${RUNE_DEFS}

[해석 절차]
${spreadInstruction}

[톤 규칙]
- 점쟁이 흉내 X. 예언 투·신비주의 표현 금지.
- 차분하고 분석적인 어조.
- 각 룬의 의미를 사용자 상황에 구체적으로 연결.
- 불변룬은 (불변룬) 으로 표기하고 역방향이 없음을 인지한다.
- 역방향(머크스타브) 룬은 해당 의미를 적용한다.
- 부정적 룬도 솔직히 짚되 대응 방향을 함께 제시한다.
- 의학·법률 등 전문 영역의 결정은 룬으로 단정하지 않는다.
- 마크다운 헤딩 구조로 응답한다.`;

  let interpretation: string;
  try {
    interpretation = await generateMarkdown({
      userPrompt,
      model: AI_MODELS.premium,
      maxTokens: MAX_TOKENS[opts.spreadType],
      systemSuffix:
        "당신은 숙련된 엘더 푸타르크 룬 리더입니다. 룬 의미는 제공된 정의만 사용합니다. JSON 으로 응답하지 말고 지정된 마크다운 헤딩 구조로만 응답하세요.",
    });
  } catch (e) {
    return {
      ok: false,
      reason: "ai_failed",
      message:
        "룬의 메시지를 읽지 못했어요: " +
        (e instanceof Error ? e.message : "알 수 없는 원인"),
    };
  }

  // 5. DB 저장.
  const runesPayload: RuneEntry[] = drawn.map((d, i) => ({
    runeId: d.rune.id,
    isReversed: d.isReversed,
    position: positions[i] ?? `pos_${i}`,
  }));

  const [inserted] = await db
    .insert(runeReadings)
    .values({
      userId: opts.profile.userId,
      spreadType: opts.spreadType,
      question: opts.question,
      runes: runesPayload,
      reversedEnabled: opts.reversedEnabled,
      interpretation,
      model: AI_MODELS.premium,
    })
    .returning();

  if (!inserted) {
    return {
      ok: false,
      reason: "ai_failed",
      message: "룬 결과 저장에 실패했어요.",
    };
  }

  return { ok: true, reading: inserted };
}

/** 스프레드별 해석 지침. */
function buildSpreadInstruction(spread: RuneSpreadType): string {
  if (spread === "single") {
    return `1개 룬 리딩:
1. 룬의 핵심 의미(정방향/역방향)를 사용자 상황에 직접 연결한다.
2. 실용적 조언 제시.
3. 마크다운 헤딩:

## ᚠ 핵심 메시지
(룬 이름·방향 명시 후 2~3문장)

## 💡 오늘의 조언
(실행 가능한 조언 2~3문장)`;
  }
  if (spread === "three") {
    return `3개 스프레드 (과거·현재·미래 / 노른스):
1. 위치별 룬 의미를 시간선처럼 연결한다.
2. 인접한 룬의 조합 의미를 1~2개 짚는다.
3. 결론적 조언.

## ᚱ 과거의 뿌리
(첫 번째 룬, 2~3문장)

## ᛗ 현재의 핵심
(두 번째 룬, 2~3문장)

## ᛞ 미래의 결과
(세 번째 룬, 2~3문장)

## 🔮 종합 메시지
(세 룬의 흐름과 조합, 2~3문장)`;
  }
  if (spread === "five") {
    return `5개 십자형 스프레드:
1. [0]현재 / [1]도전 / [2]과거의 영향 / [3]다가올 미래 / [4]조언·결과
2. 중심 룬은 [0]현재 상황 — 가장 비중 있게 다룬다.
3. [1]도전과 [4]조언의 대립·해소 구조를 풀어준다.

## 🪨 현재 상황
(위치 [0], 2~3문장)

## ⚔️ 도전과 장애
(위치 [1], 2~3문장)

## 🌑 과거의 영향
(위치 [2], 2~3문장)

## 🌅 다가올 미래
(위치 [3], 2~3문장)

## 💡 조언과 결과
(위치 [4], 2~3문장)

## 🔮 종합 메시지
(다섯 룬의 흐름, 2~3문장)`;
  }
  // nine
  return `9개 종합 스프레드 (3×3):
1. 상단[0,1,2]=과거 / 중단[3,4,5]=현재 / 하단[6,7,8]=미래.
2. 중심 룬([4]=현재의 핵심)이 가장 비중 있다.
3. 같은 열·인접 룬의 조합으로 이야기를 만든다.
4. 부정 룬도 솔직히 짚되 대응 방향을 함께 제시한다.

## ✦ 중심 룬의 메시지
(위치 [4], 핵심 답 2~3문장)

## 🌑 과거의 흐름 (상단)
(위치 [0][1][2] 종합, 3~4문장)

## ☀ 현재의 핵심 (중단)
(위치 [3][4][5] 종합, 3~4문장)

## 🌅 미래의 결과 (하단)
(위치 [6][7][8] 종합, 3~4문장)

## 🔍 주목할 조합
(눈에 띄는 룬 조합 2~3개, 각 1문장)

## 💡 종합 조언
(실용적 행동 지침, 3~4문장)`;
}
