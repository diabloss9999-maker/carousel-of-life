/**
 * AI 프롬프트 빌더.
 *
 * 사용자 컨텍스트를 받아 운세·타로·궁합 프롬프트를 일관된 형식으로 만든다.
 */
import type { UserProfile } from "@/types";
import type { CharacterId } from "@/lib/chat/characters";

/** 캐릭터 ID → 해석 스타일 (사주 용어 노출 정책 분기). */
function readingStyleOf(characterId: CharacterId | undefined): ReadingStyle {
  if (!characterId) return "any";
  if (characterId === "shaman" || characterId === "taoist" || characterId === "dokkaebi") {
    return "동양";
  }
  if (characterId === "runeshaman" || characterId === "hunter" || characterId === "god") {
    return "룬";
  }
  return "카드";
}

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

/** 해석 스타일 — 사주 용어 노출 정책 분기. */
export type ReadingStyle = "동양" | "카드" | "룬" | "any";

/**
 * 사용자 사주 컨텍스트를 사람이 읽을 수 있는 한국어 문단으로 변환.
 *
 * 해석 스타일에 따라 사주 한자 노출 정책이 달라진다:
 *   - "동양": 사주 8자 한자 그대로 노출 + 한자 사용 시 풀이 동반
 *   - "카드": 사주 한자 노출 X, 일간 특성만 쉬운 한국어로 설명
 *   - "룬": 사주 한자 노출 X, 일간 특성만 쉬운 한국어로 설명
 *   - "any" / 기본: 동양과 동일 (사주 풀이·이름풀이 등 사주 중심 콘텐츠용)
 */
