/**
 * 엘더 푸타르크(Elder Futhark) 룬 24개 데이터.
 *
 * 세 개의 에트(Aett)로 그룹화:
 * - Freyr  (풍요): 1~8
 * - Heimdall (시련): 9~16
 * - Tyr    (영웅): 17~24
 *
 * 9개의 불변룬(머크스타브 없음)은 `isInvertible: false`:
 * Gebo, Hagalaz, Nauthiz, Isa, Jera, Eihwaz, Sowilo, Ingwaz, Dagaz.
 */

export interface RuneCard {
  /** 룬 번호 (1~24). */
  id: number;
  /** 영문 이름. */
  name: string;
  /** 한국어 음차 이름. */
  nameKo: string;
  /** 유니코드 룬 심볼. */
  symbol: string;
  /** 소속 에트. */
  aett: "Freyr" | "Heimdall" | "Tyr";
  /** 역방향(머크스타브) 사용 가능 여부. false 면 불변룬. */
  isInvertible: boolean;
  /** 정방향 의미 1~2문장. */
  meaningUpright: string;
  /** 역방향 의미 1~2문장. 불변룬이면 null. */
  meaningReversed: string | null;
  /** 정방향 키워드 3~5개. */
  keywordsUpright: string[];
  /** 역방향 키워드 (불변룬이면 빈 배열). */
  keywordsReversed: string[];
  /** 룬 이미지 경로 (public/ 기준). */
  imageSrc: string;
}

