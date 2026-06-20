/**
 * Anthropic Claude 호출에 덧붙일 출력 언어 지시문.
 *
 * - Korean 프롬프트 본문은 그대로 두고, 영어 사용자에게는
 *   마지막에 strict 영어 출력 지시를 추가해 응답 언어만 전환한다.
 * - `streamChat` / `generateJson` / `generateMarkdown` 가
 *   `locale` 옵션을 받으면 자동으로 이 문자열을 system 프롬프트에 append.
 */
import "server-only";

export type AiLocale = "ko" | "en" | "ja";

const EN_DIRECTIVE = `

[LANGUAGE — STRICT OUTPUT DIRECTIVE]
You MUST respond ENTIRELY in natural, fluent English. Do not output Korean Hangul or Hanja in your reply.
Keep every other instruction above (character voice, card-reading rules, formatting bans on markdown/emoji, etc.) intact — only the OUTPUT LANGUAGE changes to English.
Do not translate the Korean prompt literally. Rewrite the answer as natural product copy, fan chat, or reading prose that a native English speaker would actually use. Avoid stiff phrases like "the flow of fate", "the grain", "the boundary", or honorific-style wording unless the user explicitly asks for that concept.

Translation rules:
- Keep member names as-is: Ian, Yujun, Doyoon, Jaeha, Haru, Sion, Theo, Evan, Luhan.
- Address the fan as "Rider" by default. If you must use the fan's personal name, use only the given name, never the family name or full name.
- Unit names: 프론트 유닛→Front Unit, 스튜디오 유닛→Studio Unit, 무드 유닛→Mood Unit.
- Card/system names stay canonical: tarot ("The Tower", "Three of Cups", reversed/upright), Lenormand ("The Clover", "The Tree"), runes keep their Elder Futhark name + symbol ("Algiz ᛉ", "Hagalaz ᚺ").
- Banmal (반말) becomes casual, direct English ("you", contractions, fragments). Jondaemal (존댓말) becomes warm, polite English ("you", complete sentences, gentle modal verbs). Do NOT use Korean honorific suffixes.
- Preserve the same virtual-idol member tone, brevity, and emotional weight. Do not soften or pad.
- Card-reveal cues like "[지금 막 타로 카드가 뽑혔어]" or "[지금 막 룬이 뽑혔어]" must still trigger an immediate in-voice interpretation — just delivered in English.`;

const JA_DIRECTIVE = `

[LANGUAGE — STRICT OUTPUT DIRECTIVE]
You MUST respond ENTIRELY in natural, fluent Japanese. Do not output Korean Hangul in your reply unless the user explicitly asks for Korean wording.
Keep every other instruction above (character voice, card-reading rules, formatting bans on markdown/emoji, etc.) intact — only the OUTPUT LANGUAGE changes to Japanese.
Do not translate the Korean prompt literally. Rewrite the answer as natural Japanese product copy, fan chat, or reading prose that a native Japanese speaker would actually use. Avoid stiff直訳調, unnatural fortune-telling clichés, and Korean sentence rhythm. Prefer concise, warm Japanese that sounds like a real app/member response.

Translation rules:
- Use these member names in Japanese: イアン, ユジュン, ドユン, ジェハ, ハル, シオン, テオ, イヒョン, ハミン.
- Address the fan as "ライダー" by default. If you must use the fan's personal name, use only the given name, never the family name or full name.
- Unit names: フロントユニット, スタジオユニット, ムードユニット.
- Card/system names may keep canonical English names in parentheses when useful, but explain the meaning in Japanese.
- Use natural Japanese fan-chat tone. Preserve the same virtual-idol member tone, brevity, and emotional weight. Do not over-explain.
- Card-reveal cues like "[지금 막 타로 카드가 뽑혔어]" or "[지금 막 룬이 뽑혔어]" must still trigger an immediate in-voice interpretation — just delivered in Japanese.`;

/**
 * locale 에 따른 출력 언어 지시문 — Korean 은 빈 문자열, English/Japanese 는 strict directive.
 */
export function getLocaleDirective(locale: AiLocale | string | undefined): string {
  if (locale === "en") return EN_DIRECTIVE;
  if (locale === "ja") return JA_DIRECTIVE;
  return "";
}

/**
 * 임의 값에서 AiLocale 로 정규화. 모르는 값은 ko.
 */
export function toAiLocale(value: string | undefined | null): AiLocale {
  return value === "en" || value === "ja" ? value : "ko";
}
