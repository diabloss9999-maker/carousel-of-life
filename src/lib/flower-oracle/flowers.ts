/**
 * 플로로랜시 — 30종 플라워 오라클 데이터셋.
 *
 * 각 카드:
 *   · id (zero-padded 2-digit)
 *   · category — 동양·이세계·북유럽 (점술사 voice 매핑)
 *   · meaning  — 1줄 꽃말 (전통 의미)
 *   · keywords — 풀이용 키워드 3개
 *   · season   — 보통 피는 계절
 *
 * 카테고리는 우리 점술사 세계관과 매칭:
 *   동양   → 소율(접신의 무녀)
 *   이세계 → 루나(달의 마녀)
 *   북유럽 → 신(북유럽 신)
 */

export type FlowerCategory = "동양" | "이세계" | "북유럽";

export interface FlowerCard {
  id: string;
  koreanName: string;
  scientificName: string;
  category: FlowerCategory;
  /** 1줄 꽃말 — 전통적 의미. */
  meaning: string;
  /** 풀이용 키워드 3-4개 (AI 가 풀이에 녹임). */
  keywords: string[];
  /** 주로 피는 계절. */
  season: "봄" | "여름" | "가을" | "겨울" | "사계";
  /** 카드 액센트 색 (Tailwind 클래스). */
  accent: string;
  /** 이미지 경로 (public 기준). */
  image: string;
}

