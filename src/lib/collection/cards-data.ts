/**
 * 카드 컬렉션 정적 메타데이터.
 *
 * 8개 카테고리 총 191장:
 * - 타로 78장
 * - MBTI 16장
 * - 별자리 12장
 * - 십이간지 12장
 * - 천간 10장
 * - 주술사 3장
 *
 * 발견 여부는 service.ts 가 기존 사용자 데이터(profiles, tarotReadings,
 * chatSessions)에서 계산한다. 이 파일은 카드의 표시 정보만을 담는다.
 */

import { TAROT_DECK, type TarotCard } from "@/lib/tarot/cards";
import { ZODIAC_LIST } from "@/lib/fortunes/zodiac";
import { CHINESE_ZODIAC_LIST } from "@/lib/fortunes/zodiac";
import { STEMS } from "@/lib/saju/meanings";
import { LENORMAND_DECK } from "@/lib/lenormand/cards";
import { RUNE_DECK } from "@/lib/runes/cards";

/** 카드 카테고리 식별자. */
export type CollectionCategory =
  | "tarot"
  | "mbti"
  | "zodiac"
  | "chineseZodiac"
  | "cheongan"
  | "characters"
  | "lenormand"
  | "runes";

/** 카드 희귀도 — UI 장식용. */
export type CollectionRarity = "common" | "rare" | "legendary";

/** 컬렉션 카드 메타데이터. */
export interface CollectionCardMeta {
  /** 카테고리 내부 고유 ID (발견 로직과 매칭되는 키). */
  id: string;
  /** 카드 카테고리 — 가챠 결과 표시·필터링 시 카테고리별 처리에 사용. */
  category: CollectionCategory;
  /** 한글 표시명. */
  nameKo: string;
  /** 영문명 (옵션). */
  nameEn?: string;
  /** public/ 기준 이미지 경로. */
  imageSrc: string;
  /** 2~3 문장 설명. */
  description: string;
  /** 희귀도. */
  rarity: CollectionRarity;
}

/** 별자리 → public/zodiac 의 실제 파일명 매핑. */
const ZODIAC_FILENAME: Record<string, string> = {
  aries: "01_양자리_ARIES.png",
  taurus: "02_황소자리_TAURUS.png",
  gemini: "03_쌍둥이자리_GEMINI.png",
  cancer: "04_게자리_CANCER.png",
  leo: "05_사자자리_LEO.png",
  virgo: "06_처녀자리_VIRGO.png",
  libra: "07_천칭자리_LIBRA.png",
  scorpio: "08_전갈자리_SCORPIO.png",
  sagittarius: "09_사수자리_SAGITTARIUS.png",
  capricorn: "10_염소자리_CAPRICORN.png",
  aquarius: "11_물병자리_AQUARIUS.png",
  pisces: "12_물고기자리_PISCES.png",
};

/** 별자리 한 줄 특징. */
const ZODIAC_TRAITS: Record<string, string> = {
  aries: "도전과 시작의 불꽃, 리더십이 빛나는 양자리.",
  taurus: "끈기와 안정의 대지, 풍요를 가꾸는 황소자리.",
  gemini: "재치와 호기심의 바람, 두 얼굴을 가진 쌍둥이자리.",
  cancer: "정과 보살핌의 달빛, 가족을 품는 게자리.",
  leo: "자존과 광채의 태양, 무대 위의 사자자리.",
  virgo: "분석과 정돈의 손길, 완벽을 다듬는 처녀자리.",
  libra: "균형과 조화의 미감, 우아한 천칭자리.",
  scorpio: "깊이와 집중의 어둠, 본질을 꿰뚫는 전갈자리.",
  sagittarius: "자유와 모험의 화살, 지혜를 좇는 사수자리.",
  capricorn: "책임과 성취의 봉우리, 묵묵한 염소자리.",
  aquarius: "혁신과 자유의 정신, 시대를 앞선 물병자리.",
  pisces: "공감과 환상의 물결, 감수성 깊은 물고기자리.",
};

