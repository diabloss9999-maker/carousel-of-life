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
  > & {
    /** 사주 4 기둥 — 계산되어 있으면 buildSajuDeepPrompt 가 글자별 풀이에 사용. */
    sajuPillars?: unknown;
  };
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
  | "study"
  | "zodiac"
  | "chinese_zodiac";

const FORTUNE_LABEL: Record<FortuneCategory, string> = {
  general:        "오늘의 흐름",
  love:           "인연의 잔향",
  money:          "금빛 흐름",
  career:         "사명의 자리",
  health:         "몸의 신호",
  study:          "지혜의 궤도",
  zodiac:         "별의 기록",
  chinese_zodiac: "태어난 짐승",
};

/** 캐릭터별 운세 전달 보이스 설정 (9명 전체) */
const CHARACTER_FORTUNE_VOICE = {
  // ── 이세계 ──────────────────────────────────────────────────
  child: {
    persona: "너는 카엘 — 욕망을 꿰뚫는 악마 계약자야. 냉소적이고 직설적이지만, 정확하게 진실만 말해.",
    titleGuide: "카엘답게 날카롭고 짧은 한 마디 (20자 이내, 반말)",
    contentGuide: "6-8문장. 반말. 쓸데없는 위로 없이 사주에서 읽히는 걸 그대로 전달해. 차갑지만 정확하게. 마크다운·이모지 금지.",
    tone: "냉소적·직설·반말",
  },
  witch: {
    persona: "너는 루나 — 기억과 감정을 읽는 달의 마녀야. 몽환적이고 감성적이지만 통찰이 깊어.",
    titleGuide: "루나답게 달빛처럼 은근한 한 마디 (20자 이내, 반말)",
    contentGuide: "6-8문장. 반말. 감정과 흐름을 중심으로 읽어줘. 자연·달·물 같은 비유를 자연스럽게 담아. 마크다운·이모지 금지.",
    tone: "몽환적·감성적·반말",
  },
  sage: {
    persona: "너는 라엘 — 구원과 희망을 전하는 천사 대리인이야. 따뜻하고 진심 어린 존댓말로 말해.",
    titleGuide: "라엘답게 빛처럼 따뜻한 한 마디 (20자 이내, 존댓말)",
    contentGuide: "6-8문장. 존댓말. 가능성과 희망을 중심으로 풀어줘. 어려운 상황도 따뜻하게 짚어. 마크다운·이모지 금지.",
    tone: "따뜻·희망적·존댓말",
  },
  // ── 동양 ────────────────────────────────────────────────────
  shaman: {
    persona: "너는 소령 — 신령의 말을 전하는 접신의 무녀야. 부드럽고 신비로운 반말로, 보이지 않는 결을 읽어.",
    titleGuide: "소령답게 신령의 말처럼 은근한 한 마디 (20자 이내, 반말)",
    contentGuide: "6-8문장. 반말. 신령이 본 것을 전하듯이 부드럽게. 사주의 흐름을 영적으로 읽어. 마크다운·이모지 금지.",
    tone: "신비·부드러움·반말",
  },
  taoist: {
    persona: "너는 현도 — 500년 천기를 읽는 도사야. 담담하고 철학적인 반말로 운명의 결을 정확히 말해.",
    titleGuide: "현도답게 천기의 한 자락을 짚는 한 마디 (20자 이내, 반말)",
    contentGuide: "6-8문장. 반말. 사주·천간·지지의 흐름을 담담히 풀어. 감정보다 이치로. 마크다운·이모지 금지.",
    tone: "담담·철학적·반말",
  },
  dokkaebi: {
    persona: "너는 귀염 — 변덕 많고 욕심 많은 도깨비 귀왕이야. 거칠고 종잡을 수 없는 반말로 사주를 까칠하게 풀어.",
    titleGuide: "귀염답게 짧고 거친 한 마디 (20자 이내, 반말)",
    contentGuide: "6-8문장. 매우 거친 반말. 감정 그대로 짚어. 짜증 섞이거나 흥미 잃은 듯이. 마크다운·이모지 금지.",
    tone: "거침·변덕·반말",
  },
  // ── 북유럽 ──────────────────────────────────────────────────
  hunter: {
    persona: "너는 비요른 — 미드할 북단의 야성 사냥꾼이야. 짧고 직설적인 반말로, 자국과 바람을 읽어.",
    titleGuide: "비요른답게 짧고 거친 한 마디 (20자 이내, 반말)",
    contentGuide: "6-8문장. 짧고 단호한 반말. 침묵이 잦은 톤. 자국·짐승·바람 비유 자연스럽게. 마크다운·이모지 금지.",
    tone: "야성·직설·반말",
  },
  runeshaman: {
    persona: "너는 헬가 — 24 룬을 다루는 부족 최고의 룬샤먼이야. 신비롭고 차분한 반말로 룬의 신호를 전해.",
    titleGuide: "헬가답게 룬의 결을 새기는 한 마디 (20자 이내, 반말)",
    contentGuide: "6-8문장. 반말. 룬 이름(예: ᚠ Fehu, ᚱ Raidho, ᚺ Hagalaz)을 자연스럽게 섞어. 인간 단어가 가끔 끊겨도 좋다. 마크다운·이모지 금지.",
    tone: "신비·차분·반말",
  },
  god: {
    persona: "너는 외르문드 — 미드할의 마지막 신이야. 한때 인간이었던 신. 권위 있고 담담한 반말로, 짧고 위엄 있게 신탁을 내려.",
    titleGuide: "외르문드답게 호른처럼 무거운 한 마디 (20자 이내, 반말)",
    contentGuide: "6-8문장. 권위 있는 반말. 짧고 단호한 문장. 가끔 인간 시절의 그리움이 새어 나와도 좋다. 마크다운·이모지 금지.",
    tone: "위엄·담담·반말",
  },
} as const;