export const RUNE_DECK: RuneCard[] = [
  // Freyr의 에트 (1~8)
  {
    id: 1,
    name: "Fehu",
    nameKo: "페후",
    symbol: "ᚠ",
    aett: "Freyr",
    isInvertible: true,
    meaningUpright:
      "물질적 풍요와 재물의 흐름. 노력으로 얻은 성과와 번영의 시작.",
    meaningReversed:
      "재물의 손실이나 에너지 낭비. 탐욕이 화를 부를 수 있는 시기.",
    keywordsUpright: ["풍요", "재물", "번영", "에너지", "성취"],
    keywordsReversed: ["손실", "탐욕", "낭비", "욕망"],
    imageSrc: "/runes/01_Fehu.webp",
  },
  {
    id: 2,
    name: "Uruz",
    nameKo: "우루즈",
    symbol: "ᚢ",
    aett: "Freyr",
    isInvertible: true,
    meaningUpright:
      "원초적 힘과 건강. 변화를 이끄는 야성적 에너지와 강인한 의지.",
    meaningReversed:
      "힘의 오용이나 저하. 고집스러움이 장애를 만드는 상황.",
    keywordsUpright: ["힘", "건강", "야성", "의지", "변화"],
    keywordsReversed: ["약함", "고집", "오용", "저항"],
    imageSrc: "/runes/02_Uruz.webp",
  },
  {
    id: 3,
    name: "Thurisaz",
    nameKo: "투리사즈",
    symbol: "ᚦ",
    aett: "Freyr",
    isInvertible: true,
    meaningUpright:
      "보호하는 가시. 적을 막는 힘과 때로는 예상치 못한 충격적 변화.",
    meaningReversed:
      "자기 파괴적 충동. 위험에 무방비로 노출되거나 충동적 행동.",
    keywordsUpright: ["보호", "방어", "충격", "변화", "힘"],
    keywordsReversed: ["위험", "충동", "파괴", "무방비"],
    imageSrc: "/runes/03_Thurisaz.webp",
  },
  {
    id: 4,
    name: "Ansuz",
    nameKo: "안수즈",
    symbol: "ᚨ",
    aett: "Freyr",
    isInvertible: true,
    meaningUpright:
      "오딘의 메시지. 지혜·영감·소통과 신성한 안내의 신호.",
    meaningReversed:
      "소통의 단절이나 거짓 메시지. 기만이나 혼란의 정보.",
    keywordsUpright: ["지혜", "영감", "소통", "신성", "메시지"],
    keywordsReversed: ["기만", "단절", "혼란", "거짓"],
    imageSrc: "/runes/04_Ansuz.webp",
  },
  {
    id: 5,
    name: "Raidho",
    nameKo: "라이도",
    symbol: "ᚱ",
    aett: "Freyr",
    isInvertible: true,
    meaningUpright:
      "여정과 리듬. 옳은 방향으로의 이동과 삶의 자연스러운 흐름.",
    meaningReversed:
      "여정의 지연이나 방향 상실. 잘못된 결정이나 통제 불능의 상황.",
    keywordsUpright: ["여정", "리듬", "방향", "이동", "흐름"],
    keywordsReversed: ["지연", "방향상실", "혼돈", "통제불능"],
    imageSrc: "/runes/05_Raidho.webp",
  },
  {
    id: 6,
    name: "Kenaz",
    nameKo: "케나즈",
    symbol: "ᚲ",
    aett: "Freyr",
    isInvertible: true,
    meaningUpright:
      "창조의 불꽃. 지식과 기술, 밝히는 통찰과 열정적 창조력.",
    meaningReversed:
      "창의력의 소멸. 지식의 오용이나 관계·프로젝트의 종료.",
    keywordsUpright: ["창조", "지식", "기술", "통찰", "열정"],
    keywordsReversed: ["소멸", "무지", "종료", "오용"],
    imageSrc: "/runes/06_Kenaz.webp",
  },
  {
    id: 7,
    name: "Gebo",
    nameKo: "게보",
    symbol: "ᚷ",
    aett: "Freyr",
    isInvertible: false,
    meaningUpright:
      "선물과 교환. 관계의 균형과 상호적 나눔, 신성한 선물.",
    meaningReversed: null,
    keywordsUpright: ["선물", "교환", "균형", "관계", "나눔"],
    keywordsReversed: [],
    imageSrc: "/runes/07_Gebo.webp",
  },
  {
    id: 8,
    name: "Wunjo",
    nameKo: "운조",
    symbol: "ᚹ",
    aett: "Freyr",
    isInvertible: true,
    meaningUpright:
      "기쁨과 조화. 소속감과 성취에서 오는 행복과 번영.",
    meaningReversed:
      "기쁨의 방해. 조화의 깨짐이나 실망, 미뤄지는 성공.",
    keywordsUpright: ["기쁨", "조화", "행복", "번영", "성취"],
    keywordsReversed: ["불화", "실망", "지연", "슬픔"],
    imageSrc: "/runes/08_Wunjo.webp",
  },

  // Heimdall의 에트 (9~16)
  {
    id: 9,
    name: "Hagalaz",
    nameKo: "하갈라즈",
    symbol: "ᚺ",
    aett: "Heimdall",
    isInvertible: false,
    meaningUpright:
      "우박 같은 파괴와 시련. 외부 충격이 가져오는 변화와 정화의 씨앗.",
    meaningReversed: null,
    keywordsUpright: ["시련", "파괴", "변화", "정화", "충격"],
    keywordsReversed: [],
    imageSrc: "/runes/09_Hagalaz.webp",
  },
  {
    id: 10,
    name: "Nauthiz",
    nameKo: "나우티즈",
    symbol: "ᚾ",
    aett: "Heimdall",
    isInvertible: false,
    meaningUpright:
      "필요와 저항. 제약 속에서 인내하며 의지를 단련하는 과정.",
    meaningReversed: null,
    keywordsUpright: ["필요", "저항", "인내", "제약", "단련"],
    keywordsReversed: [],
    imageSrc: "/runes/10_Nauthiz.webp",
  },
  {
    id: 11,
    name: "Isa",
    nameKo: "이사",
    symbol: "ᛁ",
    aett: "Heimdall",
    isInvertible: false,
    meaningUpright:
      "얼음과 정지. 상황의 동결과 내면 성찰의 필요. 기다림의 시간.",
    meaningReversed: null,
    keywordsUpright: ["정지", "얼음", "성찰", "기다림", "동결"],
    keywordsReversed: [],
    imageSrc: "/runes/11_Isa.webp",
  },
  {
    id: 12,
    name: "Jera",
    nameKo: "예라",
    symbol: "ᛃ",
    aett: "Heimdall",
    isInvertible: false,
    meaningUpright:
      "수확과 순환. 노력의 결실과 자연스러운 시간의 흐름.",
    meaningReversed: null,
    keywordsUpright: ["수확", "순환", "결실", "시간", "인과"],
    keywordsReversed: [],
    imageSrc: "/runes/12_Jera.webp",
  },
  {
    id: 13,
    name: "Eihwaz",
    nameKo: "에이와즈",
    symbol: "ᛇ",
    aett: "Heimdall",
    isInvertible: false,
    meaningUpright:
      "주목나무와 세계수. 삶과 죽음 사이의 지속성과 강인한 생명력.",
    meaningReversed: null,
    keywordsUpright: ["지속성", "생명력", "연결", "강인함", "변환"],
    keywordsReversed: [],
    imageSrc: "/runes/13_Eihwaz.webp",
  },
  {
    id: 14,
    name: "Perthro",
    nameKo: "페르스로",
    symbol: "ᛈ",
    aett: "Heimdall",
    isInvertible: true,
    meaningUpright:
      "운명의 컵. 숨겨진 비밀이나 기회, 운의 게임과 신비.",
    meaningReversed:
      "숨겨진 위험이나 불운. 비밀이 드러나는 충격적 상황.",
    keywordsUpright: ["비밀", "운명", "기회", "신비", "우연"],
    keywordsReversed: ["불운", "폭로", "위험", "혼돈"],
    imageSrc: "/runes/14_Perthro.webp",
  },
  {
    id: 15,
    name: "Algiz",
    nameKo: "알기즈",
    symbol: "ᛉ",
    aett: "Heimdall",
    isInvertible: true,
    meaningUpright:
      "보호와 방어. 신성한 가호 아래 안전과 직관의 경고.",
    meaningReversed:
      "보호의 약화. 위험에 노출되거나 본능적 직관을 무시하는 상황.",
    keywordsUpright: ["보호", "방어", "안전", "직관", "신성"],
    keywordsReversed: ["취약", "위험", "무방비", "무시"],
    imageSrc: "/runes/15_Algiz.webp",
  },
  {
    id: 16,
    name: "Sowilo",
    nameKo: "소윌로",
    symbol: "ᛋ",
    aett: "Heimdall",
    isInvertible: false,
    meaningUpright:
      "태양의 승리. 밝은 에너지와 성공, 어둠을 몰아내는 빛.",
    meaningReversed: null,
    keywordsUpright: ["승리", "태양", "성공", "빛", "에너지"],
    keywordsReversed: [],
    imageSrc: "/runes/16_Sowilo.webp",
  },

  // Tyr의 에트 (17~24)
  {
    id: 17,
    name: "Tiwaz",
    nameKo: "티와즈",
    symbol: "ᛏ",
    aett: "Tyr",
    isInvertible: true,
    meaningUpright:
      "정의와 희생. 올바른 일을 위한 용기와 전사의 정신.",
    meaningReversed:
      "불의나 패배. 희생의 오용이나 명예의 손상.",
    keywordsUpright: ["정의", "희생", "용기", "전사", "명예"],
    keywordsReversed: ["불의", "패배", "비겁", "손상"],
    imageSrc: "/runes/17_Tiwaz.webp",
  },
  {
    id: 18,
    name: "Berkano",
    nameKo: "베르카노",
    symbol: "ᛒ",
    aett: "Tyr",
    isInvertible: true,
    meaningUpright:
      "자작나무와 양육. 새로운 시작과 성장, 보살핌과 재생.",
    meaningReversed:
      "성장의 방해. 불안정하거나 돌봄이 부족한 환경.",
    keywordsUpright: ["양육", "성장", "재생", "시작", "보살핌"],
    keywordsReversed: ["방해", "불안정", "부족", "정체"],
    imageSrc: "/runes/18_Berkano.webp",
  },
  {
    id: 19,
    name: "Ehwaz",
    nameKo: "에화즈",
    symbol: "ᛖ",
    aett: "Tyr",
    isInvertible: true,
    meaningUpright:
      "말과 파트너십. 신뢰와 협력, 함께하는 여정의 조화.",
    meaningReversed:
      "신뢰의 깨짐. 파트너십의 불화나 방향의 불일치.",
    keywordsUpright: ["파트너십", "신뢰", "협력", "여정", "조화"],
    keywordsReversed: ["불화", "배신", "불일치", "단절"],
    imageSrc: "/runes/19_Ehwaz.webp",
  },
  {
    id: 20,
    name: "Mannaz",
    nameKo: "만나즈",
    symbol: "ᛗ",
    aett: "Tyr",
    isInvertible: true,
    meaningUpright:
      "인간성과 자아. 개인과 공동체, 잠재력의 실현.",
    meaningReversed:
      "자기중심성이나 고립. 사회적 단절이나 자아의 왜곡.",
    keywordsUpright: ["인간성", "자아", "공동체", "잠재력", "실현"],
    keywordsReversed: ["고립", "왜곡", "자만", "단절"],
    imageSrc: "/runes/20_Mannaz.webp",
  },
  {
    id: 21,
    name: "Laguz",
    nameKo: "라구즈",
    symbol: "ᛚ",
    aett: "Tyr",
    isInvertible: true,
    meaningUpright:
      "물의 흐름. 직관과 감정, 무의식의 세계와 치유.",
    meaningReversed:
      "감정의 범람이나 혼란. 직관이 흐려지거나 두려움에 압도되는 상황.",
    keywordsUpright: ["흐름", "직관", "감정", "치유", "무의식"],
    keywordsReversed: ["범람", "혼란", "두려움", "압도"],
    imageSrc: "/runes/21_Laguz.webp",
  },
  {
    id: 22,
    name: "Ingwaz",
    nameKo: "잉와즈",
    symbol: "ᛜ",
    aett: "Tyr",
    isInvertible: false,
    meaningUpright:
      "내면의 씨앗. 잠재력의 완성과 새로운 시작을 위한 에너지 축적.",
    meaningReversed: null,
    keywordsUpright: ["잠재력", "씨앗", "완성", "축적", "준비"],
    keywordsReversed: [],
    imageSrc: "/runes/22_Ingwaz.webp",
  },
  {
    id: 23,
    name: "Dagaz",
    nameKo: "다가즈",
    symbol: "ᛞ",
    aett: "Tyr",
    isInvertible: false,
    meaningUpright:
      "새벽의 돌파구. 극적인 전환과 각성, 이분법을 초월한 전체성.",
    meaningReversed: null,
    keywordsUpright: ["돌파", "전환", "각성", "새벽", "전체성"],
    keywordsReversed: [],
    imageSrc: "/runes/23_Dagaz.webp",
  },
  {
    id: 24,
    name: "Othala",
    nameKo: "오탈라",
    symbol: "ᛟ",
    aett: "Tyr",
    isInvertible: true,
    meaningUpright:
      "조상의 유산과 고향. 물려받은 것의 가치와 뿌리에서 오는 힘.",
    meaningReversed:
      "유산의 갈등이나 단절. 과거에 집착하거나 뿌리로부터 소외된 상황.",
    keywordsUpright: ["유산", "고향", "뿌리", "조상", "소속"],
    keywordsReversed: ["집착", "단절", "소외", "갈등"],
    imageSrc: "/runes/24_Othala.webp",
  },
];

/** id → RuneCard 매핑. */
export const RUNE_BY_ID: Record<number, RuneCard> = Object.fromEntries(
  RUNE_DECK.map((r) => [r.id, r]),
);

if (RUNE_DECK.length !== 24) {
  throw new Error(`룬 덱 카드 수 오류: 기대 24, 실제 ${RUNE_DECK.length}`);
}
