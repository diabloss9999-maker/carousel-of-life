/**
 * AI 프롬프트 빌더.
 *
 * 사용자 컨텍스트를 받아 운세·타로·궁합 프롬프트를 일관된 형식으로 만든다.
 */
import type { UserProfile } from "@/types";

interface BuildContextOptions {
  profile: Pick<
    UserProfile,
    | "birthDate"
    | "birthTime"
    | "calendarSystem"
    | "gender"
    | "mbti"
    | "birthPlace"
    | "displayName"
  >;
}

/**
 * 사용자 사주 컨텍스트를 사람이 읽을 수 있는 한국어 문단으로 변환.
 */
export function buildUserContext({ profile }: BuildContextOptions): string {
  const lines: string[] = [];
  if (profile.displayName) lines.push(`이름: ${profile.displayName}`);
  lines.push(
    `생년월일: ${profile.birthDate} (${profile.calendarSystem === "lunar" ? "음력" : "양력"})`,
  );
  if (profile.birthTime) lines.push(`태어난 시각: ${profile.birthTime}`);
  else lines.push(`태어난 시각: 모름 (시주는 비워서 풀이)`);
  lines.push(
    `성별: ${profile.gender === "male" ? "남성" : profile.gender === "female" ? "여성" : "기타"}`,
  );
  if (profile.mbti) lines.push(`MBTI: ${profile.mbti}`);
  if (profile.birthPlace) lines.push(`출생지: ${profile.birthPlace}`);

  return lines.join("\n");
}

/** 오늘의 운세 카테고리 ID. */
export type FortuneCategory =
  | "general"
  | "love"
  | "money"
  | "career"
  | "health"
  | "study";

const FORTUNE_LABEL: Record<FortuneCategory, string> = {
  general: "오늘의 종합운",
  love: "애정운",
  money: "금전운",
  career: "직장·취업운",
  health: "건강운",
  study: "학업운",
};

/**
 * 오늘의 운세 사용자 프롬프트.
 *
 * AI 는 JSON 으로 응답하도록 강제 (구조화 데이터로 DB 저장).
 */
export function buildDailyFortunePrompt(opts: {
  profile: BuildContextOptions["profile"];
  category: FortuneCategory;
  fortuneDate: string; // YYYY-MM-DD
}): string {
  const ctx = buildUserContext({ profile: opts.profile });
  const label = FORTUNE_LABEL[opts.category];

  return `[질문자 정보]
${ctx}

[풀이 대상]
- 날짜: ${opts.fortuneDate}
- 카테고리: ${label}

[지시]
질문자의 사주와 ${opts.fortuneDate} 의 일진을 살펴 ${label}을(를) 풀이해주세요.
다음 JSON 스키마를 정확히 따라 단 하나의 JSON 객체로만 응답하세요. 추가 설명·markdown·코드펜스 없이 JSON 만 출력합니다.

{
  "score": 1-100 사이 정수 (운세 점수),
  "title": "20자 이내 한 줄 헤드라인 (반말 친구 톤)",
  "content": "6-8문장의 본문 풀이. 모든 문장이 접속사·이어주는 말로 자연스럽게 이어지는 흐름. 사주 정보를 매번 반복 설명하지 말 것. 이름 호명은 처음에 한 번 정도만. 친한 친구가 옆에서 차근차근 설명해주는 톤. 추상적 표현보다 구체적인 상황·행동을 짚어줄 것.",
  "luckyColor": "행운의 색 (한글 1-3 단어)",
  "luckyNumber": 1-99 사이 정수,
  "luckyDirection": "방향 (예: '동쪽', '북서쪽')"
}`;
}

/**
 * 타로 단일 카드 풀이 프롬프트.
 */
export function buildTarotSinglePrompt(opts: {
  profile: BuildContextOptions["profile"];
  question: string | null;
  card: { id: string; name: string; isReversed: boolean };
}): string {
  const ctx = buildUserContext({ profile: opts.profile });
  const orient = opts.card.isReversed ? "역방향(逆位)" : "정방향(正位)";

  return `[질문자 정보]
${ctx}

[질문]
${opts.question?.trim() || "(질문 없음 — 오늘의 한 장)"}

[뽑힌 카드]
${opts.card.name} (${orient})

[지시]
이 한 장의 카드만으로 질문자에게 답해주세요.
다음 JSON 스키마를 정확히 따라 단 하나의 JSON 객체로만 응답하세요. 추가 설명·markdown·코드펜스 없이 JSON 만 출력합니다.

{
  "interpretation": "5-7문장의 풀이 (반말 친구 톤, 쉬운 단어)",
  "summary": "한 줄 핵심 요약 (30자 이내, 반말 친구 톤)"
}`;
}

/**
 * 타로 3장 스프레드 (과거-현재-미래) 프롬프트.
 */