export const FLOWERS: FlowerCard[] = [
  {
    id: "01",
    koreanName: "동백꽃",
    scientificName: "Camellia japonica",
    category: "동양",
    meaning: "그대를 누구보다 사랑합니다",
    keywords: ["진심", "단정한 마음", "겨울을 견디는 사랑"],
    season: "겨울",
    accent: "ring-red-600/40",
    image: "/flowers/01.png",
  },
  {
    id: "02",
    koreanName: "진달래",
    scientificName: "Rhododendron mucronulatum",
    category: "동양",
    meaning: "사랑의 기쁨, 첫사랑",
    keywords: ["설렘", "그리움", "봄의 시작"],
    season: "봄",
    accent: "ring-pink-500/40",
    image: "/flowers/02.png",
  },
  {
    id: "03",
    koreanName: "매화",
    scientificName: "Prunus mume",
    category: "동양",
    meaning: "고결한 마음, 인내",
    keywords: ["기다림", "고요한 의지", "추위 뒤의 향기"],
    season: "겨울",
    accent: "ring-rose-300/40",
    image: "/flowers/03.png",
  },
  {
    id: "04",
    koreanName: "무궁화",
    scientificName: "Hibiscus syriacus",
    category: "동양",
    meaning: "끈기, 일편단심",
    keywords: ["꾸준함", "다시 피어남", "버티는 아름다움"],
    season: "여름",
    accent: "ring-fuchsia-400/40",
    image: "/flowers/04.png",
  },
  {
    id: "05",
    koreanName: "연꽃",
    scientificName: "Nelumbo nucifera",
    category: "동양",
    meaning: "청정, 순수한 마음",
    keywords: ["흙탕 속에서 피어남", "맑음", "내면의 평화"],
    season: "여름",
    accent: "ring-rose-300/40",
    image: "/flowers/05.png",
  },
  {
    id: "06",
    koreanName: "국화",
    scientificName: "Chrysanthemum morifolium",
    category: "동양",
    meaning: "고결함, 청결",
    keywords: ["가을의 결실", "단정함", "오래 가는 향기"],
    season: "가을",
    accent: "ring-amber-400/40",
    image: "/flowers/06.png",
  },
  {
    id: "07",
    koreanName: "도라지꽃",
    scientificName: "Platycodon grandiflorus",
    category: "동양",
    meaning: "영원한 사랑, 다정함",
    keywords: ["변하지 않는 마음", "조용한 다정", "푸른 결"],
    season: "여름",
    accent: "ring-violet-400/40",
    image: "/flowers/07.png",
  },
  {
    id: "08",
    koreanName: "코스모스",
    scientificName: "Cosmos bipinnatus",
    category: "동양",
    meaning: "소녀의 순정",
    keywords: ["순수한 마음", "가을 바람", "흔들리지만 무너지지 않음"],
    season: "가을",
    accent: "ring-pink-400/40",
    image: "/flowers/08.png",
  },
  {
    id: "09",
    koreanName: "봉선화",
    scientificName: "Impatiens balsamina",
    category: "동양",
    meaning: "건드리지 마세요, 나를 잊지 마세요",
    keywords: ["여린 경계", "정성 어린 추억", "여름 손톱의 색"],
    season: "여름",
    accent: "ring-rose-500/40",
    image: "/flowers/09.png",
  },
  {
    id: "10",
    koreanName: "철쭉",
    scientificName: "Rhododendron schlippenbachii",
    category: "동양",
    meaning: "사랑의 즐거움",
    keywords: ["봄 산", "환한 인연", "함께 있는 시간"],
    season: "봄",
    accent: "ring-pink-300/40",
    image: "/flowers/10.png",
  },
  {
    id: "11",
    koreanName: "붉은장미",
    scientificName: "Rosa",
    category: "동양",
    meaning: "열정, 정열적인 사랑",
    keywords: ["불타는 마음", "고백", "강렬한 끌림"],
    season: "여름",
    accent: "ring-red-500/50",
    image: "/flowers/11.png",
  },
  {
    id: "12",
    koreanName: "튤립",
    scientificName: "Tulipa",
    category: "동양",
    meaning: "사랑의 고백",
    keywords: ["새로운 시작", "단정한 설렘", "봄볕"],
    season: "봄",
    accent: "ring-orange-400/40",
    image: "/flowers/12.png",
  },
  {
    id: "13",
    koreanName: "해바라기",
    scientificName: "Helianthus annuus",
    category: "동양",
    meaning: "당신만을 바라봅니다",
    keywords: ["변치 않는 마음", "낙관", "빛을 향한 의지"],
    season: "여름",
    accent: "ring-yellow-400/50",
    image: "/flowers/13.png",
  },
  {
    id: "14",
    koreanName: "제비꽃",
    scientificName: "Viola",
    category: "이세계",
    meaning: "겸손, 작은 행복",
    keywords: ["조용한 자기 자리", "낮은 시선", "작지만 또렷한 색"],
    season: "봄",
    accent: "ring-violet-500/40",
    image: "/flowers/14.png",
  },
  {
    id: "15",
    koreanName: "라벤더",
    scientificName: "Lavandula",
    category: "이세계",
    meaning: "침묵, 기대",
    keywords: ["거리감 있는 사랑", "치유의 향", "여름 들판"],
    season: "여름",
    accent: "ring-purple-400/40",
    image: "/flowers/15.png",
  },
  {
    id: "16",
    koreanName: "분홍카네이션",
    scientificName: "Dianthus caryophyllus",
    category: "이세계",
    meaning: "당신을 열렬히 사랑합니다",
    keywords: ["감사", "어머니의 마음", "다정한 보살핌"],
    season: "봄",
    accent: "ring-pink-400/40",
    image: "/flowers/16.png",
  },
  {
    id: "17",
    koreanName: "물망초",
    scientificName: "Myosotis",
    category: "이세계",
    meaning: "나를 잊지 마세요",
    keywords: ["기억", "오래된 약속", "푸른 진심"],
    season: "봄",
    accent: "ring-sky-400/40",
    image: "/flowers/17.png",
  },
  {
    id: "18",
    koreanName: "아이리스",
    scientificName: "Iris",
    category: "이세계",
    meaning: "좋은 소식, 메시지",
    keywords: ["전령의 꽃", "기다리던 답", "보랏빛 신호"],
    season: "봄",
    accent: "ring-indigo-400/40",
    image: "/flowers/18.png",
  },
  {
    id: "19",
    koreanName: "클레마티스",
    scientificName: "Clematis",
    category: "이세계",
    meaning: "마음의 아름다움",
    keywords: ["기품", "내면의 결", "감아 오르는 인연"],
    season: "여름",
    accent: "ring-violet-400/40",
    image: "/flowers/19.png",
  },
  {
    id: "20",
    koreanName: "에델바이스",
    scientificName: "Leontopodium alpinum",
    category: "이세계",
    meaning: "고귀한 추억",
    keywords: ["높은 곳의 꽃", "흔들리지 않는 마음", "맑은 기품"],
    season: "여름",
    accent: "ring-stone-300/40",
    image: "/flowers/20.png",
  },
  {
    id: "21",
    koreanName: "헤더",
    scientificName: "Calluna vulgaris",
    category: "이세계",
    meaning: "고독, 보호",
    keywords: ["바람 부는 들판", "혼자서도 강함", "잔잔한 자존"],
    season: "가을",
    accent: "ring-purple-300/40",
    image: "/flowers/21.png",
  },
  {
    id: "22",
    koreanName: "트윈플라워",
    scientificName: "Linnaea borealis",
    category: "이세계",
    meaning: "조용한 동행",
    keywords: ["두 사람의 한 마음", "수줍은 사랑", "고요한 숲"],
    season: "여름",
    accent: "ring-rose-300/40",
    image: "/flowers/22.png",
  },
  {
    id: "23",
    koreanName: "은방울꽃",
    scientificName: "Convallaria majalis",
    category: "이세계",
    meaning: "행복이 다시 옵니다",
    keywords: ["다가오는 좋은 일", "맑은 종소리", "순결한 시작"],
    season: "봄",
    accent: "ring-emerald-300/40",
    image: "/flowers/23.png",
  },
  {
    id: "24",
    koreanName: "마거리트데이지",
    scientificName: "Argyranthemum frutescens",
    category: "이세계",
    meaning: "진실한 마음, 사랑 점치기",
    keywords: ["솔직함", "꽃잎 점", "오늘의 답"],
    season: "여름",
    accent: "ring-amber-200/40",
    image: "/flowers/24.png",
  },
  {
    id: "25",
    koreanName: "담자리꽃나무",
    scientificName: "Dryas octopetala",
    category: "북유럽",
    meaning: "북방의 별",
    keywords: ["서리에서도 피어남", "겸손한 강인함", "북극의 빛"],
    season: "여름",
    accent: "ring-stone-200/40",
    image: "/flowers/25.png",
  },
  {
    id: "26",
    koreanName: "분홍바늘꽃",
    scientificName: "Chamerion angustifolium",
    category: "북유럽",
    meaning: "회복, 새 출발",
    keywords: ["불탄 자리에 가장 먼저 피어남", "재생", "흔적을 덮는 분홍"],
    season: "여름",
    accent: "ring-pink-400/40",
    image: "/flowers/26.png",
  },
  {
    id: "27",
    koreanName: "수레국화",
    scientificName: "Centaurea cyanus",
    category: "북유럽",
    meaning: "행복, 행운",
    keywords: ["밭의 푸른 별", "기다리던 행운", "맑은 바람"],
    season: "여름",
    accent: "ring-blue-400/40",
    image: "/flowers/27.png",
  },
  {
    id: "28",
    koreanName: "초롱꽃",
    scientificName: "Campanula rotundifolia",
    category: "북유럽",
    meaning: "감사, 충실",
    keywords: ["조용한 종소리", "낮은 곳에서 비치는 빛", "기다림"],
    season: "여름",
    accent: "ring-blue-300/40",
    image: "/flowers/28.png",
  },
  {
    id: "29",
    koreanName: "금매화",
    scientificName: "Trollius europaeus",
    category: "북유럽",
    meaning: "감사의 마음",
    keywords: ["북유럽의 햇살", "둥근 다정함", "고지대의 따뜻함"],
    season: "여름",
    accent: "ring-yellow-300/40",
    image: "/flowers/29.png",
  },
  {
    id: "30",
    koreanName: "북극양귀비",
    scientificName: "Papaver radicatum",
    category: "북유럽",
    meaning: "꿈, 환상",
    keywords: ["얼음 위의 노란 빛", "환영처럼 짧은 여름", "꿈에서 깬 마음"],
    season: "여름",
    accent: "ring-yellow-400/40",
    image: "/flowers/30.png",
  },
];

