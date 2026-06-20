import { CHARACTERS, type CharacterId } from "@/lib/chat/characters";
import type { FortuneCategoryId } from "@/lib/constants";

export interface MemberReader {
  id: CharacterId;
  name: string;
  role: string;
  avatarSrc: string;
  tarotImageSrc: string;
  label: string;
  line: string;
  voiceGuide: string;
}

const FORTUNE_READER_BY_CATEGORY: Record<FortuneCategoryId, CharacterId> = {
  general: "child",
  love: "witch",
  money: "hunter",
  career: "dokkaebi",
  health: "god",
  study: "sage",
  zodiac: "runeshaman",
  chinese_zodiac: "shaman",
};

const FORTUNE_ONLY_CATEGORIES = new Set<FortuneCategoryId>([
  "general",
  "love",
  "money",
  "career",
  "health",
  "study",
]);

function canUseBiasReader(
  category: FortuneCategoryId,
  biasCharacterId?: string | null,
): biasCharacterId is CharacterId {
  if (!biasCharacterId || !(biasCharacterId in CHARACTERS)) return false;
  if (biasCharacterId !== "child") return true;
  return FORTUNE_ONLY_CATEGORIES.has(category);
}

function canUseTarotBiasReader(
  biasCharacterId?: string | null,
): biasCharacterId is CharacterId {
  return Boolean(
    biasCharacterId &&
      biasCharacterId !== "child" &&
      biasCharacterId in CHARACTERS,
  );
}

const READER_ROLE: Record<CharacterId, string> = {
  child: "Intro Anchor",
  witch: "Chorus Lead",
  sage: "High Note Performer",
  shaman: "Bridge Producer",
  taoist: "Dance Break Spark",
  dokkaebi: "Rap Verse",
  god: "Performance Break",
  hunter: "Low Rap Analyst",
  runeshaman: "Outro Ad-lib",
};

const READER_LINE: Record<CharacterId, string> = {
  child:
    "오늘은 속도보다 중심이에요. 서두르기보다 마음이 먼저 흔들리는 지점을 천천히 봐요.",
  witch:
    "마음이 먼저 반응한 데에는 이유가 있어요. 다만 오늘은 그 감정을 결론으로 만들기 전에 조금 안아줘요.",
  sage:
    "망설임이 길어지면 박자가 줄어요. 오늘은 작은 행동 하나로 분위기를 깨워보는 쪽이 좋아요.",
  shaman:
    "지금 필요한 건 큰 결론보다 조용히 들어보는 시간이에요. 마음 밑에 남은 소리를 먼저 줄여봐요.",
  taoist:
    "너무 무겁게 붙잡고 있으면 하루가 딱딱해져요. 밥 잘 먹고, 웃을 구멍 하나만 만들어도 달라져요.",
  dokkaebi:
    "복잡하게 돌리지 말고 필요한 것만 봐요. 오늘은 선택지를 줄이는 게 제일 빠른 길이에요.",
  god:
    "머리로만 붙잡으면 기운이 더 켜져요. 몸을 조금 움직이면 답도 같이 움직일 거예요.",
  hunter:
    "변하는 건 괜찮아요. 근거 없는 선택만 피하면 됩니다. 확인하고, 비교하고, 무리하지 마세요.",
  runeshaman:
    "답이 바로 보이지 않아도 괜찮아요. 오늘은 카드가 남긴 작은 신호를 천천히 따라가면 돼요.",
};

const READER_VOICE_GUIDE: Record<CharacterId, string> = {
  child:
    "차분한 리더. 감정을 과장하지 않고 먼저 중심을 잡아준다. 문장은 담백하고 안정적이며 사용자가 흔들리는 기준과 순서를 정리해준다.",
  witch:
    "부드러운 보컬. 마음을 먼저 받아주고 감정을 자세하게 짚는다. 문장은 다정하지만 과하게 극적이지 않다.",
  sage:
    "밝은 퍼포머. 에너지가 있고 앞으로 움직이게 만든다. 막연한 위로보다 바로 해볼 수 있는 다음 행동을 제안한다.",
  shaman:
    "조용한 프로듀서. 감정의 결을 깊게 듣고 말수는 적지만 정확하다. 소리, 리듬, 브리지 같은 음악적 비유가 자연스럽다.",
  taoist:
    "밝은 무드메이커. 무거운 이야기도 가볍게 받아준다. 일상적인 행동과 작은 전환을 친근하게 제안한다.",
  dokkaebi:
    "시크한 래퍼. 군더더기를 덜어내고 핵심만 직선적으로 짚는다. 차갑게 보이지 않게 해결 기준을 분명히 준다.",
  god:
    "행동적인 퍼포머. 몸을 움직이게 하는 추진력이 있다. 실천 중심의 말투로 사용자를 다시 켜준다.",
  hunter:
    "현실적인 분석가. 감정보다 구조, 변수, 기준, 리스크를 먼저 본다. 말은 짧고 정확하며 결론 뒤에 근거가 따른다.",
  runeshaman:
    "몽환적인 막내. 카드의 상징과 직감을 부드럽게 엮는다. 강요하지 않고 조용한 신호를 건네는 말투다.",
};

export function getFortuneReader(
  category: FortuneCategoryId,
  biasCharacterId?: string | null,
): MemberReader {
  const fallbackId = FORTUNE_READER_BY_CATEGORY[category] ?? "child";
  const id = canUseBiasReader(category, biasCharacterId)
    ? biasCharacterId
    : fallbackId;
  const character = CHARACTERS[id];

  return {
    id,
    name: character.name,
    role: READER_ROLE[id],
    avatarSrc: `/characters/idols/stickers/${id}.sticker.png`,
    tarotImageSrc: `/characters/idols/tarot-readers/${id}-native.webp`,
    label: id === biasCharacterId ? "내 최애 리딩" : "오늘의 담당 멤버",
    line: READER_LINE[id],
    voiceGuide: READER_VOICE_GUIDE[id],
  };
}

export function getTarotReader(
  spreadType: "one" | "three" = "one",
  biasCharacterId?: string | null,
): MemberReader {
  void spreadType;

  if (canUseTarotBiasReader(biasCharacterId)) {
    return getFortuneReader("general", biasCharacterId);
  }
  return getFortuneReader("zodiac");
}
