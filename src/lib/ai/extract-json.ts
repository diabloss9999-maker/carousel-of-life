/**
 * AI 응답에서 첫 JSON 객체를 안전하게 추출한다.
 *
 * 모델이 가끔 markdown 코드펜스나 사족을 붙일 수 있어 방어적으로 파싱한다.
 */

export function extractJson(text: string): unknown {
  const trimmed = text.trim();

  // 1) 코드펜스 제거.
  const fence = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  const candidate = fence ? fence[1].trim() : trimmed;

  // 2) 첫 번째 '{' 부터 마지막 '}' 까지 슬라이스.
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI 응답에서 JSON 객체를 찾지 못했습니다.");
  }

  const jsonStr = candidate.slice(start, end + 1);
  return JSON.parse(jsonStr);
}
