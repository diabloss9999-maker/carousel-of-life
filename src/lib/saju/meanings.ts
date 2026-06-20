/**
 * 천간(天干)·지지(地支) 한자 의미 사전.
 *
 * 사주팔자 8글자에 대해 사용자가 각 글자가 무엇을 뜻하는지
 * 한 눈에 알 수 있도록 한글 음, 음양, 오행, 동물(지지), 시간대(지지),
 * 한 줄 설명을 제공한다.
 */

export type ElementKey = "wood" | "fire" | "earth" | "metal" | "water";
export type Polarity = "yang" | "yin";

export interface StemMeaning {
  /** 한자 1글자. */
  char: string;
  /** 한글 음 (예: 甲 → "갑"). */
  ko: string;
  polarity: Polarity;
  element: ElementKey;
  /** 자연물·이미지 (예: "큰 나무"). */
  symbol: string;
  /** 한 줄 설명. */
  description: string;
}

export interface BranchMeaning {
  char: string;
  ko: string;
  polarity: Polarity;
  element: ElementKey;
  /** 12지 동물. */
  animal: string;
  /** 시간대 (예: "23:00–01:00"). */
  timeRange: string;
  description: string;
}

/** 천간 — 10개. */
export const STEMS: Record<string, StemMeaning> = {
  甲: {
    char: "甲",
    ko: "갑",
    polarity: "yang",
    element: "wood",
    symbol: "큰 나무·기둥",
    description: "솟구치는 시작의 기운, 곧고 강직한 리더형.",
  },
  乙: {
    char: "乙",
    ko: "을",
    polarity: "yin",
    element: "wood",
    symbol: "풀·꽃·새순",
    description: "부드럽지만 끈질긴 생명력, 유연한 적응력.",
  },
  丙: {
    char: "丙",
    ko: "병",
    polarity: "yang",
    element: "fire",
    symbol: "태양",
    description: "밝고 활달한 양기, 사람을 끌어모으는 빛.",
  },
  丁: {
    char: "丁",
    ko: "정",
    polarity: "yin",
    element: "fire",
    symbol: "등불·촛불",
    description: "은은하고 따뜻한 불꽃, 섬세한 정성.",
  },
  戊: {
    char: "戊",
    ko: "무",
    polarity: "yang",
    element: "earth",
    symbol: "큰 산·대지",
    description: "묵직하고 듬직한 토대, 흔들림 없는 중심.",
  },
  己: {
    char: "己",
    ko: "기",
    polarity: "yin",
    element: "earth",
    symbol: "밭·정원의 흙",
    description: "부드럽게 길러주는 토양, 포용과 양육.",
  },
  庚: {
    char: "庚",
    ko: "경",
    polarity: "yang",
    element: "metal",
    symbol: "큰 쇠·도끼",
    description: "단단하고 결단력 있는 의지, 강한 추진력.",
  },
  辛: {
    char: "辛",
    ko: "신",
    polarity: "yin",
    element: "metal",
    symbol: "보석·바늘",
    description: "정교하고 예리한 감각, 다듬어진 아름다움.",
  },
  壬: {
    char: "壬",
    ko: "임",
    polarity: "yang",
    element: "water",
    symbol: "큰 바다·강",
    description: "깊고 넓은 기운, 포용력 있는 지혜.",
  },
  癸: {
    char: "癸",
    ko: "계",
    polarity: "yin",
    element: "water",
    symbol: "비·이슬",
    description: "촉촉하고 섬세한 물기, 조용한 감수성.",
  },
};

/** 지지 — 12개. */
export const BRANCHES: Record<string, BranchMeaning> = {
  子: {
    char: "子",
    ko: "자",
    polarity: "yang",
    element: "water",
    animal: "쥐",
    timeRange: "23:00–01:00",
    description: "한밤의 정적, 영민함과 번식의 기운.",
  },
  丑: {
    char: "丑",
    ko: "축",
    polarity: "yin",
    element: "earth",
    animal: "소",
    timeRange: "01:00–03:00",
    description: "새벽 어둠, 묵묵한 인내와 축적.",
  },
  寅: {
    char: "寅",
    ko: "인",
    polarity: "yang",
    element: "wood",
    animal: "호랑이",
    timeRange: "03:00–05:00",
    description: "동트는 시각, 용기와 새 출발.",
  },
  卯: {
    char: "卯",
    ko: "묘",
    polarity: "yin",
    element: "wood",
    animal: "토끼",
    timeRange: "05:00–07:00",
    description: "이른 아침, 부드러운 성장과 평온.",
  },
  辰: {
    char: "辰",
    ko: "진",
    polarity: "yang",
    element: "earth",
    animal: "용",
    timeRange: "07:00–09:00",
    description: "비상하는 시간, 변화와 웅대한 꿈.",
  },
  巳: {
    char: "巳",
    ko: "사",
    polarity: "yin",
    element: "fire",
    animal: "뱀",
    timeRange: "09:00–11:00",
    description: "달궈지는 빛, 지혜로운 집중력.",
  },
  午: {
    char: "午",
    ko: "오",
    polarity: "yang",
    element: "fire",
    animal: "말",
    timeRange: "11:00–13:00",
    description: "정오의 절정, 활력과 자유로운 질주.",
  },
  未: {
    char: "未",
    ko: "미",
    polarity: "yin",
    element: "earth",
    animal: "양",
    timeRange: "13:00–15:00",
    description: "오후 햇살, 온화함과 보호의 마음.",
  },
  申: {
    char: "申",
    ko: "신",
    polarity: "yang",
    element: "metal",
    animal: "원숭이",
    timeRange: "15:00–17:00",
    description: "영리한 시간, 빠른 판단과 손재주.",
  },
  酉: {
    char: "酉",
    ko: "유",
    polarity: "yin",
    element: "metal",
    animal: "닭",
    timeRange: "17:00–19:00",
    description: "해질녘, 정밀함과 완성의 기운.",
  },
  戌: {
    char: "戌",
    ko: "술",
    polarity: "yang",
    element: "earth",
    animal: "개",
    timeRange: "19:00–21:00",
    description: "밤의 문턱, 충직함과 수호의 의리.",
  },
  亥: {
    char: "亥",
    ko: "해",
    polarity: "yin",
    element: "water",
    animal: "돼지",
    timeRange: "21:00–23:00",
    description: "고요한 밤, 풍요와 깊은 안식.",
  },
};

/** 오행 한글 라벨. */
export const ELEMENT_LABEL: Record<ElementKey, string> = {
  wood: "목(木)",
  fire: "화(火)",
  earth: "토(土)",
  metal: "금(金)",
  water: "수(水)",
};

/** 음양 한글 라벨. */
export const POLARITY_LABEL: Record<Polarity, string> = {
  yang: "양(陽)",
  yin: "음(陰)",
};

/** 글자가 천간/지지 중 어느 쪽인지 판별. */
export function lookupChar(
  char: string,
): { kind: "stem"; meaning: StemMeaning } | { kind: "branch"; meaning: BranchMeaning } | null {
  if (STEMS[char]) return { kind: "stem", meaning: STEMS[char] };
  if (BRANCHES[char]) return { kind: "branch", meaning: BRANCHES[char] };
  return null;
}