export const FLOWERS_BY_ID = new Map(FLOWERS.map((f) => [f.id, f]));

/** 카테고리별 그룹 — 점술사 voice 매핑용. */
export const FLOWERS_BY_CATEGORY: Record<FlowerCategory, FlowerCard[]> = {
  동양: FLOWERS.filter((f) => f.category === "동양"),
  이세계: FLOWERS.filter((f) => f.category === "이세계"),
  북유럽: FLOWERS.filter((f) => f.category === "북유럽"),
};

/**
 * 카테고리별 풀이 점술사 — 꽃점은 따뜻한 톤이 어울리는 캐릭터로만 매핑.
 *
 * 북유럽 캐릭터들(비요른·헬가·외르문드)은 모두 거칠거나 무거운 톤이라
 * 꽃의 부드러운 결과 어울리지 않음 → 북유럽 꽃은 라엘(천사 대리인, 따뜻한 톤)
 * 이 풀이. 캐릭터 카테고리 정합성보다 사용자 경험 우선.
 */
export const FLOWER_CHARACTER_BY_CATEGORY = {
  동양: "shaman",   // 소율 — 접신의 무녀 (다정함)
  이세계: "witch",  // 루나 — 달의 마녀 (감성적)
  북유럽: "sage",   // 라엘 — 천사 대리인 (따뜻함)
} as const;
