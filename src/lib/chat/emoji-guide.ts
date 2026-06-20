import type { CharacterId } from "@/lib/chat/characters";

const CAROUSEL_STICKER_GUIDE = [
  ":carousel_happy: - 반갑거나 기분 좋을 때",
  ":carousel_cheer: - 응원하거나 신나게 맞장구칠 때",
  ":carousel_shy: - 부끄럽거나 살짝 민망할 때",
  ":carousel_comfort: - 위로하거나 걱정해줄 때",
  ":carousel_surprise: - 놀랐거나 새 소식을 들었을 때",
  ":carousel_wink: - 장난스럽게 받아칠 때",
  ":carousel_pout: - 삐진 척하거나 투덜댈 때",
  ":carousel_sleepy: - 졸리거나 느긋하게 쉬는 분위기일 때",
  ":carousel_love: - 고맙거나 애정 표현을 할 때",
];

const MEMBER_STICKER_TASTE: Record<CharacterId, string> = {
  child: "이안은 :carousel_happy:, :carousel_comfort:를 차분하게 쓴다.",
  witch: "유준은 :carousel_comfort:, :carousel_shy:, :carousel_love:를 부드럽게 쓴다.",
  sage: "도윤은 :carousel_cheer:, :carousel_happy:를 밝게 쓴다.",
  shaman: "재하는 :carousel_shy:, :carousel_comfort:, :carousel_sleepy:를 감성적으로 쓴다.",
  taoist: "하루는 :carousel_wink:, :carousel_cheer:, :carousel_pout:를 장난스럽게 쓴다.",
  dokkaebi: "시온은 :carousel_wink:, :carousel_pout:, :carousel_surprise:를 시크하게 쓴다.",
  god: "태오는 :carousel_cheer:, :carousel_happy:, :carousel_wink:를 자신 있게 쓴다.",
  hunter: "이현은 :carousel_surprise:, :carousel_comfort:, :carousel_sleepy:를 절제해서 쓴다.",
  runeshaman: "하민은 :carousel_sleepy:, :carousel_love:, :carousel_shy:를 몽글하게 쓴다.",
};

export function buildChatEmojiGuide(characterId: CharacterId): string {
  return `[캐러셀 목마 스티커]
멤버는 라이더와 채팅할 때 상황에 맞으면 아래 스티커 토큰을 아주 가끔 문장 끝에 붙일 수 있다.
앱은 이 토큰을 실제 귀여운 목마 스티커 이미지로 보여준다.

사용 가능한 스티커:
- ${CAROUSEL_STICKER_GUIDE.join("\n- ")}

멤버별 취향:
- ${MEMBER_STICKER_TASTE[characterId]}

규칙:
- 한 답장에 스티커 토큰은 0~1개만 쓴다.
- 매 답장마다 억지로 넣지 않는다. 감정이 분명할 때만 쓴다.
- 진지한 고민, 슬픈 이야기, 중요한 조언에는 스티커보다 먼저 공감한다.
- 토큰 철자를 정확히 쓴다. 예: :carousel_cheer:
- 스티커 토큰만 단독으로 보내지 않는다.`;
}

export function buildGroupEmojiGuide(): string {
  return `[캐러셀 목마 스티커]
단톡방 멤버들은 상황에 맞으면 아래 스티커 토큰을 가끔 문장 끝에 붙일 수 있다.
앱은 이 토큰을 실제 귀여운 목마 스티커 이미지로 보여준다.

사용 가능한 스티커:
- ${CAROUSEL_STICKER_GUIDE.join("\n- ")}

멤버별 취향:
- ${Object.values(MEMBER_STICKER_TASTE).join("\n- ")}

규칙:
- 한 멤버 대사에 스티커 토큰은 0~1개만 쓴다.
- 단톡방 전체에서 스티커가 너무 자주 나오지 않게 한다.
- 진지한 질문에는 스티커보다 말의 온도를 우선한다.
- 토큰 철자를 정확히 쓴다. 예: :carousel_happy:`;
}
