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
