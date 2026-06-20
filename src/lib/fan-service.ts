import type { CharacterId } from "@/lib/chat/characters";
import type { FortuneCategoryId } from "@/lib/constants";

export type FanServiceId =
  | "today-general"
  | "today-love"
  | "today-money"
  | "today-career"
  | "today-health"
  | "today-study"
  | "today-zodiac"
  | "today-chinese-zodiac"
  | "tarot"
  | "saju"
  | "flower"
  | "compatibility"
  | "name-reading"
  | "name-compatibility"
  | "personality"
  | "dream"
  | "palm";

export interface FanServiceProfile {
  id: FanServiceId;
  characterId: CharacterId;
  characterName: string;
  eyebrow: string;
  title: string;
  body: string;
  imageSrc: string;
  imageAlt: string;
  objectPosition?: string;
}

export const FAN_SERVICE: Record<FanServiceId, FanServiceProfile> = {
  "today-general": {
    id: "today-general",
    characterId: "child",
    characterName: "이안",
    eyebrow: "Ian Daily Briefing",
    title: "이안이 읽어주는 오늘 운세",
    body: "오늘 조심할 점과 기대해볼 일을 이안이 담담하게 말해줘요.",
    imageSrc: "/characters/idols/fortune/ian-fortune-reader-premium.png",
    imageAlt: "이안이 오늘의 운세를 읽어주는 모습",
    objectPosition: "center 35%",
  },
  "today-love": {
    id: "today-love",
    characterId: "witch",
    characterName: "유준",
    eyebrow: "Yujun Heart Note",
    title: "유준이 봐주는 오늘의 연애운",
    body: "마음이 어디로 향하는지 유준이 부드럽게 봐줘요.",
    imageSrc: "/characters/idols/editorial/yujun-editorial.webp",
    imageAlt: "유준이 연애운을 읽어주는 모습",
    objectPosition: "center 28%",
  },
  "today-money": {
    id: "today-money",
    characterId: "hunter",
    characterName: "이현",
    eyebrow: "Ihyun Money Check",
    title: "이현이 봐주는 오늘의 금전운",
    body: "돈 쓸 일과 아껴둘 일을 이현이 현실적으로 봐줘요.",
    imageSrc: "/characters/idols/editorial/ihyun-editorial.webp",
    imageAlt: "이현이 재물운을 봐주는 모습",
    objectPosition: "center 24%",
  },
  "today-career": {
    id: "today-career",
    characterId: "dokkaebi",
    characterName: "시온",
    eyebrow: "Sion Career Cut",
    title: "시온이 봐주는 오늘의 커리어운",
    body: "일에서 먼저 챙길 일을 시온이 선명하게 말해줘요.",
    imageSrc: "/characters/idols/editorial/sion-editorial.webp",
    imageAlt: "시온이 커리어운을 읽어주는 모습",
    objectPosition: "center 25%",
  },
  "today-health": {
    id: "today-health",
    characterId: "god",
    characterName: "태오",
    eyebrow: "Theo Body Signal",
    title: "태오가 봐주는 오늘의 건강운",
    body: "오늘 몸 상태에 맞춰 무리하지 않는 쪽을 태오가 알려줘요.",
    imageSrc: "/characters/idols/editorial/theo-editorial.webp",
    imageAlt: "태오가 건강운을 봐주는 모습",
    objectPosition: "center 22%",
  },
  "today-study": {
    id: "today-study",
    characterId: "sage",
    characterName: "도윤",
    eyebrow: "Doyoon Study Push",
    title: "도윤이 봐주는 오늘의 공부운",
    body: "공부를 시작하기 좋은 때와 집중법을 도윤이 알려줘요.",
    imageSrc: "/characters/idols/editorial/doyoon-editorial.webp",
    imageAlt: "도윤이 공부운을 봐주는 모습",
    objectPosition: "center top",
  },
  "today-zodiac": {
    id: "today-zodiac",
    characterId: "runeshaman",
    characterName: "하민",
    eyebrow: "Hamin Star Mood",
    title: "하민이 읽어주는 오늘의 별자리운",
    body: "별자리로 본 오늘의 분위기를 하민이 조용히 들려줘요.",
    imageSrc: "/characters/idols/editorial/hamin-editorial.webp",
    imageAlt: "하민이 별자리 운세를 들려주는 모습",
    objectPosition: "center 28%",
  },
  "today-chinese-zodiac": {
    id: "today-chinese-zodiac",
    characterId: "shaman",
    characterName: "재하",
    eyebrow: "Jaeha Old Sign",
    title: "재하가 읽어주는 오늘의 띠운세",
    body: "오늘 조심하면 좋을 점을 재하가 차분히 말해줘요.",
    imageSrc: "/characters/idols/editorial/jaeha-editorial.webp",
    imageAlt: "재하가 띠운세를 풀어주는 모습",
    objectPosition: "center 26%",
  },
  tarot: {
    id: "tarot",
    characterId: "runeshaman",
    characterName: "하민",
    eyebrow: "Hamin Tarot Service",
    title: "하민이 봐주는 타로 한 장",
    body: "하민이 펼친 카드로 지금 마음에 필요한 말을 들려줘요.",
    imageSrc: "/characters/idols/tarot-readers/hamin-tarot-reader-premium.png",
    imageAlt: "하민이 타로 카드를 봐주는 모습",
    objectPosition: "center 34%",
  },
  saju: {
    id: "saju",
    characterId: "sage",
    characterName: "도윤",
    eyebrow: "Doyoon Saju Note",
    title: "도윤이 읽어주는 사주 노트",
    body: "도윤이 내 사주를 보고 성향과 방향을 읽어줘요.",
    imageSrc: "/characters/idols/doyoon-saju-reader.png",
    imageAlt: "도윤이 사주를 읽어주는 모습",
    objectPosition: "center 26%",
  },
  flower: {
    id: "flower",
    characterId: "taoist",
    characterName: "하루",
    eyebrow: "Haru Flower Pick",
    title: "하루가 골라주는 오늘의 꽃",
    body: "하루가 오늘 내게 어울리는 꽃 한 송이를 골라줘요.",
    imageSrc: "/characters/idols/flower-oracle/haru-flower-oracle-premium.png",
    imageAlt: "하루가 꽃점을 봐주는 모습",
    objectPosition: "center 30%",
  },
  compatibility: {
    id: "compatibility",
    characterId: "witch",
    characterName: "유준",
    eyebrow: "Yujun Pair Mood",
    title: "유준이 봐주는 두 사람의 궁합",
    body: "두 사람 사이의 닮은 점과 다른 점을 유준이 읽어줘요.",
    imageSrc: "/characters/idols/editorial/yujun-editorial.webp",
    imageAlt: "유준이 궁합을 읽어주는 모습",
    objectPosition: "center 28%",
  },
  "name-reading": {
    id: "name-reading",
    characterId: "shaman",
    characterName: "재하",
    eyebrow: "Jaeha Name Tone",
    title: "재하가 읽어주는 이름의 울림",
    body: "이름에 담긴 느낌과 결을 재하가 들려줘요.",
    imageSrc: "/characters/idols/editorial/jaeha-editorial.webp",
    imageAlt: "재하가 이름풀이를 들려주는 모습",
    objectPosition: "center 26%",
  },
  "name-compatibility": {
    id: "name-compatibility",
    characterId: "hunter",
    characterName: "이현",
    eyebrow: "Ihyun Name Match",
    title: "이현이 봐주는 이름 궁합",
    body: "두 이름이 어떻게 맞물리는지 이현이 비교해줘요.",
    imageSrc: "/characters/idols/editorial/ihyun-editorial.webp",
    imageAlt: "이현이 이름 궁합을 비교해주는 모습",
    objectPosition: "center 24%",
  },
  personality: {
    id: "personality",
    characterId: "dokkaebi",
    characterName: "시온",
    eyebrow: "Sion Type Check",
    title: "시온이 읽어주는 내 성격",
    body: "내가 자주 보이는 패턴을 시온이 선명하게 말해줘요.",
    imageSrc: "/characters/idols/editorial/sion-editorial.webp",
    imageAlt: "시온이 성격유형을 읽어주는 모습",
    objectPosition: "center 25%",
  },
  dream: {
    id: "dream",
    characterId: "shaman",
    characterName: "재하",
    eyebrow: "Jaeha Dream Note",
    title: "재하가 풀어주는 꿈 이야기",
    body: "꿈에 남은 장면과 감정을 재하가 조용히 풀어줘요.",
    imageSrc: "/characters/idols/editorial/jaeha-editorial.webp",
    imageAlt: "재하가 꿈해몽을 풀어주는 모습",
    objectPosition: "center 26%",
  },
  palm: {
    id: "palm",
    characterId: "god",
    characterName: "태오",
    eyebrow: "Theo Palm Routine",
    title: "태오가 봐주는 손금 이야기",
    body: "손바닥에 남은 선과 생활 습관을 태오가 연결해봐요.",
    imageSrc: "/characters/idols/editorial/theo-editorial.webp",
    imageAlt: "태오가 손금 결을 봐주는 모습",
    objectPosition: "center 22%",
  },
};

export const FORTUNE_FAN_SERVICE_BY_CATEGORY: Record<FortuneCategoryId, FanServiceId> = {
  general: "today-general",
  love: "today-love",
  money: "today-money",
  career: "today-career",
  health: "today-health",
  study: "today-study",
  zodiac: "today-zodiac",
  chinese_zodiac: "today-chinese-zodiac",
};