/** 십이간지 한 줄 특징. */
const CHINESE_ZODIAC_TRAITS: Record<string, string> = {
  rat: "기민함과 풍요의 상징. 작지만 빠르게 기회를 잡는 영민함.",
  ox: "인내와 성실의 화신. 천천히 그러나 반드시 결실을 본다.",
  tiger: "용맹과 카리스마의 불꽃. 앞장서서 길을 여는 기운.",
  rabbit: "온화함과 직관의 달빛. 부드럽지만 흔들리지 않는 평정.",
  dragon: "비상하는 권위의 상징. 하늘로 솟구치는 큰 그릇.",
  snake: "지혜와 신비의 흐름. 조용히 본질을 꿰뚫어보는 통찰.",
  horse: "자유와 추진력의 갈기. 멈추지 않는 활력과 모험심.",
  goat: "예술과 평화의 결. 섬세한 감성으로 세상을 다듬는다.",
  monkey: "재치와 적응의 손재주. 어디서든 길을 만들어내는 영리함.",
  rooster: "정확함과 자긍심의 새벽. 일과를 빈틈없이 챙기는 단정함.",
  dog: "충직과 정의의 동반자. 사람을 지키는 따뜻한 의리.",
  pig: "관대함과 풍족의 마음. 베풀고 누리는 너그러운 기운.",
};

/** MBTI 한 줄 특징. */
const MBTI_TRAITS: Record<string, { nameKo: string; description: string }> = {
  INTJ: {
    nameKo: "전략가",
    description: "장기 비전과 체계로 미래를 설계하는 냉철한 사색가.",
  },
  INTP: {
    nameKo: "논리술사",
    description: "끝없는 호기심과 가설로 세상을 분해하는 사색가.",
  },
  ENTJ: {
    nameKo: "통솔자",
    description: "비전을 꿰뚫고 사람을 이끄는 결단력 있는 지휘관.",
  },
  ENTP: {
    nameKo: "변론가",
    description: "기발한 발상과 토론으로 가능성을 여는 모험가.",
  },
  INFJ: {
    nameKo: "옹호자",
    description: "조용한 신념과 깊은 통찰로 사람을 돌보는 이상주의자.",
  },
  INFP: {
    nameKo: "중재자",
    description: "꿈과 가치를 품고 마음 깊은 곳을 어루만지는 시인.",
  },
  ENFJ: {
    nameKo: "선도자",
    description: "사람의 잠재력을 끌어내 함께 빛나게 하는 따뜻한 리더.",
  },
  ENFP: {
    nameKo: "활동가",
    description: "열정과 영감의 바람, 모두를 들뜨게 하는 가능성의 아이.",
  },
  ISTJ: {
    nameKo: "현실주의자",
    description: "약속과 원칙을 지키는 묵직하고 신뢰할 수 있는 기둥.",
  },
  ISFJ: {
    nameKo: "수호자",
    description: "조용히 곁을 지키며 살뜰히 챙기는 따뜻한 보호자.",
  },
  ESTJ: {
    nameKo: "경영자",
    description: "질서와 효율로 조직을 움직이는 단호한 관리자.",
  },
  ESFJ: {
    nameKo: "집정관",
    description: "공동체의 화합을 챙기는 다정하고 책임감 강한 조력자.",
  },
  ISTP: {
    nameKo: "장인",
    description: "손끝의 감각과 즉흥적 기지로 문제를 해결하는 만능공.",
  },
  ISFP: {
    nameKo: "모험가",
    description: "감성과 자유를 품고 자기만의 미를 빚어내는 예술가.",
  },
  ESTP: {
    nameKo: "사업가",
    description: "현장의 본능과 추진력으로 판을 뒤집는 행동가.",
  },
  ESFP: {
    nameKo: "연예인",
    description: "지금 이 순간을 빛으로 채우는 흥과 열정의 무대.",
  },
};

