/**
 * 르노르망(Lenormand) 36장 카드 데이터.
 *
 * 이미지는 `/public/lenormand/NN_name.webp` 경로 — 이미지 파일은 추후 추가 예정.
 */

export interface LenormandCard {
  /** 카드 번호 (1~36). */
  id: number;
  /** 한국어 이름. */
  nameKo: string;
  /** 영문 이름 (전통 명칭). */
  nameEn: string;
  /** 핵심 키워드 3~5개. */
  keywords: string[];
  /** 기본 의미 1문장. */
  meaning: string;
  /** 카드 이미지 경로. */
  imageSrc: string;
}

export const LENORMAND_DECK: LenormandCard[] = [
  { id: 1, nameKo: "기사", nameEn: "Rider", keywords: ["소식", "방문", "빠름", "젊음"], meaning: "새로운 소식이나 방문자가 다가온다.", imageSrc: "/lenormand/01_rider.webp" },
  { id: 2, nameKo: "클로버", nameEn: "Clover", keywords: ["행운", "기회", "희망", "순간"], meaning: "작은 행운과 가벼운 기회가 찾아온다.", imageSrc: "/lenormand/02_clover.webp" },
  { id: 3, nameKo: "배", nameEn: "Ship", keywords: ["여행", "거리", "무역", "탐험"], meaning: "먼 곳으로의 여정이나 새로운 모험이 시작된다.", imageSrc: "/lenormand/03_ship.webp" },
  { id: 4, nameKo: "집", nameEn: "House", keywords: ["가정", "안정", "부동산", "가족"], meaning: "가정과 안정, 집과 관련된 일에 주목하라.", imageSrc: "/lenormand/04_house.webp" },
  { id: 5, nameKo: "나무", nameEn: "Tree", keywords: ["건강", "성장", "뿌리", "생명"], meaning: "건강과 생명력, 깊이 뿌리내린 성장을 나타낸다.", imageSrc: "/lenormand/05_tree.webp" },
  { id: 6, nameKo: "구름", nameEn: "Clouds", keywords: ["혼란", "불확실", "의심", "변화"], meaning: "불확실함과 혼란이 시야를 흐린다.", imageSrc: "/lenormand/06_clouds.webp" },
  { id: 7, nameKo: "뱀", nameEn: "Snake", keywords: ["지혜", "유혹", "복잡함", "경쟁"], meaning: "복잡한 상황이나 경쟁자, 유혹에 주의하라.", imageSrc: "/lenormand/07_snake.webp" },
  { id: 8, nameKo: "관", nameEn: "Coffin", keywords: ["끝", "변환", "질병", "잠"], meaning: "무언가가 끝나고 새로운 시작을 준비한다.", imageSrc: "/lenormand/08_coffin.webp" },
  { id: 9, nameKo: "꽃다발", nameEn: "Bouquet", keywords: ["선물", "아름다움", "초대", "기쁨"], meaning: "기쁨과 감사, 아름다운 선물이 찾아온다.", imageSrc: "/lenormand/09_bouquet.webp" },
  { id: 10, nameKo: "낫", nameEn: "Scythe", keywords: ["결단", "위험", "수확", "절단"], meaning: "빠른 결단이 필요하거나 갑작스러운 변화가 온다.", imageSrc: "/lenormand/10_scythe.webp" },
  { id: 11, nameKo: "채찍", nameEn: "Whip", keywords: ["갈등", "반복", "토론", "훈련"], meaning: "반복되는 갈등이나 논쟁, 훈련의 시간이다.", imageSrc: "/lenormand/11_whip.webp" },
  { id: 12, nameKo: "새", nameEn: "Birds", keywords: ["대화", "소문", "불안", "쌍"], meaning: "소문이나 대화, 불안감이 맴돈다.", imageSrc: "/lenormand/12_birds.webp" },
  { id: 13, nameKo: "아이", nameEn: "Child", keywords: ["순수", "시작", "어린이", "순진함"], meaning: "순수한 시작, 새로운 가능성이 열린다.", imageSrc: "/lenormand/13_child.webp" },
  { id: 14, nameKo: "여우", nameEn: "Fox", keywords: ["교활함", "직업", "의심", "전략"], meaning: "영리함이 필요하거나 주변에 속임수가 있을 수 있다.", imageSrc: "/lenormand/14_fox.webp" },
  { id: 15, nameKo: "곰", nameEn: "Bear", keywords: ["힘", "보호", "재정", "상사"], meaning: "강한 힘과 보호, 재정적 안정을 나타낸다.", imageSrc: "/lenormand/15_bear.webp" },
  { id: 16, nameKo: "별", nameEn: "Stars", keywords: ["희망", "꿈", "안내", "성공"], meaning: "희망과 꿈, 밝은 미래를 향한 안내가 있다.", imageSrc: "/lenormand/16_stars.webp" },
  { id: 17, nameKo: "황새", nameEn: "Stork", keywords: ["변화", "이사", "임신", "새로움"], meaning: "긍정적인 변화와 새로운 시작이 온다.", imageSrc: "/lenormand/17_stork.webp" },
  { id: 18, nameKo: "개", nameEn: "Dog", keywords: ["우정", "충성", "신뢰", "동반자"], meaning: "충직한 친구와 신뢰할 수 있는 관계를 나타낸다.", imageSrc: "/lenormand/18_dog.webp" },
  { id: 19, nameKo: "탑", nameEn: "Tower", keywords: ["고독", "권위", "기관", "경계"], meaning: "고독이나 권위, 공식적인 기관과의 관계를 나타낸다.", imageSrc: "/lenormand/19_tower.webp" },
  { id: 20, nameKo: "정원", nameEn: "Garden", keywords: ["사교", "공공", "모임", "명성"], meaning: "사람들과의 만남, 사회적 활동이 활발해진다.", imageSrc: "/lenormand/20_garden.webp" },
  { id: 21, nameKo: "산", nameEn: "Mountain", keywords: ["장애", "도전", "지연", "고난"], meaning: "큰 장애물이 앞에 있지만 넘을 수 있다.", imageSrc: "/lenormand/21_mountain.webp" },
  { id: 22, nameKo: "갈림길", nameEn: "Crossroads", keywords: ["선택", "결정", "방향", "자유"], meaning: "중요한 선택의 기로에 서 있다.", imageSrc: "/lenormand/22_crossroads.webp" },
  { id: 23, nameKo: "쥐", nameEn: "Mice", keywords: ["손실", "스트레스", "감소", "걱정"], meaning: "조금씩 무언가가 소모되거나 스트레스가 쌓인다.", imageSrc: "/lenormand/23_mice.webp" },
  { id: 24, nameKo: "하트", nameEn: "Heart", keywords: ["사랑", "감정", "친절", "열정"], meaning: "사랑과 따뜻한 감정, 진심이 가득한 때다.", imageSrc: "/lenormand/24_heart.webp" },
  { id: 25, nameKo: "반지", nameEn: "Ring", keywords: ["약속", "계약", "관계", "순환"], meaning: "약속이나 계약, 지속적인 관계를 나타낸다.", imageSrc: "/lenormand/25_ring.webp" },
  { id: 26, nameKo: "책", nameEn: "Book", keywords: ["비밀", "지식", "교육", "숨겨진"], meaning: "숨겨진 지식이나 비밀이 존재한다.", imageSrc: "/lenormand/26_book.webp" },
  { id: 27, nameKo: "편지", nameEn: "Letter", keywords: ["소통", "문서", "이메일", "뉴스"], meaning: "중요한 소식이나 문서가 전달된다.", imageSrc: "/lenormand/27_letter.webp" },
  { id: 28, nameKo: "남자", nameEn: "Man", keywords: ["남성", "질문자", "파트너", "인물"], meaning: "중요한 남성 인물이나 질문자 자신을 나타낸다.", imageSrc: "/lenormand/28_man.webp" },
  { id: 29, nameKo: "여자", nameEn: "Woman", keywords: ["여성", "질문자", "파트너", "인물"], meaning: "중요한 여성 인물이나 질문자 자신을 나타낸다.", imageSrc: "/lenormand/29_woman.webp" },
  { id: 30, nameKo: "백합", nameEn: "Lily", keywords: ["평화", "순수", "노년", "성숙"], meaning: "평화롭고 성숙한 상황, 조화로운 시간이다.", imageSrc: "/lenormand/30_lily.webp" },
  { id: 31, nameKo: "태양", nameEn: "Sun", keywords: ["성공", "에너지", "행복", "승리"], meaning: "밝은 성공과 에너지, 행복이 가득한 때다.", imageSrc: "/lenormand/31_sun.webp" },
  { id: 32, nameKo: "달", nameEn: "Moon", keywords: ["감정", "직관", "명성", "꿈"], meaning: "감정과 직관이 강해지고 명성이 높아진다.", imageSrc: "/lenormand/32_moon.webp" },
  { id: 33, nameKo: "열쇠", nameEn: "Key", keywords: ["해결", "중요성", "발견", "열림"], meaning: "중요한 해결책이나 기회가 열린다.", imageSrc: "/lenormand/33_key.webp" },
  { id: 34, nameKo: "물고기", nameEn: "Fish", keywords: ["풍요", "재정", "흐름", "독립"], meaning: "재정적 흐름과 풍요, 독립적인 에너지를 나타낸다.", imageSrc: "/lenormand/34_fish.webp" },
  { id: 35, nameKo: "닻", nameEn: "Anchor", keywords: ["안정", "인내", "직업", "지속"], meaning: "안정과 인내, 오래 지속되는 것을 나타낸다.", imageSrc: "/lenormand/35_anchor.webp" },
  { id: 36, nameKo: "십자가", nameEn: "Cross", keywords: ["운명", "부담", "신앙", "시련"], meaning: "피할 수 없는 운명이나 시련, 깊은 의미를 나타낸다.", imageSrc: "/lenormand/36_cross.webp" },
];

if (LENORMAND_DECK.length !== 36) {
  throw new Error(`르노르망 덱 카드 수 오류: 기대 36, 실제 ${LENORMAND_DECK.length}`);
}

/** id → 카드 빠른 조회. */
export const LENORMAND_BY_ID: Record<number, LenormandCard> = Object.fromEntries(
  LENORMAND_DECK.map((c) => [c.id, c]),
);