export function buildTarotThreePrompt(opts: {
  profile: BuildContextOptions["profile"];
  question: string | null;
  cards: Array<{ id: string; name: string; isReversed: boolean }>;
}): string {
  const ctx = buildUserContext({ profile: opts.profile });
  const positions = ["과거", "현재", "미래"] as const;
  const cardLines = opts.cards
    .map((c, i) => {
      const orient = c.isReversed ? "역방향(逆位)" : "정방향(正位)";
      return `[${positions[i]}] ${c.name} (${orient})`;
    })
    .join("\n");

  return `[질문자 정보]
${ctx}

[질문]
${opts.question?.trim() || "(질문 없음 — 흐름을 살피기 위한 한 묶음)"}

[뽑힌 카드 — 과거 → 현재 → 미래]
${cardLines}

[지시]
세 장의 카드가 보여주는 흐름을 풀이해주세요.
- 첫 카드 = 지나온 자리 (과거)
- 두 번째 카드 = 지금의 자리 (현재)
- 세 번째 카드 = 다가올 자리 (미래)
세 장이 하나의 이야기로 자연스럽게 이어지도록.

다음 JSON 스키마를 정확히 따라 단 하나의 JSON 객체로만 응답하세요. 추가 설명·markdown·코드펜스 없이 JSON 만 출력합니다. 모든 본문은 반말 친구 톤, 쉬운 단어로.

{
  "past": "5-7문장의 과거 카드 풀이",
  "present": "5-7문장의 현재 카드 풀이",
  "future": "5-7문장의 미래 카드 풀이",
  "synthesis": "5-7문장으로 세 카드를 하나의 흐름·이야기로 묶어주는 종합 풀이",
  "summary": "한 줄 핵심 (40자 이내)"
}`;
}

/**
 * 궁합 풀이 프롬프트.
 */
export interface PartnerInfo {
  name: string;
  birthDate: string;
  birthTime: string | null;
  calendarSystem: "solar" | "lunar";
  gender: "male" | "female" | "other";
  mbti: string | null;
}

export function buildCompatibilityPrompt(opts: {
  profile: BuildContextOptions["profile"];
  partner: PartnerInfo;
}): string {
  const meCtx = buildUserContext({ profile: opts.profile });
  const partnerLines: string[] = [];
  partnerLines.push(`이름: ${opts.partner.name}`);
  partnerLines.push(
    `생년월일: ${opts.partner.birthDate} (${opts.partner.calendarSystem === "lunar" ? "음력" : "양력"})`,
  );
  if (opts.partner.birthTime)
    partnerLines.push(`태어난 시각: ${opts.partner.birthTime}`);
  else partnerLines.push(`태어난 시각: 모름`);
  partnerLines.push(
    `성별: ${opts.partner.gender === "male" ? "남성" : opts.partner.gender === "female" ? "여성" : "기타"}`,
  );
  if (opts.partner.mbti) partnerLines.push(`MBTI: ${opts.partner.mbti}`);

  return `[질문자]
${meCtx}

[상대방]
${partnerLines.join("\n")}

[지시]
두 사람의 사주와 기운을 살펴 궁합을 풀이해주세요.
다음 JSON 스키마를 정확히 따라 단 하나의 JSON 객체로만 응답하세요. 추가 설명·markdown·코드펜스 없이 JSON 만 출력합니다.

{
  "score": 1-100 사이 정수 (궁합 점수),
  "summary": "한 줄 요약 (30자 이내, 반말 친구 톤)",
  "detail": "6-8문장의 풀이. 두 사람의 기운이 어떻게 어울리는지, 잘 맞는 부분과 조심할 부분, 관계를 부드럽게 만들 작은 팁까지. 친한 친구가 차근차근 설명해주는 톤. 반말, 쉬운 단어로."
}`;
}

/**
 * 사주 심층 분석 프롬프트 (프리미엄 전용).
 *
 * 한 번 생성되면 영구 캐시되어 사용자 평생 활용.
 */
export function buildSajuDeepPrompt(
  profile: BuildContextOptions["profile"],
): string {
  const ctx = buildUserContext({ profile });
  return `[질문자 정보]
${ctx}

[지시]
질문자의 사주를 깊이 살펴 7가지 주제로 풀이해주세요.
이건 한 번만 생성되어 평생 보관될 풀이이니, 평생 곱씹어볼 수 있을 정도로 정성껏 적어주세요.

다음 JSON 스키마를 정확히 따라 단 하나의 JSON 객체로만 응답하세요. 추가 설명·markdown·코드펜스 없이 JSON 만 출력합니다. 모든 본문은 친한 친구가 차분하게 풀어주는 반말 톤. 어려운 한자어는 풀어 쓰기.

{
  "personality": "5-7문장의 성격 분석. 사주 흐름이 어떻게 성격으로 드러나는지.",
  "strengths": "5-7문장의 타고난 강점. 어떤 결정 어떤 자리에서 빛이 나는지.",
  "cautions": "5-7문장의 주의할 점·기운이 약한 부분·피해야 할 흐름. 단정적이지 않게.",
  "loveStyle": "5-7문장의 연애 스타일. 어떤 사람과 잘 맞는지, 사랑을 표현하는 방식.",
  "careerFit": "5-7문장의 직업 적성. 잘 풀리는 분야와 빛이 나지 않는 분야.",
  "healthCare": "4-6문장의 건강 관리 포인트. 약한 기운·체질·습관.",
  "lifeFlow": "7-10문장의 인생 큰 흐름. 자연스럽게 이어지는 흐름으로, 결정적인 시기들·움직임이 좋은 때·쉬어가야 할 때 짚어주기."
}`;
}

/**
 * AI 도사 대화에 매번 함께 전달되는 사용자 컨텍스트.
 */
export function buildChatContext(
  profile: BuildContextOptions["profile"],
): string {
  return `[질문자 정보]
${buildUserContext({ profile })}

이 사용자의 사주와 컨텍스트를 기억하고 답해주세요.
짧게 질문하더라도 답을 길게 늘어놓지 말고, 운명의 핵심만 간결히 전합니다.`;
}
