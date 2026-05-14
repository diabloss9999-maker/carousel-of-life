/**
 * 캐릭터 표시 텍스트 — 현재 locale 의 name/title/hook/specialty 를 조회.
 *
 * - 영문/한글 둘 다 messages/{ko,en}.json 의 `characters.{id}` 와
 *   `specialties.{specialtyKey}` 에서 가져온다.
 * - 캐릭터별 specialtyKey 는 SPECIALTY_KEY 매핑.
 */
import type { CharacterId } from "@/lib/chat/characters";

export const SPECIALTY_KEY: Record<CharacterId, string> = {
  child:      "tarot",
  witch:      "tarot",
  sage:       "tarot",
  shaman:     "pillarsCelestial",
  taoist:     "pillarsCelestial",
  dokkaebi:   "pillarsCelestial",
  hunter:     "runeOmen",
  runeshaman: "runeOracle",
  god:        "runeVoice",
};
