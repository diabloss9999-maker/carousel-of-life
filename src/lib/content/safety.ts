const BROKEN_MARKERS = [
  "占",
  "疫",
  "筌",
  "獄",
  "癰",
  "夷",
  "媛",
  "",
  "怨",
  "沅",
  "곹",
  "쨌",
  "횞",
  "�",
];

const DEFAULT_READING_FALLBACK =
  "이전 버전에서 저장된 결과라 내용을 깔끔하게 표시하기 어려워요. 새로 뽑으면 정리된 형식으로 다시 볼 수 있어요.";

const DEFAULT_SHORT_FALLBACK = "확인이 필요해요";

export function looksCorruptedText(text: string | null | undefined): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (/^\?+$/.test(trimmed)) return true;

  if (BROKEN_MARKERS.some((marker) => trimmed.includes(marker))) return true;

  const questionMarks = (trimmed.match(/\?/g) ?? []).length;
  const hangul = (trimmed.match(/[가-힣]/g) ?? []).length;
  const cjk = (trimmed.match(/[\u4e00-\u9fff]/g) ?? []).length;
  const letters = (trimmed.match(/[A-Za-z가-힣]/g) ?? []).length;

  if (cjk >= 2 && hangul === 0) return true;
  if (questionMarks >= 5 && hangul === 0) return true;
  if (questionMarks >= 8 && questionMarks > letters * 0.4) return true;

  return false;
}

export function safeReadingText(
  text: string | null | undefined,
  fallback = DEFAULT_READING_FALLBACK,
): string {
  if (!text?.trim()) return fallback;
  return looksCorruptedText(text) ? fallback : text;
}

export function safeShortText(
  text: string | null | undefined,
  fallback = DEFAULT_SHORT_FALLBACK,
): string {
  if (!text?.trim()) return fallback;
  return looksCorruptedText(text) ? fallback : text;
}