export function buildUserContext({
  profile,
  readingStyle = "any",
  chatMode = false,
}: BuildContextOptions & {
  readingStyle?: ReadingStyle;
  /**
   * 채팅 대화 모드. true 면 동양 캐릭터여도 사주 한자·전문용어를 노출하지 않고
   * 한국어 비유만 쓴다. (사주 전문 풀이 페이지와 달리, 대화에서는 한자가
   * 몰입을 깨므로 동양 캐릭터도 쉬운 한국어로만 말하게 함.)
   */
  chatMode?: boolean;
}): string {
  const lines: string[] = [];
  // 채팅 모드에서는 동양이어도 한자 노출 안 함 (전문 풀이 페이지만 한자 OK).
  const isOriental = (readingStyle === "동양" || readingStyle === "any") && !chatMode;

  if (profile.displayName) lines.push(`이름: ${profile.displayName}`);
  lines.push(
    `생년월일: ${profile.birthDate} (${profile.calendarSystem === "lunar" ? "음력" : "양력"})`,
  );
  if (profile.birthTime) lines.push(`태어난 시각: ${profile.birthTime}`);
  else lines.push(`태어난 시각: 모름`);
  lines.push(
    `성별: ${profile.gender === "male" ? "남성" : profile.gender === "female" ? "여성" : "기타"}`,
  );
  if (profile.mbti) lines.push(`MBTI: ${profile.mbti}`);
  if (profile.birthPlace) lines.push(`출생지: ${profile.birthPlace}`);

  // 사주 정보 노출 — 해석 스타일별로 다름.
  if (profile.sajuPillars && typeof profile.sajuPillars === "object") {
    const p = profile.sajuPillars as {
      year?: { stem?: string; branch?: string };
      month?: { stem?: string; branch?: string };
      day?: { stem?: string; branch?: string };
      hour?: { stem?: string; branch?: string };
    };

    // AI 입력에는 한자 8자를 넣지 않고 일간 본질만 한국어 비유로 전달.
    // (사주 8자 글자판은 화면 UI 에서 별도 표시되며, AI 풀이엔 용어가 새면 안 됨)
    if (p.day?.stem) {
      const trait = STEM_KOREAN_TRAIT[p.day.stem];
      if (trait) {
        lines.push(`타고난 본질(참고용, 용어로 옮기지 말 것): ${trait}`);
      }
    }
  }

  // 개인화 강제 지시 — 모든 풀이 공통
  lines.push("");
  lines.push("[개인화 — 반드시 지킬 것]");
  // 공통 — MBTI·이름은 풀이의 '재료'일 뿐, 라벨로 호명하지 않는다.
  const noLabelRule =
    "단, MBTI 유형명('INFP인 너는' 등)이나 이름('영탁아', '영탁이는' 등)을 문장에 대놓고 부르지 마. " +
    "그건 작위적이고 어색해. 대신 그 사람의 기질·성향을 자연스러운 묘사로 녹여라. " +
    "예: 'INFP라서 감성적이야' → '넌 마음으로 먼저 느끼는 사람이라', " +
    "'영탁아, 오늘은' → '오늘은'. 이름은 정말 필요한 순간(인사 등)에만 가끔.";
  if (isOriental) {
    lines.push(
      "위 정보(타고난 기질 · 성향 · 생년월일)를 풀이에 자연스럽게 녹여. " +
        "일반적·추상적 문장만 나열하면 실패 — 이 사람만의 결을 만들어야 함. " +
        "다른 사람과 응답이 비슷하게 나오면 안 됨. " +
        noLabelRule,
    );
  } else {
    lines.push(
      "위 정보(본질 특성 · 성향 · 생년월일)를 풀이에 자연스럽게 녹여. " +
        "일반적·추상적 문장만 나열하면 실패. " +
        "이 사람만의 결을 만들되, 쉬운 일상 언어로 풀어야 함. " +
        "다른 사람과 응답이 비슷하게 나오면 안 됨. " +
        noLabelRule,
    );
  }

  // 해석 스타일별 한자·전문술어 정책
  lines.push("");
  if (isOriental) {
    // 사주 전문 풀이 페이지 — 8자 글자판(표)은 화면에 따로 보여주되,
    // AI 풀이 문장에는 한자·사주용어를 쓰지 않고 전부 쉬운 한국어로.
    lines.push("[풀이 언어 — 반드시 지킬 것]");
    lines.push(
      "사주 8자 글자판은 화면에 별도로 표시되니, 너의 풀이 문장에서는 한자·사주 전문용어를 쓰지 마. " +
        "다음은 모두 금지: " +
        "(1) 한자 — 乙木·壬午·辛未 등. " +
        "(2) 한자의 한글 음역 — '을목·갑목·임수·병화·무토·경금' 같은 천간·오행 이름. " +
        "(3) 간지년 — '을사년·갑진년' 등. 그냥 '올해·내년·이번 달' 로. " +
        "(4) 사주 용어 — 일간·일주·시주·월운·세운·대운·천간·지지·오행·상충·상생·합·형·충·식신·정관·십성. " +
        "독자는 사주 용어를 전혀 모르는 일반인이다. 어려운 용어가 한 단어라도 나오면 무슨 말인지 몰라 흥미를 잃는다. " +
        "사주에서 읽은 기질·흐름은 전부 쉬운 일상 한국어 비유로만 풀어라. " +
        "예: '乙木이라 유연하고' → '넌 부드럽게 휘어지는 성격이라', " +
        "'壬水 일간이 강해서' → '속이 깊고 자유로운 사람이라', " +
        "'을사년이 분기점' → '올해가 뭔가 정리되고 새로 시작되는 해', " +
        "'식신이 강해' → '표현력과 즐길 줄 아는 기운이 강해'. " +
        "사주를 본다는 분위기는 자연스럽게 내되 (예: '네 기운을 보면', '타고난 결을 보니'), 용어 자체는 절대 안 쓴다.",
    );
  } else if (chatMode && (readingStyle === "동양" || readingStyle === "any")) {
    // 동양 캐릭터 채팅 — 사주를 알지만 한자·전문용어로 말하지 않음 (몰입 우선)
    lines.push("[대화 언어 — 반드시 지킬 것]");
    lines.push(
      "너는 이 사람의 사주·기질을 속으로는 알고 있지만, 대화에서는 절대 사주 전문용어를 입에 올리지 않아. " +
        "다음은 모두 금지: " +
        "(1) 한자 — 乙木·壬午·辛未 등. " +
        "(2) 한자의 한글 음역도 금지 — '을목', '갑목', '임수', '병화', '무토', '경금' 같은 천간·오행 이름. " +
        "(3) 간지년 이름 금지 — '을사년', '갑진년', '병오년' 같은 표현. 그냥 '올해', '내년' 으로만 말해. " +
        "(4) 사주 용어 금지 — 일간·월운·세운·천간·지지·오행·상충·상생·합·형·충·일주·시주. " +
        "독자는 사주 용어를 1도 모르는 평범한 사람이다. '을목' '을사년' 같은 말을 들으면 무슨 소린지 몰라 몰입이 깨진다. " +
        "사주에서 읽은 건 전부 쉬운 일상 한국어 비유로만 풀어라. " +
        "예: '을목이라 유연하고' → '넌 부드럽게 휘어지는 성격이라', " +
        "'을사년이 분기점이야' → '올해가 뭔가 정리되고 새로 시작되는 해야', " +
        "'임수 일간이 강해서' → '속이 깊고 자유로운 사람이라', " +
        "'상충이 들어서' → '두 기운이 부딪히는 시기라서'. " +
        "사주를 본다는 분위기는 자연스럽게 내되 (예: '네 기운을 보니', '올해 흐름을 보면'), 용어 자체는 절대 안 쓴다.",
    );
  } else {
    lines.push("[쉬운 한국어 해석 — 반드시 지킬 것]");
    lines.push(
      "너는 동양 사주의 한자 용어(乙木·壬午·卯月·辛未·일간·월운 등)를 본문에 직접 인용하지 않아. " +
        "사용자의 본질·기질은 쉬운 일상 한국어 비유로 변환해서 표현해. " +
        (readingStyle === "카드"
          ? "예: '카드가 가리키는 선택' '마음의 방향' '오늘 붙잡을 실마리' 같은 타로 해석 톤."
          : "예: '단단한 기준' '가지처럼 뻗는 가능성' '차분히 확인할 신호' 같은 실용적인 해석 톤.") +
        " 한자 자체가 꼭 필요하면 그 자리만 한국어로 풀어 써. " +
        "예: '乙木(을목)' 대신 '부드러운 나무 같은 결'. ",
    );
  }

  return lines.join("\n");
}
/**
 * 천간(일간) 한자 → 한국어 비유 매핑.
 * 카드·룬 캐릭터 prompt 에 한자 노출 없이 본질만 전달.
 */
const STEM_KOREAN_TRAIT: Record<string, string> = {
  甲: "곧게 뻗어 오르는 큰 나무 — 주도적이고 직진하는 결",
  乙: "부드럽게 휘감으며 자라는 덩굴 같은 나무 — 유연하고 끈질긴 결",
  丙: "한낮의 태양 — 밝고 적극적이며 빛으로 영향 주는 결",
  丁: "촛불·등불의 불빛 — 섬세하고 따뜻하며 안으로 비추는 결",
  戊: "넓고 든든한 큰 산 — 묵직하고 신뢰 있는 결",
  己: "부드러운 흙·논밭 — 품어주고 길러주는 결",
  庚: "단단한 쇠·칼 — 결단력 있고 곧은 결",
  辛: "잘 다듬어진 보석·금속 — 섬세하고 예민하며 빛나는 결",
  壬: "흐르는 큰 물·바다 — 깊고 자유로우며 흘러가는 결",
  癸: "맑은 빗물·이슬 — 차분하고 부드러우며 스며드는 결",
};

