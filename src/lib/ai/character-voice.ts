import type { CharacterId } from "@/lib/chat/characters";

export const NEUTRAL_CARD_VOICE =
  "차분한 조언 카드 해석가처럼 말하세요. 특정 멤버 이름, 멤버 말투, 팬서비스, 무대 설정은 언급하지 마세요. 결과는 사용자가 바로 이해할 수 있게 실용적으로 정리하세요. 반말, 이모지, 마크다운은 금지입니다. JSON만 출력하세요.";

export const NEUTRAL_PROSE_VOICE =
  "차분한 조언 해석가처럼 말하세요. 특정 멤버 이름, 멤버 말투, 팬서비스, 무대 설정은 언급하지 마세요. 결과는 사용자가 바로 이해할 수 있게 실용적으로 정리하세요. 빈 줄을 과하게 넣지 말고, 반말, 이모지, 마크다운은 금지입니다.";

export const NEUTRAL_SAJU_VOICE_ID = "doyoon-saju-v2";

export const NEUTRAL_SAJU_VOICE =
  "차분한 사주 리포트 작성자처럼 말하세요. Carousel Nine, 아이돌 멤버, 팬서비스, 무대 설정은 언급하지 마세요. 사주를 운명처럼 단정하지 말고, 사용자가 자기 이해와 마음 정리에 참고할 수 있는 엔터테인먼트 콘텐츠로 정리하세요. 의학, 법률, 금융 같은 전문 판단은 하지 마세요. 자연스러운 조언말을 쓰고, 반말, 이모지, 마크다운은 금지입니다. JSON만 출력하세요.";

export const CHARACTER_CARD_VOICE: Record<CharacterId, string> = {
  child: NEUTRAL_CARD_VOICE,
  witch: NEUTRAL_CARD_VOICE,
  sage: NEUTRAL_CARD_VOICE,
  shaman: NEUTRAL_CARD_VOICE,
  taoist: NEUTRAL_CARD_VOICE,
  dokkaebi: NEUTRAL_CARD_VOICE,
  hunter: NEUTRAL_CARD_VOICE,
  runeshaman: NEUTRAL_CARD_VOICE,
  god: NEUTRAL_CARD_VOICE,
};

export const CHARACTER_PROSE_VOICE: Record<CharacterId, string> = {
  child: NEUTRAL_PROSE_VOICE,
  witch: NEUTRAL_PROSE_VOICE,
  sage: NEUTRAL_PROSE_VOICE,
  shaman: NEUTRAL_PROSE_VOICE,
  taoist: NEUTRAL_PROSE_VOICE,
  dokkaebi: NEUTRAL_PROSE_VOICE,
  hunter: NEUTRAL_PROSE_VOICE,
  runeshaman: NEUTRAL_PROSE_VOICE,
  god: NEUTRAL_PROSE_VOICE,
};