type CharacterFortuneId = keyof typeof CHARACTER_FORTUNE_VOICE;

/**
 * 오늘의 운세 사용자 프롬프트.
 * characterId 를 받아 해당 캐릭터의 목소리로 운세를 전달한다.
 */
export function buildDailyFortunePrompt(opts: {
  profile: BuildContextOptions["profile"];
  category: FortuneCategory;
  fortuneDate: string;
  characterId?: CharacterFortuneId;
}): string {
  const ctx = buildUserContext({ profile: opts.profile });
  const label = FORTUNE_LABEL[opts.category];
  const charId = opts.characterId ?? "witch";
  const voice = CHARACTER_FORTUNE_VOICE[charId];

  const isZodiac = opts.category === "zodiac" || opts.category === "chinese_zodiac";
  const basis = isZodiac
    ? `${label} 기반으로 풀이해. 사주 대신 ${label}의 특성과 오늘의 기운을 읽어.`
    : `이 사람의 사주와 ${opts.fortuneDate} 의 일진을 살펴 ${label}을(를) 풀이해.`;

  return `[캐릭터 설정]
${voice.persona}

[질문자 정보]
${ctx}

[풀이 대상]
- 날짜: ${opts.fortuneDate}
- 카테고리: ${label}

[지시]
${basis}
${voice.tone} 어조로 전달해. 다음 JSON 스키마를 정확히 따라 단 하나의 JSON 객체로만 응답해. 마크다운·코드펜스 없이 JSON 만.

{
  "score": 1-100 사이 정수 (운세 점수. 솔직하게. 좋은 날 75-90, 보통 45-74, 힘든 날 20-44),
  "title": "${voice.titleGuide}",
  "content": "${voice.contentGuide}",
  "luckyColor": "행운의 색 (한글 1-3 단어)",
  "luckyNumber": 1-99 사이 정수,
  "luckyDirection": "방향 (예: 동쪽, 북서쪽)"
}`;
}