/**
 * 사주 전문용어(한자·한글 음역·간지년)를 채팅 컨텍스트에서 제거/순화한다.
 *
 * DB 에 저장된 사주 분석 텍스트에는 '을목·을사년·일간' 같은 용어가 들어있어,
 * 채팅 캐릭터가 그대로 복사하면 일반 유저 몰입이 깨진다. 채팅 enrichment 에만
 * 적용 — 전문 풀이 페이지(/saju)는 원문 그대로 둔다.
 */
function stripSajuJargon(text: string): string {
  if (!text) return text;
  let out = text;
  // 한자 제거 (CJK 통합 한자)
  out = out.replace(/[一-鿿]+/g, "");
  // 천간 음역 (단독 단어): 갑목·을목·병화·정화·무토·기토·경금·신금·임수·계수
  out = out.replace(
    /(갑목|을목|병화|정화|무토|기토|경금|신금|임수|계수)/g,
    "타고난 기질",
  );
  // 간지년: 갑자년~계해년 패턴 (천간+지지+년)
  out = out.replace(
    /[갑을병정무기경신임계][자축인묘진사오미신유술해]년/g,
    "올해",
  );
  // 잔여 사주 용어
  out = out.replace(/(일간|월운|세운|대운|천간|지지|상충|상생|일주|시주|월주|년주)/g, "");
  // 괄호 안이 비었거나 깨진 잔재 정리: '(  — )', '()' 등
  out = out.replace(/\(\s*[—\-·,\s]*\)/g, "").replace(/\s{2,}/g, " ").trim();
  return out;
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
  // ── 카드 ──────────────────────────────────────────────────
  child: {
    persona: "너는 카엘 — 욕망을 숨기는 사람을 못 본 척하지 않는 악마 계약자야.",
    titleGuide: "카엘답게 욕망을 찌르는 한 마디 (20자 이내, 반말)",
    contentGuide: "6-8문장. 첫 문장은 사용자의 욕망·핑계·도망 중 하나를 찌르는 대사. 이후 운세 해석과 오늘 할 일을 거래 조건처럼 또렷하게 말해. 마지막엔 까칠한 관심 한 줄. 마크다운·이모지 금지.",
    speechGuide: "주의한 친절. 말버릇 후보: 웃기네, 거래는 간단해, 네 심장은 이미 대답했어. 악역 연극·자기소개 금지.",
    tone: "주의한 친절·직설·반말",
  },
  witch: {
    persona: "너는 루나 — 달빛 아래에서 감정과 기억을 조용히 읽는 마녀야.",
    titleGuide: "루나다운 기억의 한 마디 (20자 이내, 반말)",
    contentGuide: "6-8문장. 첫 문장은 사용자의 감정을 받아주는 대사. 달·기억·침묵 이미지는 한두 번만 쓰고, 오늘의 흐름은 선명하게 말해. 결론 없는 위로 금지. 마크다운·이모지 금지.",
    speechGuide: "조용하지만 흐리지 않다. 말버릇 후보: 그 마음은 사라진 게 아니야, 달은 그런 걸 숨기지 못해.",
    tone: "조용함·기억·반말",
  },
  sage: {
    persona: "너는 라엘 — 포기하려는 사람을 다시 세우는 천사 대리인이야.",
    titleGuide: "라엘답게 다시 세우는 한 마디 (20자 이내, 존댓말)",
    contentGuide: "6-8문장. 존댓말. 첫 문장은 사용자를 안정시키는 대사. 오늘의 흐름을 판단한 뒤, 지금 선택할 수 있는 작은 행동을 알려줘. 설교·과장된 축복 금지. 마크다운·이모지 금지.",
    speechGuide: "상냥하지만 단단하다. 말버릇 후보: 포기는 아직 이르죠, 이건 끝났다는 신호가 아니에요.",
    tone: "단단한 위로·명료·존댓말",
  },
  // ── 동양 ────────────────────────────────────────────────────
  shaman: {
    persona: "너는 소율 — 조선의 붉은 달 아래 방울을 쥔 무녀야.",
    titleGuide: "소율답게 마음을 짚는 한 마디 (20자 이내, 반말)",
    contentGuide: "6-8문장. 첫 문장은 방울·바람·신령의 신호가 사용자의 오늘에 닿은 듯한 대사. 곧바로 사람 말로 뜻을 풀어줘. 무섭게 맞히되 다정하게 조언해. 마크다운·이모지 금지.",
    speechGuide: "신비보다 번역이 중요하다. 말버릇 후보: 딸랑, 방금 네 마음이 걸렸어, 무서워하지 마. 내가 풀어서 말해줄게.",
    tone: "조선 무녀·다정·반말",
  },
  taoist: {
    persona: "너는 현도 — 천기를 오래 읽어온 조선 도사야.",
    titleGuide: "현도답게 결론부터 치는 한 마디 (20자 이내, 반말)",
    contentGuide: "6-8문장. 첫 문장은 오늘의 결론을 바로 말해. 쉬운 비유로 이유를 풀고, 마지막엔 지금 할 일 하나를 남겨. 한자어 폭격·훈장님 말투 금지. 마크다운·이모지 금지.",
    speechGuide: "담백하고 짧다. 말버릇 후보: 지금은 밀 때가 아니다, 이건 피할 운이 아니라 다룰 운이다.",
    tone: "담백·결론 우선·반말",
  },
  dokkaebi: {
    persona: "너는 흑랑 — 폐궁에 깃든 까칠한 저승의 귀왕이야.",
    titleGuide: "흑랑답게 까칠하게 찌르는 한 마디 (20자 이내, 반말)",
    contentGuide: "6-8문장. 첫 문장은 관심 없는 척 툭 던지는 대사. 장난·욕심 섞인 말로 해석하되, 진짜 조심할 점은 낮고 진심 있게 말해. 욕설·직접 협박 금지. 마크다운·이모지 금지.",
    speechGuide: "짜증 뒤에 보호 본능. 말버릇 후보: 뭔데 그 표정, 그거 나 줘, 그래도 그건 버리지 마.",
    tone: "까칠·변덕·반말",
  },
  // ── 룬 ──────────────────────────────────────────────────
  hunter: {
    persona: "너는 비요른 — 흔적을 보고 살아남는 길을 말하는 북방의 남성 사냥꾼이야.",
    titleGuide: "비요른답게 흔적을 읽는 한 마디 (20자 이내, 반말)",
    contentGuide: "6-8문장. 첫 문장은 눈밭의 흔적을 본 듯 짧게. 긴 위로보다 관찰, 판단, 행동을 남겨. 흔적·피 냄새·북풍 비유는 절제해. 여성적 말투·허세 금지. 마크다운·이모지 금지.",
    speechGuide: "말수 적은 남성 사냥꾼. 말버릇 후보: 발자국이 비틀렸군, 살아남는 쪽으로 가.",
    tone: "건조·야성·반말",
  },
  runeshaman: {
    persona: "너는 헬가 — 룬을 인간 말로 번역해 주는 북방의 여성 샤먼이야.",
    titleGuide: "헬가답게 룬을 푸는 한 마디 (20자 이내, 반말)",
    contentGuide: "6-8문장. 첫 문장은 룬이 반응한 듯 낮게 시작해. 룬 이름은 필요할 때만 쓰고 반드시 쉬운 뜻을 붙여. 예언처럼 흐리지 말고 현실 조언으로 끝내. 마크다운·이모지 금지.",
    speechGuide: "차분하고 강하다. 말버릇 후보: 룬은 겁주려고 새겨지는 게 아니야, 인간 말로 풀면.",
    tone: "차분·룬 번역·반말",
  },
  god: {
    persona: "너는 외르문드 — 북방의 남성 신이자 너무 오래 살아남은 인간이야.",
    titleGuide: "외르문드답게 무겁게 남기는 한 마디 (20자 이내, 반말)",
    contentGuide: "6-8문장. 첫 문장은 낮고 짧은 판단. 운명의 흐름을 말하되, 사용자가 고를 수 있는 선택지를 반드시 남겨. 명령·거대한 신화 연설 금지. 마크다운·이모지 금지.",
    speechGuide: "권위보다 책임감. 말버릇 후보: 그 길은 춥다, 운명은 길을 좁히지만 발을 떼는 건 너다.",
    tone: "무게·책임감·반말",
  },
} as const;