const MBTI_ORDER = [
  "INTJ",
  "INTP",
  "ENTJ",
  "ENTP",
  "INFJ",
  "INFP",
  "ENFJ",
  "ENFP",
  "ISTJ",
  "ISFJ",
  "ESTJ",
  "ESFJ",
  "ISTP",
  "ISFP",
  "ESTP",
  "ESFP",
] as const;

/** 타로 메이저 아르카나 한 줄 설명. */
const TAROT_MAJOR_DESC: Record<string, string> = {
  the_fool: "백지에서 출발하는 순수한 시작과 무한한 가능성.",
  the_magician: "의지를 현실로 빚어내는 창조자의 손짓.",
  the_high_priestess: "고요한 직관과 감춰진 진실의 여사제.",
  the_empress: "풍요와 다정함으로 세상을 길러내는 어머니.",
  the_emperor: "원칙과 권위로 질서를 세우는 통치자.",
  the_hierophant: "전통과 가르침을 잇는 현명한 스승.",
  the_lovers: "마음과 마음이 맞닿는 선택의 순간.",
  the_chariot: "방향을 정한 의지가 폭발하는 추진력.",
  strength: "두려움을 어루만져 길들이는 부드러운 용기.",
  the_hermit: "내면의 등불을 들고 홀로 걷는 구도자.",
  wheel_of_fortune: "돌고 도는 운명의 수레바퀴, 흐름의 전환점.",
  justice: "원인과 결과가 정확히 맞물리는 균형의 저울.",
  the_hanged_man: "거꾸로 매달린 시야에서 발견하는 새 진리.",
  death: "낡은 것을 떠나보내는 위대한 변화의 문턱.",
  temperance: "두 흐름을 섞어 새로운 조화를 빚는 절제의 손길.",
  the_devil: "욕망과 집착의 사슬을 직시하는 어둠의 거울.",
  the_tower: "굳어버린 구조가 무너지는 깨어남의 번개.",
  the_star: "상처 위에 쏟아지는 위로와 희망의 별빛.",
  the_moon: "환상과 무의식이 일렁이는 달빛 아래의 길.",
  the_sun: "거리낌 없이 환히 빛나는 기쁨과 활력.",
  judgement: "지난 자신을 부르는 각성과 부활의 나팔.",
  the_world: "한 매듭을 완성한 충만의 원, 새 여정으로의 문.",
};

/** 슈트별 특징. */
const SUIT_DESC: Record<string, string> = {
  wands: "열정과 의지의 불, 행동과 모험의 기운",
  cups: "감정과 사랑의 물, 관계와 직관의 결",
  swords: "사고와 판단의 바람, 진실과 갈등의 칼",
  pentacles: "물질과 일의 흙, 일상과 풍요의 토대",
};

/** 숫자/궁정 카드의 일반적 의미. */
const NUMBER_DESC: Record<number, string> = {
  1: "새로운 씨앗이 트는 시작의 카드.",
  2: "두 힘이 마주 서 균형을 모색하는 카드.",
  3: "확장과 협동, 첫 결실이 맺히는 카드.",
  4: "토대를 다지는 안정과 멈춤의 카드.",
  5: "갈등과 시험을 통과하는 카드.",
  6: "주고받음의 화해와 회복의 카드.",
  7: "선택과 시야의 도전, 깊이를 묻는 카드.",
  8: "숙련과 성취, 흐름이 무르익는 카드.",
  9: "거의 다다른 풍요와 충만의 카드.",
  10: "한 사이클이 완성되는 카드.",
  11: "호기심을 가진 시종(Page)의 카드.",
  12: "행동에 나선 기사(Knight)의 카드.",
  13: "성숙한 여왕(Queen)의 카드.",
  14: "권위 있는 왕(King)의 카드.",
};

/**
 * 단일 타로 카드 → 컬렉션 메타데이터 변환.
 * Major 는 사전 설명을, Minor 는 슈트+숫자 조합 설명을 사용한다.
 */
