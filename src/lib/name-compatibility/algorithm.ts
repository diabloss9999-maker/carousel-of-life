/**
 * 이름 궁합 알고리즘 — 한글 자음 획수 기반 결정론적 점수 계산.
 *
 * 절차:
 *   1. 두 이름의 글자를 교차 배열 (A1 B1 A2 B2 …)
 *   2. 각 글자의 초성+종성 자음 획수를 합산
 *   3. 인접한 두 숫자를 더해서 자리수만 남김 — 길이가 2 가 될 때까지 반복
 *   4. 남은 두 자리수가 곧 0~99 의 궁합 점수
 *
 * 같은 입력은 항상 같은 결과 — DB 캐시 불필요. AI 해설은 별도 service.
 */

export const NAME_COMPATIBILITY_NAME_PATTERN = /^[가-힣]{1,6}$/;
export const NAME_COMPATIBILITY_NAME_MESSAGE =
  "이름은 한글 1~6자로 입력해 주세요.";

/** 한글 자음별 획수 표준 표. */
const STROKE_MAP: Record<string, number> = {
  ㄱ: 2,
  ㄴ: 2,
  ㄷ: 3,
  ㄹ: 5,
  ㅁ: 4,
  ㅂ: 4,
  ㅅ: 2,
  ㅇ: 1,
  ㅈ: 3,
  ㅊ: 4,
  ㅋ: 3,
  ㅌ: 4,
  ㅍ: 4,
  ㅎ: 3,
  ㄲ: 4,
  ㄸ: 6,
  ㅃ: 8,
  ㅆ: 4,
  ㅉ: 6,
  // 겹받침 (각 자음 획수의 합)
  ㄳ: 4,
  ㄵ: 5,
  ㄶ: 5,
  ㄺ: 7,
  ㄻ: 9,
  ㄼ: 9,
  ㄽ: 7,
  ㄾ: 9,
  ㄿ: 9,
  ㅀ: 8,
  ㅄ: 6,
};

const CHO_LIST = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ".split("");
const JONG_LIST = ["", ..."ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ".split("")];

/** 한 글자의 자음 획수 합 (초성 + 종성). 한글이 아니면 0. */
function strokeOfChar(ch: string): number {
  const code = ch.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return 0;
  const idx = code - 0xac00;
  const cho = Math.floor(idx / (21 * 28));
  const jong = idx % 28;

  let total = STROKE_MAP[CHO_LIST[cho]] ?? 0;
  if (jong > 0) total += STROKE_MAP[JONG_LIST[jong]] ?? 0;
  return total;
}

export interface NameCompatibilityResult {
  /** 0~99 사이의 궁합 점수. */
  score: number;
  /** 점수 등급 라벨 (예: "천생연분", "노력하면 통해" 등). */
  label: string;
  /** 시각·문구 톤 결정용 등급 분류. */
  tone: "best" | "good" | "ok" | "tough";
  /** 계산에 사용된 정규화 이름. */
  normalizedNameA: string;
  normalizedNameB: string;
}

/** 점수 → 등급 라벨 매핑. */
function gradeOf(score: number): { label: string; tone: NameCompatibilityResult["tone"] } {
  if (score >= 90) return { label: "천생연분", tone: "best" };
  if (score >= 80) return { label: "환상의 짝꿍", tone: "best" };
  if (score >= 70) return { label: "좋은 인연", tone: "good" };
  if (score >= 60) return { label: "괜찮은 흐름", tone: "good" };
  if (score >= 50) return { label: "노력하면 통해", tone: "ok" };
  if (score >= 40) return { label: "조금 다른 결", tone: "ok" };
  if (score >= 30) return { label: "엇갈리는 별", tone: "tough" };
  return { label: "다른 길의 인연", tone: "tough" };
}

/** 이름 입력값을 계산에 사용할 형태로 정리한다. */
function normalizeName(raw: string): string {
  const name = raw.trim();
  if (!NAME_COMPATIBILITY_NAME_PATTERN.test(name)) {
    throw new Error(NAME_COMPATIBILITY_NAME_MESSAGE);
  }
  return name;
}

/**
 * 이름 궁합 점수 계산.
 *
 * @throws 두 이름 중 하나라도 한글 1~6자가 아니면 예외.
 */
export function calculateNameCompatibility(
  rawNameA: string,
  rawNameB: string,
): NameCompatibilityResult {
  const a = normalizeName(rawNameA);
  const b = normalizeName(rawNameB);

  // 1) 교차 배열
  const aChars = Array.from(a);
  const bChars = Array.from(b);
  const merged: string[] = [];
  const maxLen = Math.max(aChars.length, bChars.length);
  for (let i = 0; i < maxLen; i += 1) {
    if (aChars[i]) merged.push(aChars[i]);
    if (bChars[i]) merged.push(bChars[i]);
  }

  // 2) 각 글자 → 자음 획수 합
  let nums = merged.map(strokeOfChar);
  // 모두 0 이면 계산 불가 (모음·외국어 같은 비정상 케이스 안전망)
  if (nums.every((n) => n === 0)) {
    throw new Error("이름에서 자음을 찾지 못했어요. 한글 이름을 확인해 주세요.");
  }

  // 3) 인접 합산 → 자리수만 → 길이 2 까지 반복.
  //    개별 숫자가 두 자리 이상이면 한 번 더 줄여 score 가 99 를 넘지 않게 보장.
  while (nums.length > 2) {
    const next: number[] = [];
    for (let i = 0; i < nums.length - 1; i += 1) {
      next.push((nums[i] + nums[i + 1]) % 10);
    }
    nums = next;
  }
  // 길이가 2 인 경우에도 각 자리수가 10 이상일 수 있어 안전하게 % 10 적용
  // (이름이 매우 짧고 자음 합이 큰 케이스 — 예: "흥" 5획, "훈" 6획 → [5, 6] OK,
  //  하지만 입력 조합에 따라 [11, 13] 같은 케이스 발생 가능)
  if (nums.length === 1) nums = [0, nums[0]];
  nums = [nums[0] % 10, nums[1] % 10];

  const score = nums[0] * 10 + nums[1];
  const { label, tone } = gradeOf(score);

  return {
    score,
    label,
    tone,
    normalizedNameA: a,
    normalizedNameB: b,
  };
}