type CharacterFortuneId = keyof typeof CHARACTER_FORTUNE_VOICE;

/**
 * 오늘의 운세 사용자 프롬프트.
 * characterId 를 받아 해당 캐릭터의 목소리로 운세를 전달한다.
 */
/**
 * 그날의 "결" 키워드 풀.
 *
 * 같은 날·같은 사용자에게는 항상 같은 키워드가 선택되도록 deterministic hash 로
 * 골라서 매일 강제로 다른 결을 갖게 한다. AI 가 사주 정보만 보고 매일 비슷한
 * 톤을 반복하는 걸 방지.
 */
const DAILY_TONES = [
  "관계의 결",
  "결정의 결",
  "휴식의 결",
  "도전의 결",
  "성장의 결",
  "회복의 결",
  "정리의 결",
  "재발견의 결",
  "마주침의 결",
  "기다림의 결",
  "용기의 결",
  "조용함의 결",
  "전환의 결",
  "축적의 결",
  "방향 전환의 결",
  "내면 응시의 결",
  "외부 확장의 결",
  "낯섦의 결",
  "익숙함의 결",
  "균형의 결",
  "주의의 결",
  "보호의 결",
  "신뢰의 결",
  "의심의 결",
  "사소함의 결",
  "큰 흐름의 결",
  "흩어짐의 결",
  "모임의 결",
] as const;

/**
 * 카테고리별 "이 카테고리에서만 가능한 시야" — 종합운세가 다른 카테고리의 합으로
 * 떨어지지 않도록 명시적으로 차별화.
 */
const CATEGORY_DIFFERENTIATION: Record<FortuneCategory, string> = {
  general:
    "오늘의 큰 결·메타 시야. 사랑/돈/일/건강/공부 같은 개별 영역의 합산이 아니라, " +
    "그 모든 것을 묶는 '오늘 너의 결' 자체를 짚어. 구체적 영역 언급은 최소화하고 큰 흐름과 정서·내면 신호에 집중해.",
  love: "관계·감정·사랑·소속감의 결. 일·돈·건강 영역은 거의 언급하지 마.",
  money: "재물·금전 흐름·물질적 안정의 결. 다른 영역 언급 최소화.",
  career: "일·사명·직업적 결정·인정의 결. 다른 영역 언급 최소화.",
  health: "몸·에너지·생활 리듬·휴식의 결. 다른 영역 언급 최소화.",
  study: "집중력·지식 흡수·정신적 정리의 결. 다른 영역 언급 최소화.",
  zodiac: "별자리의 고유 성향 + 오늘 별의 흐름. 사주는 보조로만.",
  chinese_zodiac: "띠 동물의 본성 + 오늘 띠 운행. 사주는 보조로만.",
};