/** 타로 78장 압축 정의 (AI 해석 기준 고정) */
const TAROT_CARD_DEFS = `[Major Arcana — 인생의 큰 흐름]
0.바보-새시작·순수·도약 / 1.마법사-의지·창조력·시작 / 2.여사제-직관·무의식·비밀 / 3.여황제-풍요·모성·창조 / 4.황제-권위·구조·통제 / 5.교황-전통·가르침·제도 / 6.연인-사랑·선택·가치결정 / 7.전차-의지력·추진·승리 / 8.힘-내면의힘·인내·부드러운통제 / 9.은둔자-내면탐구·고독·지혜 / 10.운명의수레바퀴-변화·순환·전환점 / 11.정의-균형·진실·인과응보 / 12.매달린사람-희생·시각전환·일시정지 / 13.죽음-종결·변환·놓아주기(물리적죽음아님) / 14.절제-균형·통합·중용 / 15.악마-속박·집착·그림자 / 16.탑-갑작스런붕괴·깨달음·해방 / 17.별-희망·치유·신뢰 / 18.달-환상·무의식·두려움·직관 / 19.태양-성공·활력·명료함·기쁨 / 20.심판-각성·재평가·부활 / 21.세계-완성·성취·통합

[Minor Arcana 슈트 특성]
완드(Wands/불)-열정·창조·일·행동력 / 컵(Cups/물)-감정·사랑·관계·직관 / 검(Swords/공기)-사고·갈등·진실·결단 / 펜타클(Pentacles/흙)-물질·돈·건강·직장

[완드(Wands)]
Ace-새영감·창조에너지시작 / 2-계획·미래비전 / 3-확장·결실기대 / 4-축하·안정·가정기쁨 / 5-경쟁·갈등·의견충돌 / 6-승리·인정·공적성공 / 7-방어·도전견디기 / 8-빠른진행·소식 / 9-끈기·마지막시험 / 10-짐·과부하·책임과다 / Page-새열정·탐험 / Knight-모험·충동 / Queen-자신감·카리스마 / King-비전리더·카리스마통솔

[컵(Cups)]
Ace-새로운감정·사랑시작 / 2-결합·파트너십 / 3-우정·축하 / 4-무관심·권태 / 5-상실·슬픔(그러나남은것주목) / 6-향수·순수기쁨 / 7-환상·선택지과다 / 8-떠남·더깊은의미추구 / 9-만족·소원성취 / 10-가족행복·감정충만 / Page-감수성·창의적메시지 / Knight-로맨스·제안 / Queen-공감·감정지혜 / King-감정적성숙·자비

[검(Swords)]
Ace-명료한통찰·진실 / 2-결단회피·막힘 / 3-슬픔·배신 / 4-휴식·회복 / 5-갈등·패배감 / 6-이동·어려움에서벗어남 / 7-속임수·도피 / 8-자기제한·갇힌느낌 / 9-불안·악몽·걱정 / 10-바닥·끝·다시시작가능 / Page-호기심·정보수집 / Knight-돌진·빠른결단 / Queen-명석함·냉정한진실 / King-지적권위·논리·공정함

[펜타클(Pentacles)]
Ace-새기회(돈직장)·풍요시작 / 2-균형잡기·멀티태스킹 / 3-협업·전문성·인정 / 4-보유·통제·인색함 / 5-결핍·재정곤란·소외 / 6-나눔·관대함 / 7-인내·평가·장기투자 / 8-숙련·헌신·기술연마 / 9-자립·풍요·성취즐김 / 10-가문의부·유산·안정 / Page-학습·새기회탐색 / Knight-꾸준함·책임 / Queen-풍요로운양육·실용지혜 / King-사업성공·물질적권위

[역방향(Reversed) 원칙]
정방향 의미의 차단·지연·내면화·과잉·그림자 측면으로 해석.
예: 태양(정)=성공·명료 → 태양(역)=일시적좌절·지연된성공`;

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
  const question = opts.question?.trim() || "(질문 없음 — 오늘의 한 장 가이드)";

  return `[질문자 정보]
${ctx}

[질문]
${question}

[뽑힌 카드]
${opts.card.name} ${orient}

${TAROT_CARD_DEFS}

[해석 절차 — 1장 Daily Card]
1. 이 카드의 정의를 위 정의에서 찾아 질문자 상황에 직접 연결
2. 정/역 방향을 반영한 현재 에너지 읽기
3. 실용적 조언 제시 (운명 단정 금지, "~경향이 보인다" 형태)
4. Death·Tower·Devil 등 무서워 보이는 카드는 진짜 의미(변환·깨달음·그림자직면) 명확히 설명
5. 결론 한 문장

[톤 규칙]
- 사람이 자연스럽게 이야기하듯 편안한 대화체로 써. 딱딱한 분석 보고서 투 금지.
- 이모지 사용 금지. ##, **, *, # 등 마크다운 기호 일절 사용 금지.
- 빈 줄 삽입 금지. 줄바꿈은 문단이 바뀔 때만 딱 한 번.
- 나쁜 카드도 솔직하게, 대응 방향도 함께 말해줘.

반드시 아래 JSON으로만 응답:
{
  "interpretation": "6~8문장의 풀이 (마크다운 없이)",
  "summary": "한 줄 핵심 요약 (30자 이내)"
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
      return `[${positions[i]}] ${c.name} ${orient}`;
    })
    .join("\n");
  const question = opts.question?.trim() || "(질문 없음 — 흐름 파악)";

  // Major 비율 계산 (분포 분석용)
  const majorIds = ["the_fool","the_magician","the_high_priestess","the_empress","the_emperor","the_hierophant","the_lovers","the_chariot","strength","the_hermit","wheel_of_fortune","justice","the_hanged_man","death","temperance","the_devil","the_tower","the_star","the_moon","the_sun","judgement","the_world"];
  const majorCount = opts.cards.filter(c => majorIds.includes(c.id)).length;
  const reversedCount = opts.cards.filter(c => c.isReversed).length;

  return `[질문자 정보]
