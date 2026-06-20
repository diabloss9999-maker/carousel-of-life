export type EntityKey =
  | "luna"
  | "rael"
  | "gael"
  | "soryeong"
  | "hyundo"
  | "gwiyeom"
  | "bjorn"
  | "helga"
  | "ormund";

export function characterToEntityKey(characterId: string): EntityKey {
  switch (characterId) {
    case "witch":
      return "luna";
    case "sage":
      return "rael";
    case "child":
      return "gael";
    case "shaman":
      return "soryeong";
    case "taoist":
      return "hyundo";
    case "dokkaebi":
      return "gwiyeom";
    case "hunter":
      return "bjorn";
    case "runeshaman":
      return "helga";
    case "god":
      return "ormund";
    default:
      return "luna";
  }
}

export function getCharacterSilenceHint(characterId: string, locale: string | undefined): string {
  const ko: Record<string, string> = {
    witch: "\n[답변 가이드] 너무 단정하지 말고 부드럽게 되물어 주세요.",
    sage: "\n[답변 가이드] 짧고 차분하게 정리해 주세요.",
    child: "\n[답변 가이드] 다정하지만 과장 없이 말해 주세요.",
    shaman: "\n[답변 가이드] 조용하고 신중한 톤을 유지해 주세요.",
    taoist: "\n[답변 가이드] 가볍고 편안하게 이어가 주세요.",
    dokkaebi: "\n[답변 가이드] 솔직하고 장난기 있게 말하되 사용자를 놀리지 마세요.",
  };
  const en: Record<string, string> = {
    witch: "\n[Reply guide] Answer softly and avoid over-certainty.",
    sage: "\n[Reply guide] Keep it short, calm, and organized.",
    child: "\n[Reply guide] Be warm without exaggerating.",
    shaman: "\n[Reply guide] Keep a quiet, careful tone.",
    taoist: "\n[Reply guide] Keep it light and comfortable.",
    dokkaebi: "\n[Reply guide] Be honest and playful without teasing the user.",
  };
  const map = locale === "en" ? en : ko;
  return map[characterId] ?? "";
}