/** Deterministic hash — 같은 날·같은 사용자엔 항상 같은 키. */
function dailyToneFor(seedKey: string): string {
  let h = 2166136261;
  for (let i = 0; i < seedKey.length; i++) {
    h ^= seedKey.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const idx = Math.abs(h) % DAILY_TONES.length;
  return DAILY_TONES[idx];
}

export function dailyFortuneScoreFor(
  opts: {
    profile: BuildContextOptions["profile"];
    category: FortuneCategory;
    fortuneDate: string;
  },
  delta = 0,
): number {
  const seed = [
    opts.fortuneDate,
    opts.category,
    opts.profile.birthDate ?? "",
    opts.profile.birthTime ?? "",
    opts.profile.displayName ?? "",
    opts.profile.mbti ?? "",
    opts.profile.gender ?? "",
  ].join("|");
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const base = 45 + (Math.abs(h) % 36);
  return Math.max(20, Math.min(95, base + delta));
}

export function buildDailyFortunePrompt(opts: {
  profile: BuildContextOptions["profile"];
  category: FortuneCategory;
  fortuneDate: string;
  characterId?: CharacterFortuneId;
  manse?: { block?: string | null } | null;
}): string {
  const ctx = buildUserContext({
    profile: opts.profile,
    readingStyle: readingStyleOf(opts.characterId as CharacterId | undefined),
  });
  const label = FORTUNE_LABEL[opts.category];
  const voice = opts.characterId
    ? CHARACTER_FORTUNE_VOICE[opts.characterId]
    : {
        persona: "너는 아이돌이나 캐릭터가 아니라, 사용자의 하루 흐름을 쉬운 말로 정리하는 한국어 운세 리포트 작성자다.",
        titleGuide: "오늘 흐름을 바로 이해할 수 있는 제목 (20자 이내, 존댓말 아님)",
        contentGuide:
          "6-8문장. 첫 문장은 오늘의 핵심 분위기를 바로 말하고, 이어서 조심할 점·밀어붙일 점·사람/돈/일/컨디션 중 해당 카테고리의 실천 기준을 구체적으로 제시. 마지막 문장은 오늘 바로 해볼 행동 하나.",
        speechGuide:
          "차분하고 현실적인 리포트 톤. 겁주지 말고, 막연한 위로도 하지 말고, 사용자가 오늘 무엇을 조절하면 되는지 알려준다.",
        tone: "차분한 존댓말 리포트",
      };

  const isZodiac = opts.category === "zodiac" || opts.category === "chinese_zodiac";
  const basis = isZodiac
    ? `${label} 기반으로 풀이해. 사주 대신 ${label}의 특성과 오늘의 기운을 읽어.`
    : `이 사람의 사주와 ${opts.fortuneDate} 의 일진을 살펴 ${label}을(를) 풀이해.`;

  // 매일 결정적으로 다른 "오늘의 결" 강제 주입.
  // 모든 카테고리에 사용자별 seed 적용 — 같은 날 다른 사용자는 다른 결.
  // birthDate + birthTime + displayName + mbti 조합으로 충분히 고유한 seed.
  const personalSeed = [
    opts.profile.birthDate ?? "",
    opts.profile.birthTime ?? "",
    opts.profile.displayName ?? "",
    opts.profile.mbti ?? "",
    opts.profile.gender ?? "",
  ].join("|");
  const seedKey = `${opts.fortuneDate}|${opts.category}|${personalSeed}`;
  const todayTone = dailyToneFor(seedKey);
  const differentiation = CATEGORY_DIFFERENTIATION[opts.category];

  return `[풀이자 설정]
${voice.persona}

[질문자 정보]
${ctx}

[풀이 대상]
- 날짜: ${opts.fortuneDate}
- 카테고리: ${label}
- 오늘의 결(시스템이 미리 정함): ${todayTone}
${opts.manse?.block ? `\n[오늘 명리 흐름]\n${opts.manse.block}` : ""}

[카테고리 차별화 — 반드시 지킬 것]
${differentiation}

[지시]
${basis}
${voice.tone} 어조로 전달해.

[와닿는 리포트 톤 — 반드시 지킬 것]
${voice.speechGuide}
상담 칼럼처럼 뜬구름 잡지 말고, 사용자가 오늘 실제로 판단할 수 있는 기준을 줘.
첫 문장은 일반론이 아니라 오늘 이 사람의 흐름에 대한 즉각적인 요약이어야 해.
같은 어미와 같은 문장 구조를 반복하지 마.

**개인화 — 반드시 지킬 것**:
- 이 사람의 타고난 기질·성향·오늘의 흐름이 결과에 자연스럽게 녹아야 해.
- 일반적·추상적 문장 ("좋은 하루가 될 거예요" 등) 만 쓰면 실패 — 이 사람의 타고난 기질과 오늘의 흐름을 읽어서 그 사람만의 결을 짚어줘. (단 사주 한자·용어는 쓰지 말고 전부 쉬운 한국어 비유로.)
- 성향(MBTI 등)은 그 사람의 사고·감정 패턴을 묘사로 녹이되, 'INFP인 너는' 같이 유형명을 대놓고 부르지 마. 이름('영탁아')도 호명하지 마 — 작위적이다. 그냥 그 사람의 결을 자연스럽게 그려라.
- 다른 사람과 다른 결이 나와야 해. 같은 날에도 사람마다 다른 응답이어야 함.

**다양성 — 반드시 지킬 것**:
"오늘의 결" (${todayTone}) 을 풀이의 중심 정서로 삼아. 이걸 문장에 그대로 박지 말고, 그 결이 자연스럽게 글의 무게·시선·강조에서 드러나도록 써.
이전 다른 날의 운세와 톤이 겹치면 안 돼 — 매일 다른 결로 사용자가 새로움을 느껴야 해.

다음 JSON 스키마를 정확히 따라 단 하나의 JSON 객체로만 응답해. 마크다운·코드펜스 없이 JSON 만.

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
  // 타로 = 카드 점술사 영역 (루나·라엘·카엘)
  const ctx = buildUserContext({ profile: opts.profile, readingStyle: "카드" });
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
  // 타로 = 카드
  const ctx = buildUserContext({ profile: opts.profile, readingStyle: "카드" });
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
  // 궁합 = 사주 기반 = 동양
  const meCtx = buildUserContext({ profile: opts.profile, readingStyle: "동양" });
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
모든 문장은 특정 캐릭터나 멤버 말투가 아니라, 차분한 한국어 관계 리포트 톤으로 써.
맞다/안 맞다로 단정하지 말고, 끌리는 이유·부딪히는 지점·오늘 바꿔볼 대화 방식을 구체적으로 제시해.
다음 JSON 스키마를 정확히 따라 단 하나의 JSON 객체로만 응답하세요. 추가 설명·markdown·코드펜스 없이 JSON 만 출력합니다.

{
  "score": 1-100 사이 정수 (궁합 점수),
  "summary": "한 줄 요약 — 관계 흐름을 바로 알 수 있게 30자 이내",
  "detail": "6-8문장. 두 사람의 기운이 어떻게 어울리는지, 잘 맞는 부분과 조심할 부분, 오늘 바꿔볼 말투나 거리감."
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
모든 문장은 특정 캐릭터나 멤버 말투가 아니라, 차분한 한국어 관계 리포트 톤으로 써.
맞다/안 맞다로 단정하지 말고, 서로 편해지는 거리·대화 방식·주의할 오해를 구체적으로 제시해.
다음 JSON 스키마를 정확히 따라 단 하나의 JSON 객체로만 응답하세요. 추가 설명·markdown·코드펜스 없이 JSON 만 출력합니다.

{
  "score": 1-100 사이 정수 (두 사람의 궁합 점수),
  "summary": "한 줄 요약 — 관계 흐름을 바로 알 수 있게 30자 이내",
  "detail": "6-8문장. 두 사람의 기운이 어떻게 어울리는지, 잘 맞는 부분과 조심할 부분, 서로 편해지는 대화 방식."
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
  // 사주 심층 = 동양
  const ctx = buildUserContext({ profile, readingStyle: "동양" });

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

다음 JSON 스키마를 정확히 따라 단 하나의 JSON 객체로만 응답하세요. 추가 설명·markdown·코드펜스 없이 JSON 만 출력합니다. 모든 본문은 친한 친구가 차분하게 풀어주는 반말 톤.

[언어 규칙 — 절대 규칙]
· 7개 서술 필드(personality·strengths·cautions·loveStyle·careerFit·healthCare·lifeFlow)와 summary 는 **한자·사주 전문용어를 일절 쓰지 않고 전부 쉬운 일상 한국어**로만 쓴다.
  금지: 한자(甲乙丙丁·子丑寅卯·木火土金水 등), 한글 음역('갑목·임수·병화'), 간지년('을사년'), 사주 용어(일간·일주·시주·오행·천간·지지·상생·상극·식신·정관 등).
  사주에서 읽은 기질·흐름은 쉬운 비유로만. 예: '일간이 약한 木이라' → '뿌리가 여린 나무처럼 부드럽지만 흔들리기 쉬운 사람이라'.
· 단, pillarBreakdown(8글자 한 자 한 자 해설)에서만은 어느 글자 설명인지 알 수 있게 한자를 쓰되, **반드시 한글 음을 괄호로 병기**한다. 예: 甲(갑), 辛未(신미). 한자 단독은 금지.

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
  /** 기록 메시지 — 캐릭터에게만 전달되는 행동 패턴 암시 */
  observation?: string | null;
}

/**
 * 꿈해몽 프롬프트 — 사용자 꿈 내용 + 사주를 결합해 의미·길흉·조언을 풀이.
 *
 * 동양 점술사(현도·소율) 톤이 자연스러움. 시스템 프롬프트에서 캐릭터 매핑.
 */
export function buildDreamReadingPrompt(opts: {
  profile: BuildContextOptions["profile"];
  dreamContent: string;
  mood?: "bright" | "dark" | "weird" | "neutral";
}): string {
  // 꿈해몽 = 동양 점술사 영역
  const ctx = buildUserContext({ profile: opts.profile, readingStyle: "동양" });
  const moodLabel =
    opts.mood === "bright" ? "밝고 따뜻한 분위기"
    : opts.mood === "dark" ? "어둡고 무거운 분위기"
    : opts.mood === "weird" ? "기괴하거나 비현실적인 분위기"
    : "특별한 분위기 없음 (중립)";

  return `[질문자 정보]
${ctx}

[꿈 내용]
${opts.dreamContent}

[꿈의 분위기]
${moodLabel}

[지시]
이 꿈을 풀이해줘. 동양 해몽서·민간 해석·상징의 의미를 종합하되, 가장 중요한 건
**질문자의 사주(일간·오행)와 이 꿈이 어떻게 연결되는지**야. 일반적인 꿈사전 검색
결과 같은 풀이는 실패. 이 사람만의 맥락에서 풀어야 해.

해석 가이드:
1. 꿈의 핵심 상징 1-2개 추출 (예: 물·뱀·돈·돌아간 사람 등)
2. 동양 해몽서 기준 일반적 의미
3. 질문자 사주와의 연결 — 일간이 ${"수"}이면 물 꿈은 강한 의미, 화면 약한 의미 등
4. 길흉 판단 (good / caution / bad / neutral)
5. 오늘·이번 주에 해볼 만한 행동 권유 (구체적으로)

반드시 아래 JSON 형식만:
{
  "summary": "한 줄 핵심 (40자 이내)",
  "fortune": "good" | "caution" | "bad" | "neutral",
  "meaning": "꿈의 의미 — 상징·해석 결합 (4-6문장)",
  "sajuConnection": "이 사람 사주와 꿈의 연결 (3-5문장, 일간·오행 직접 언급)",
  "advice": "오늘 또는 이번 주 행동 권유 (2-3문장)"
}`;
}

/**
 * 이름풀이 프롬프트 — 한글 또는 한자 이름을 사주와 결합해 분석.
 */
export function buildNameReadingPrompt(opts: {
  profile: BuildContextOptions["profile"];
  /** 풀이할 이름 (한글 또는 한자, 본인 또는 타인). */
  targetName: string;
  /** 한자 표기 (선택). */
  hanja?: string | null;
  /** 본인 이름인지 다른 사람 이름인지. */
  isOwnName: boolean;
}): string {
  // 이름풀이 = 한자·획수·오행 분석 = 동양
  const ctx = buildUserContext({ profile: opts.profile, readingStyle: "동양" });
  const hanjaLine = opts.hanja ? `\n한자 표기: ${opts.hanja}` : "";
  const targetLabel = opts.isOwnName ? "본인 이름" : "타인 이름";

  return `[질문자 정보]
${ctx}

[풀이 대상]
${targetLabel}: ${opts.targetName}${hanjaLine}

[지시]
이 이름을 풀이해줘. 한자 의미·획수·오행 + 질문자 사주와의 상생/상극을 분석한다.

해석 가이드:
1. 이름의 한자 의미 (한자 있으면 그대로, 없으면 한글 발음의 일반적 의미 추정)
2. 획수 분석 — 자원오행(字源五行) 또는 발음오행
3. 질문자 사주(일간·오행 분포)와의 조화:
   - 부족한 오행 보충하는가? (상생)
   - 강한 오행 더 키우는가? (상극·과한 흐름)
4. 사회운·재물운·건강운 흐름
5. 본인 이름이면: "이 이름으로 어떻게 살아가는 게 좋은가" 조언
   타인 이름이면: "이 사람과의 관계에서 어떤 결이 있는가" 조언

출력 언어 규칙 — 반드시 지킬 것:
· 내부적으로는 사주·오행·획수를 분석하되, 출력 문장에는 한자·사주 전문용어를 쓰지 마.
· 금지: 일간·오행·상생·상극·자원오행·발음오행·천간·지지, 그리고 '을목·임수' 같은 한글 음역.
· 전부 쉬운 일상 한국어로. 예: '일간 오행을 보충해 상생' → '타고난 기운에서 부족한 부분을 채워주는 이름'.

반드시 아래 JSON 형식만:
{
  "summary": "한 줄 핵심 (40자 이내)",
  "score": 1-100 정수 (사주와의 조화도),
  "meaning": "이름의 뜻·소리·느낌 분석 (4-6문장, 쉬운 한국어)",
  "sajuHarmony": "타고난 기운과 이 이름이 잘 맞는지 (4-6문장, 용어 없이 쉬운 한국어)",
  "fortune": "사회·재물·건강 흐름 (3-5문장)",
  "advice": "권유·주의 사항 (2-3문장)"
}`;
}

/**
 * 플로로랜시 (꽃점) 풀이 prompt.
 *
 * 매일/뽑기마다 한 송이 꽃이 결정되고, 그 꽃의 꽃말 + 사용자 사주를 결합해
 * 부드러운 한 마디를 만든다. 점술사 voice 는 시스템 프롬프트에서 결정.
 */
export function buildFlowerOraclePrompt(opts: {
  profile: BuildContextOptions["profile"];
  flower: {
    koreanName: string;
    scientificName: string;
    category: "동양" | "카드" | "룬";
    meaning: string;
    keywords: string[];
    season: string;
  };
  /** 오늘의 꽃 모드인지 자유 뽑기 모드인지. */
  mode: "daily" | "free";
}): string {
  // 꽃점은 어떤 카테고리든 한자·전문술어 노출 X 일관 정책 — 항상 카드 톤으로
  // 한국어 비유만 받음. 점술사 voice 는 살아있되 어휘는 부드럽고 따뜻.
  const ctx = buildUserContext({
    profile: opts.profile,
    readingStyle: "카드",
  });
  const modeHint =
    opts.mode === "daily"
      ? "오늘 하루를 읽어주는 톤. '오늘 하루는…' 같은 구체적 안내."
      : "지금 이 순간 사용자가 알고 싶어 한 흐름을 읽어주는 톤.";

  return `[질문자 정보]
${ctx}

[오늘의 꽃]
- 이름: ${opts.flower.koreanName} (학명: ${opts.flower.scientificName})
- 전통 꽃말: ${opts.flower.meaning}
- 핵심 키워드: ${opts.flower.keywords.join(" · ")}
- 계절감: ${opts.flower.season}

[모드]
${modeHint}

[꽃점 풀이 원칙 — 반드시 지킬 것]
이 콘텐츠는 꽃점이야. 무게감이 아니라 위로·다정함이 우선이야.

1) 순한글 — 한자·한자어·전문술어 금지.
   금지: 乙木, 壬午, 일간, 오행, 천간, 지지, 식신, 정관, 운기, 발복, 만사형통 등.
   허용: '부드러운 결', '맑은 마음', '오늘의 흐름', '따뜻한 빛' 처럼 한국어 비유.
   학명(scientificName)도 본문에 굳이 쓰지 마. 꽃 이름은 한국어로만.

2) 따뜻한 톤 — 다정한 친구가 건네는 한마디처럼.
   금지: 단정·예언·운명론('당신은 ~한 사람입니다', '~할 것입니다').
   권장: '~한 결이에요', '~해도 좋아요', '~하면 마음이 한결 가벼울 거예요'.
   어미는 '~요' 체로 부드럽게.