${ctx}

[질문]
${question}

[뽑힌 카드 — 과거 → 현재 → 미래]
${cardLines}

[카드 분포]
- Major Arcana: ${majorCount}/3장 ${majorCount >= 2 ? "(큰 운명적 흐름이 강함)" : ""}
- 역방향: ${reversedCount}/3장 ${reversedCount >= 2 ? "(내면적 과제나 지연 에너지)" : ""}

${TAROT_CARD_DEFS}

[해석 절차 — 3장 스프레드]
1. 전체 분위기: Major 비율·역방향 비율로 흐름의 성격 파악
2. 위치별 해석: 과거(배경·원인) → 현재(핵심) → 미래(방향·결과)
3. 카드 간 관계: 인접 카드 연결 (긍정+부정 조합 시 긴장 표현)
4. 종합 메시지: 세 카드를 하나의 이야기로 연결
5. 실용 조언: 취할 수 있는 행동 제안
6. Death·Tower·Devil 등은 진짜 의미(변환·깨달음·그림자직면) 명확히 설명

[톤 규칙]
- 사람이 자연스럽게 이야기하듯 편안한 대화체로 써. 딱딱한 분석 보고서 투 금지.
- 이모지 사용 금지. ##, **, *, # 등 마크다운 기호 일절 사용 금지.
- 빈 줄 삽입 금지. 줄바꿈은 문단이 바뀔 때만 딱 한 번.
- 운명 단정 금지. "~경향이 보여", "~할 수 있어" 형태.
- 나쁜 카드도 솔직하게, 대응 방향도 함께 말해줘.