function toTarotMeta(card: TarotCard): CollectionCardMeta {
  const isMajor = card.arcana === "major";
  const description = isMajor
    ? (TAROT_MAJOR_DESC[card.id] ?? "신비로운 메이저 아르카나의 카드.")
    : `${SUIT_DESC[card.suit ?? "wands"]}. ${
        NUMBER_DESC[card.number] ?? "숫자가 가진 흐름을 따라가는 카드."
      }`;

  const rarity: CollectionRarity = isMajor ? "legendary" : "common";

  return {
    id: card.id,
    category: "tarot",
    nameKo: card.nameKo,
    nameEn: card.nameEn,
    imageSrc: `/tarot/${card.id}.png`,
    description,
    rarity,
  };
}

/** 타로 카드 78장 메타데이터. */
export const TAROT_CARDS: CollectionCardMeta[] = TAROT_DECK.map(toTarotMeta);

/** MBTI 16장 메타데이터. */
export const MBTI_CARDS: CollectionCardMeta[] = MBTI_ORDER.map((type) => {
  const trait = MBTI_TRAITS[type];
  return {
    id: type,
    category: "mbti",
    nameKo: `${type} · ${trait.nameKo}`,
    nameEn: type,
    imageSrc: `/mbti/${type}.png`,
    description: trait.description,
    rarity: "rare",
  };
});

/** 별자리 12장 메타데이터. */
export const ZODIAC_CARDS: CollectionCardMeta[] = ZODIAC_LIST.map((z) => ({
  id: z.id,
  category: "zodiac",
  nameKo: z.ko,
  nameEn: z.en,
  imageSrc: `/zodiac/${ZODIAC_FILENAME[z.id]}`,
  description: `${z.dateRange} · ${ZODIAC_TRAITS[z.id]}`,
  rarity: "rare",
}));

/** 십이간지 12장 메타데이터. */
export const CHINESE_ZODIAC_CARDS: CollectionCardMeta[] = CHINESE_ZODIAC_LIST.map(
  (c) => ({
    id: c.id,
    category: "chineseZodiac",
    nameKo: c.ko,
    nameEn: c.id,
    imageSrc: `/chinese-zodiac/${c.id}.png`,
    description: CHINESE_ZODIAC_TRAITS[c.id] ?? `${c.animal}의 기운을 담은 띠.`,
    rarity: "rare",
  }),
);

/** 천간 10장 메타데이터. */
const CHEONGAN_ORDER: Array<{ char: string; id: string }> = [
  { char: "甲", id: "gap" },
  { char: "乙", id: "eul" },
  { char: "丙", id: "byung" },
  { char: "丁", id: "jeong" },
  { char: "戊", id: "mu" },
  { char: "己", id: "gi" },
  { char: "庚", id: "gyeong" },
  { char: "辛", id: "sin" },
  { char: "壬", id: "im" },
  { char: "癸", id: "gye" },
];

export const CHEONGAN_CARDS: CollectionCardMeta[] = CHEONGAN_ORDER.map(
  ({ char, id }) => {
    const meaning = STEMS[char];
    return {
      id,
      category: "cheongan",
      nameKo: meaning ? `${char} · ${meaning.ko}` : char,
      nameEn: id,
      imageSrc: `/cheongan/${id}.png`,
      description: meaning
        ? `${meaning.symbol}. ${meaning.description}`
        : "천간의 한 글자.",
      rarity: "rare",
    };
  },
);

/** 주술사 캐릭터 3장 메타데이터. */
export const CHARACTER_CARDS: CollectionCardMeta[] = [
  {
    id: "witch",
    category: "characters",
    nameKo: "루나",
    nameEn: "Luna",
    imageSrc: "/characters/witch_v2.png",
    description:
      "달빛 아래 수정구슬을 응시하며 운명을 읽는 달빛의 마녀. 어둠 속에서 가장 선명하게 진실을 본다.",
    rarity: "legendary",
  },
  {
    id: "child",
    category: "characters",
    nameKo: "카엘",
    nameEn: "Kael",
    imageSrc: "/characters/child_v2.png",
    description:
      "운명과의 계약서를 손에 쥔 악마 계약자. 냉정하고 정확하게 진실만을 말한다.",
    rarity: "legendary",
  },
  {
    id: "sage",
    category: "characters",
    nameKo: "라엘",
    nameEn: "Rael",
    imageSrc: "/characters/sage_v2.png",
    description:
      "하늘의 뜻을 전하는 천상의 대리인. 빛과 희망의 언어로 당신의 길을 밝혀준다.",
    rarity: "legendary",
  },
];