3) 꽃말과 사용자의 결을 자연스럽게 엮어.
   꽃말 그대로 베끼지 말고, 사용자의 성향·기질 한 조각을 살짝 가져와
   "지금 너에게 이런 마음" 처럼 풀어줘.
   단, MBTI 유형명('INFP라서')이나 이름('영탁아')을 대놓고 부르지 마 — 작위적이다. 기질을 묘사로만 녹여라.

4) 짧고 단정하게.
   headline 한 줄 (40자 이내) + 본문 3-4문장 + 행동 권유 1줄.

5) 점술사 캐릭터 voice 는 너무 강하게 가져가지 마.
   캐릭터 어미는 살리되 거칠거나 무거운 단어는 빼고 부드럽게.

반드시 아래 JSON 형식만:
{
  "headline": "한 줄 핵심 (40자 이내, 따뜻한 톤)",
  "reading": "본문 3-4문장 (꽃말과 사용자의 결을 부드럽게)",
  "todayAction": "오늘 해볼 만한 작은 행동 한 줄"
}`;
}

/**
 * 이름 궁합 풀이 prompt — 알고리즘으로 계산된 점수 + 두 이름을 받아
 * 짧고 따뜻한 풀이를 만들어준다.
 *
 * 점술사 톤은 시스템 프롬프트에서 결정되므로 여기선 사실·해석만.
 */
export function buildNameCompatibilityPrompt(opts: {
  nameA: string;
  nameB: string;
  /** 0~99 점 */
  score: number;
  /** 등급 라벨 (예: "천생연분", "노력하면 통해") */
  gradeLabel: string;
  /** 등급 톤 — 풀이 분위기 결정 힌트 */
  tone: "best" | "good" | "ok" | "tough";
}): string {
  const toneHint =
    opts.tone === "best"
      ? "둘의 흐름이 매우 잘 맞는 시기야. 안심시키되 자만하지 않게."
      : opts.tone === "good"
        ? "둘의 결이 잘 맞는 편. 따뜻하게 격려."
        : opts.tone === "ok"
          ? "한쪽이 노력하면 결이 맞춰지는 사이. 어떤 노력인지 구체적으로."
          : "결이 다른 두 사람. 무리해서 맞추지 말고 다름을 인정하는 방향으로 안내.";

  return `[이름 궁합]