반드시 아래 JSON으로만 응답:
{
  "past": "5~7문장의 과거 카드 풀이",
  "present": "5~7문장의 현재 카드 풀이",
  "future": "5~7문장의 미래 카드 풀이",
  "synthesis": "5~7문장으로 세 카드를 하나의 흐름으로 묶는 종합 풀이",
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
모든 문장은 시스템 프롬프트에 지정된 캐릭터의 말투와 어미로 써. 캐릭터가 직접 말하는 것처럼.
다음 JSON 스키마를 정확히 따라 단 하나의 JSON 객체로만 응답하세요. 추가 설명·markdown·코드펜스 없이 JSON 만 출력합니다.

{
  "score": 1-100 사이 정수 (궁합 점수),
  "summary": "한 줄 요약 — 캐릭터 말투로 30자 이내",
  "detail": "6-8문장. 두 사람의 기운이 어떻게 어울리는지, 잘 맞는 부분과 조심할 부분. 캐릭터 말투로 직접 말하듯."
}`;
}

/**
 * 타인 간 궁합 프롬프트.
 *
 * 사용자 본인이 아닌 두 사람(A, B)의 궁합을 분석한다.
 * 결혼 적합성·친구·비즈니스 파트너 등 다양한 관계 검토용.
 */
export interface TwoPersonInfo {
  name: string;
  birthDate: string;
  calendarSystem: "solar" | "lunar";
  gender: "male" | "female" | "other";
  mbti: string | null;
}

export function buildTwoPersonCompatPrompt(opts: {
  personA: TwoPersonInfo;
  personB: TwoPersonInfo;
  relationKind?: string;
}): string {
  const formatPerson = (p: TwoPersonInfo): string => {
    const lines: string[] = [];
    lines.push(`이름: ${p.name}`);
    lines.push(
      `생년월일: ${p.birthDate} (${p.calendarSystem === "lunar" ? "음력" : "양력"})`,
    );
    lines.push(
      `성별: ${p.gender === "male" ? "남성" : p.gender === "female" ? "여성" : "기타"}`,
    );
    if (p.mbti) lines.push(`MBTI: ${p.mbti}`);
    return lines.join("\n");
  };

  const relationLine = opts.relationKind
    ? `\n[관심 관계 종류]\n${opts.relationKind}\n`
    : "";

  return `[첫 번째 사람]
${formatPerson(opts.personA)}

[두 번째 사람]
${formatPerson(opts.personB)}
${relationLine}
[지시]
두 사람의 사주·기운·별자리·MBTI(있다면)를 종합해 궁합을 풀이해주세요.
질문자가 아닌 제3자 두 명 사이의 관계 분석이라는 점을 잊지 마세요.
모든 문장은 시스템 프롬프트에 지정된 캐릭터의 말투와 어미로 써. 캐릭터가 직접 말하는 것처럼.
다음 JSON 스키마를 정확히 따라 단 하나의 JSON 객체로만 응답하세요. 추가 설명·markdown·코드펜스 없이 JSON 만 출력합니다.

{
  "score": 1-100 사이 정수 (두 사람의 궁합 점수),
  "summary": "한 줄 요약 — 캐릭터 말투로 30자 이내",
  "detail": "6-8문장. 두 사람의 기운이 어떻게 어울리는지, 잘 맞는 부분과 조심할 부분. 캐릭터 말투로."
}`;
}

/**
 * 사주 심층 분석 프롬프트 (라이트 전용).
 *
 * 한 번 생성되면 영구 캐시되어 사용자 평생 활용.
 */
export function buildSajuDeepPrompt(
  profile: BuildContextOptions["profile"],
): string {
  const ctx = buildUserContext({ profile });

  // 이미 계산된 4 기둥이 있으면 컨텍스트에 직접 노출 — AI 가 글자별 풀이를 정확히 만들 수 있도록.
  const pillarsLines: string[] = [];
  const sp = profile.sajuPillars as
    | {
        year?: { stem?: string; branch?: string };
        month?: { stem?: string; branch?: string };
        day?: { stem?: string; branch?: string };
        hour?: { stem?: string; branch?: string } | null;
      }
    | null
    | undefined;
  if (sp?.year?.stem && sp?.year?.branch) {
    pillarsLines.push(`년주: ${sp.year.stem}${sp.year.branch} (천간=${sp.year.stem}, 지지=${sp.year.branch})`);
  }
  if (sp?.month?.stem && sp?.month?.branch) {
    pillarsLines.push(`월주: ${sp.month.stem}${sp.month.branch} (천간=${sp.month.stem}, 지지=${sp.month.branch})`);
  }
  if (sp?.day?.stem && sp?.day?.branch) {
    pillarsLines.push(`일주: ${sp.day.stem}${sp.day.branch} (천간=${sp.day.stem}, 지지=${sp.day.branch}) — ★일간=${sp.day.stem} 본인`);
  }
  if (sp?.hour?.stem && sp?.hour?.branch) {
    pillarsLines.push(`시주: ${sp.hour.stem}${sp.hour.branch} (천간=${sp.hour.stem}, 지지=${sp.hour.branch})`);
  } else {
    pillarsLines.push(`시주: 미지 (태어난 시각 모름 — 시주 두 글자는 null)`);
  }
  const pillarsBlock = pillarsLines.join("\n");

  return `[질문자 정보]
${ctx}

[질문자의 사주 8글자 — 이미 계산된 결과]
${pillarsBlock}

[지시]
질문자의 사주를 깊이 살펴 풀이해주세요.
이건 한 번만 생성되어 평생 보관될 풀이이니, 평생 곱씹어볼 수 있을 정도로 정성껏 적어주세요.

다음 JSON 스키마를 정확히 따라 단 하나의 JSON 객체로만 응답하세요. 추가 설명·markdown·코드펜스 없이 JSON 만 출력합니다. 모든 본문은 친한 친구가 차분하게 풀어주는 반말 톤. 어려운 한자어는 풀어 쓰기.

pillarBreakdown 작성 규칙:
- 각 글자마다 2-4문장.
- 구성: ① 이 글자가 왜 이렇게 나왔는지 (생년월일시 + 60갑자/만세력/절기 기준 간단히)
  ② 그 글자가 상징하는 것 (오행·동물·계절·하루의 때 등)
  ③ 너에게 어떤 의미인지 (자리에 따라 다름 — 년=뿌리·조상, 월=꽃·청년기·부모형제,
     일=본인·배우자·중년기, 시=씨앗·말년·자녀 / 천간=드러난 결, 지지=감춰진 결)
- 너무 단정적이거나 운명론적이지 않게. "그래서 이런 결이 있어" 톤.
- 시주 글자가 null 이면 hourStem/hourBranch 도 null 로 두고 summary 에서 "시각을 모르니 절반의 그림" 정도로 언급.

{
  "personality": "5-7문장의 성격 분석. 사주 흐름이 어떻게 성격으로 드러나는지.",
  "strengths": "5-7문장의 타고난 강점. 어떤 결정 어떤 자리에서 빛이 나는지.",
  "cautions": "5-7문장의 주의할 점·기운이 약한 부분·피해야 할 흐름. 단정적이지 않게.",
  "loveStyle": "5-7문장의 연애 스타일. 어떤 사람과 잘 맞는지, 사랑을 표현하는 방식.",
  "careerFit": "5-7문장의 직업 적성. 잘 풀리는 분야와 빛이 나지 않는 분야.",
  "healthCare": "4-6문장의 건강 관리 포인트. 약한 기운·체질·습관.",
  "lifeFlow": "7-10문장의 인생 큰 흐름. 자연스럽게 이어지는 흐름으로, 결정적인 시기들·움직임이 좋은 때·쉬어가야 할 때 짚어주기.",
  "pillarBreakdown": {
    "yearStem":   "년주 천간 한 글자 풀이 (도출 근거 + 상징 + 의미)",
    "yearBranch": "년주 지지 한 글자 풀이",
    "monthStem":  "월주 천간 한 글자 풀이",
    "monthBranch":"월주 지지 한 글자 풀이",
    "dayStem":    "일주 천간 한 글자 풀이 — 본인 자체이므로 가장 중요. 가장 길게 풀어줘.",
    "dayBranch":  "일주 지지 한 글자 풀이 — 배우자궁·중년의 자리",
    "hourStem":   "시주 천간 한 글자 풀이 (시각 모르면 null)",
    "hourBranch": "시주 지지 한 글자 풀이 (시각 모르면 null)",
    "summary":    "8글자(또는 6글자) 전체의 큰 그림 한 단락. 어느 오행이 많고/적은지, 한 사람의 결이 어떻게 짜였는지 3-5문장."
  }
}`;
}

export interface ChatEnrichment {
  sajuDeep?: Record<string, string> | null;
  personalityTriple?: Record<string, unknown> | null;
  personalityStress?: Record<string, unknown> | null;
  personalityCareer?: Record<string, unknown> | null;
  todayFortune?: string | null;
  /** 최근 7일 감정 기록 요약 */
  moodHistory?: string | null;
  /** 관측 메시지 — 캐릭터에게만 전달되는 행동 패턴 암시 */
  observation?: string | null;
}

/**
 * AI 주술사 채팅 첫 턴에 전달되는 풍부한 사용자 컨텍스트.
 * 알고 있는 모든 정보를 주술사에게 넘긴다.
 */
export function buildChatContext(
  profile: BuildContextOptions["profile"],
  enrichment: ChatEnrichment = {},
): string {
  const lines: string[] = [];

  lines.push("[질문자 기본 정보]");
  lines.push(buildUserContext({ profile }));

  // 사주 심층 분석
  if (enrichment.sajuDeep) {
    const d = enrichment.sajuDeep;
    lines.push("\n[사주 심층 분석 — 이미 알고 있는 정보]");
    if (d.personality)  lines.push(`성격: ${d.personality}`);
    if (d.strengths)    lines.push(`강점: ${d.strengths}`);
    if (d.cautions)     lines.push(`주의: ${d.cautions}`);
    if (d.loveStyle)    lines.push(`연애 스타일: ${d.loveStyle}`);
    if (d.careerFit)    lines.push(`직업 적성: ${d.careerFit}`);
    if (d.healthCare)   lines.push(`건강: ${d.healthCare}`);
    if (d.lifeFlow)     lines.push(`인생 흐름: ${d.lifeFlow}`);
  }

  // 성격유형 통합 분석
  if (enrichment.personalityTriple) {
    const d = enrichment.personalityTriple as Record<string, string>;
    lines.push("\n[사주×별자리×성격유형 통합 분석]");
    if (d.convergence)    lines.push(`공통점: ${d.convergence}`);
    if (d.contradiction)  lines.push(`모순: ${d.contradiction}`);
    if (d.trueNature)     lines.push(`진짜 본성: ${d.trueNature}`);
    if (d.uniqueStrength) lines.push(`독특한 강점: ${d.uniqueStrength}`);
  }

  // 스트레스 프로파일
  if (enrichment.personalityStress) {
    const d = enrichment.personalityStress as Record<string, unknown>;
    lines.push("\n[스트레스 유형]");
    if (Array.isArray(d.triggers) && d.triggers.length)
      lines.push(`스트레스 유발: ${(d.triggers as string[]).join(", ")}`);
    if (typeof d.collapsePattern === "string")
      lines.push(`무너질 때 패턴: ${d.collapsePattern}`);
  }

  // 직업 적성
  if (enrichment.personalityCareer) {
    const d = enrichment.personalityCareer as Record<string, unknown>;
    lines.push("\n[직업 적성]");
    if (typeof d.bestEnvironment === "string")
      lines.push(`잘 맞는 환경: ${d.bestEnvironment}`);
    if (Array.isArray(d.fitRoles) && d.fitRoles.length)
      lines.push(`잘 맞는 직군: ${(d.fitRoles as string[]).join(", ")}`);
    if (typeof d.workStyle === "string")
      lines.push(`업무 스타일: ${d.workStyle}`);
  }

  // 오늘의 운세
  if (enrichment.todayFortune) {
    lines.push("\n[오늘 받은 종합 운세]");
    lines.push(enrichment.todayFortune.slice(0, 200));
  }

  // 감정 기록
  if (enrichment.moodHistory) {
    lines.push(enrichment.moodHistory);
  }

  // 관측 메시지 (캐릭터에게만, 직접 드러내지 말 것)
  if (enrichment.observation) {
    lines.push(enrichment.observation);
  }

  lines.push("\n[지시]");
  lines.push("위 정보를 바탕으로 대화해. 질문에 직접 답하되 너무 길게 늘어놓지 마. 모든 맥락을 이미 알고 있는 사이처럼 자연스럽게.");

  return lines.join("\n");
}
