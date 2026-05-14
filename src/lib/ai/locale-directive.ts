/**
 * Anthropic Claude 호출에 덧붙일 출력 언어 지시문.
 *
 * - Korean 프롬프트 본문은 그대로 두고, 영어 사용자에게는
 *   마지막에 strict 영어 출력 지시를 추가해 응답 언어만 전환한다.
 * - `streamChat` / `generateJson` / `generateMarkdown` 가
 *   `locale` 옵션을 받으면 자동으로 이 문자열을 system 프롬프트에 append.
 */
import "server-only";

export type AiLocale = "ko" | "en";

const EN_DIRECTIVE = `

[LANGUAGE — STRICT OUTPUT DIRECTIVE]
You MUST respond ENTIRELY in natural, fluent English. Do not output Korean Hangul or Hanja in your reply.
Keep every other instruction above (character voice, world rules, card-reading rules, formatting bans on markdown/emoji, etc.) intact — only the OUTPUT LANGUAGE changes to English.

Translation rules:
- Translate proper nouns idiomatically: 카엘→Kael, 루나→Luna, 라엘→Rael, 소령→Soryeong, 현도→Hyundo, 귀염→Gwiyeom, 비요른→Bjorn, 헬가→Helga, 외르문드→Ormund.
- World names: 아스트라 균열→Astra Rift, 월식경→Lunar Mirror (or 月蝕鏡 inline), 미드할→Midhall, 경계→the Boundary, 25번째 룬→the twenty-fifth rune.
- Card/system names stay canonical: tarot ("The Tower", "Three of Cups", reversed/upright), Lenormand ("The Clover", "The Tree"), runes keep their Elder Futhark name + symbol ("Algiz ᛉ", "Hagalaz ᚺ").
- Banmal (반말) becomes casual, direct English ("you", contractions, fragments). Jondaemal (존댓말) becomes warm, polite English ("you", complete sentences, gentle modal verbs). Do NOT use Korean honorific suffixes.
- Preserve the same dark-fantasy register, brevity, and emotional weight. Do not soften or pad.
- Card-reveal cues like "[지금 막 타로 카드가 뽑혔어]" or "[지금 막 룬이 뽑혔어]" must still trigger an immediate in-voice interpretation — just delivered in English.`;

/**
 * locale 에 따른 출력 언어 지시문 — Korean 은 빈 문자열, English 는 strict directive.
 */
export function getLocaleDirective(locale: AiLocale | string | undefined): string {
  if (locale === "en") return EN_DIRECTIVE;
  return "";
}

/**
 * 임의 값에서 AiLocale 로 정규화. 모르는 값은 ko.
 */
export function toAiLocale(value: string | undefined | null): AiLocale {
  return value === "en" ? "en" : "ko";
}