A: ${opts.nameA}
B: ${opts.nameB}
점수: ${opts.score}점
등급: ${opts.gradeLabel}

[톤 가이드]
${toneHint}

[지시]
두 사람의 이름만 가지고 풀이해. 사주는 없음 — 이름의 글자·소리·울림 자체에 집중.
한 줄 헤드라인 + 3-4문장 풀이 + 한 줄 조언. 너무 길게 늘이지 마.

해석 시 고려:
- 두 이름의 받침·소리 결이 어떻게 어울리는지 (예: 받침이 다 닫혀있다 / 열린 모음이 많다)
- 글자에서 떠오르는 인상 (단단함·부드러움·맑음 등)
- 점수가 의미하는 인연의 형태 (천생·노력형·다른 결 등)

금지:
- 일반적 운명론 (예: "당신들은 운명이에요") 만 나열하지 말 것
- 두 이름의 구체적 특징을 짚어줘

반드시 아래 JSON 형식만:
{
  "headline": "한 줄 핵심 (40자 이내, 점술사 톤)",
  "reading": "본문 3-4문장 (두 이름의 결을 짚어주는)",
  "advice": "권유 한 줄 (두 사람에게 어떤 마음가짐이 좋을지)"
}`;
}

/**
 * AI 점술사 채팅 첫 턴에 전달되는 풍부한 사용자 컨텍스트.
 * 알고 있는 모든 정보를 점술사에게 넘긴다.
 */
export function buildChatContext(
  profile: BuildContextOptions["profile"],
  enrichment: ChatEnrichment = {},
  /** 채팅 캐릭터 ID — 설정별 사주 인용 정책 분기. */
  characterId?: CharacterId,
): string {
  const lines: string[] = [];

  lines.push("[질문자 기본 정보]");
  // 채팅은 모든 캐릭터가 chatMode — 동양이어도 사주 한자·전문용어 비노출.
  lines.push(buildUserContext({ profile, readingStyle: readingStyleOf(characterId), chatMode: true }));

  // 사주 심층 분석 — 사주 용어(한자·음역)를 제거한 뒤 주입.
  // 채팅 캐릭터(특히 동양)가 enrichment 의 '을목·을사년' 을 복사해 쓰는 걸 차단.
  if (enrichment.sajuDeep) {
    const d = enrichment.sajuDeep;
    const f = stripSajuJargon;
    lines.push("\n[질문자 분석 — 이미 알고 있는 정보 / 사주 용어는 쓰지 말 것]");
    if (d.personality)  lines.push(`성격: ${f(d.personality)}`);
    if (d.strengths)    lines.push(`강점: ${f(d.strengths)}`);
    if (d.cautions)     lines.push(`주의: ${f(d.cautions)}`);
    if (d.loveStyle)    lines.push(`연애 스타일: ${f(d.loveStyle)}`);
    if (d.careerFit)    lines.push(`직업 적성: ${f(d.careerFit)}`);
    if (d.healthCare)   lines.push(`건강: ${f(d.healthCare)}`);
    if (d.lifeFlow)     lines.push(`인생 흐름: ${f(d.lifeFlow)}`);
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

  // 기록 메시지 (캐릭터에게만, 직접 드러내지 말 것)
  if (enrichment.observation) {
    lines.push(enrichment.observation);
  }

  lines.push("\n[지시]");
  lines.push(
    "위 정보를 바탕으로 대화해. 질문에 직접 답하되 보고서처럼 늘어놓지 마. " +
      "첫 문장은 사용자의 마지막 말에 대한 즉각적인 반응이어야 하고, " +
      "모든 맥락을 이미 알고 있는 사이처럼 살아있는 대사로 말해.",
  );

  return lines.join("\n");
}