/** 르노르망 36장 메타데이터 (ID 충돌 방지를 위해 len_ 접두어 사용). */
export const LENORMAND_COLLECTION_CARDS: CollectionCardMeta[] =
  LENORMAND_DECK.map((card) => ({
    id: `len_${card.nameEn.toLowerCase().replace(/\s+/g, "_")}`,
    category: "lenormand" as CollectionCategory,
    nameKo: card.nameKo,
    nameEn: card.nameEn,
    imageSrc: card.imageSrc,
    description: card.meaning,
    rarity: "common" as CollectionRarity,
  }));

/** 엘더 푸타르크 룬 24장 메타데이터 (ID 충돌 방지를 위해 rune_ 접두어 사용). */
export const RUNE_COLLECTION_CARDS: CollectionCardMeta[] = RUNE_DECK.map(
  (rune) => ({
    id: `rune_${rune.name.toLowerCase()}`,
    category: "runes" as CollectionCategory,
    nameKo: `${rune.symbol} ${rune.nameKo}`,
    nameEn: rune.name,
    imageSrc: rune.imageSrc,
    description: rune.meaningUpright,
    rarity: "common" as CollectionRarity,
  }),
);

/** 카테고리별 메타데이터 묶음. */
export const COLLECTION_BY_CATEGORY: Record<
  CollectionCategory,
  CollectionCardMeta[]
> = {
  tarot: TAROT_CARDS,
  mbti: MBTI_CARDS,
  zodiac: ZODIAC_CARDS,
  chineseZodiac: CHINESE_ZODIAC_CARDS,
  cheongan: CHEONGAN_CARDS,
  characters: CHARACTER_CARDS,
  lenormand: LENORMAND_COLLECTION_CARDS,
  runes: RUNE_COLLECTION_CARDS,
};

/** 카테고리 표시 정보. */
export const CATEGORY_META: Record<
  CollectionCategory,
  { label: string; emoji: string; cardBackSrc: string }
> = {
  tarot:         { label: "타로",    emoji: "", cardBackSrc: "/collection/card_back_tarot.png" },
  mbti:          { label: "MBTI",   emoji: "", cardBackSrc: "/collection/card_back_mbti.png" },
  zodiac:        { label: "별자리",  emoji: "", cardBackSrc: "/collection/card_back_zodiac.png" },
  chineseZodiac: { label: "십이간지",emoji: "", cardBackSrc: "/collection/card_back_chinese_zodiac.png" },
  cheongan:      { label: "천간",    emoji: "", cardBackSrc: "/collection/card_back_cheongan.png" },
  characters:    { label: "주술사",  emoji: "", cardBackSrc: "/collection/card_back_characters.png" },
  lenormand:     { label: "르노르망",emoji: "", cardBackSrc: "/collection/card_back_lenormand.png" },
  runes:         { label: "룬",      emoji: "", cardBackSrc: "/collection/card_back_runes.png" },
};

/** 전체 카드 수 (191장 보장 — 르노르망 36 + 룬 24 포함). */
export const TOTAL_CARDS =
  TAROT_CARDS.length +
  MBTI_CARDS.length +
  ZODIAC_CARDS.length +
  CHINESE_ZODIAC_CARDS.length +
  CHEONGAN_CARDS.length +
  CHARACTER_CARDS.length +
  LENORMAND_COLLECTION_CARDS.length +
  RUNE_COLLECTION_CARDS.length;

if (TOTAL_CARDS !== 191) {
  throw new Error(
    `컬렉션 카드 수 오류: 기대 191, 실제 ${TOTAL_CARDS}`,
  );
}
