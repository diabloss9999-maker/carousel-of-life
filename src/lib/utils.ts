/**
 * 공용 유틸리티 함수 모음.
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind 클래스명을 안전하게 병합한다.
 *
 * @param inputs - 병합할 클래스 값들
 * @returns 충돌이 해결된 단일 클래스 문자열
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * `Promise<T>` 를 `[error, data]` 튜플로 반환한다.
 *
 * try/catch 보일러플레이트 없이 비동기 결과를 다루기 위함.
 */
export async function tryCatch<T>(
  promise: Promise<T>,
): Promise<readonly [Error, null] | readonly [null, T]> {
  try {
    const data = await promise;
    return [null, data] as const;
  } catch (error) {
    return [error instanceof Error ? error : new Error(String(error)), null] as const;
  }
}

/**
 * 한국어 친화적 날짜 포맷.
 *
 * @example
 *   formatKoreanDate(new Date()); // "2026년 5월 6일 (수)"
 */
export function formatKoreanDate(date: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    // 서버(Vercel)는 UTC — KST 명시 없으면 자정~09시 사이 어제 날짜로 표시된다.
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

/**
 * 한국 원화 포맷.
 *
 * @example
 *   formatKRW(4900); // "4,900원"
 */
export function formatKRW(amount: number): string {
  return `${new Intl.NumberFormat("ko-KR").format(amount)}원`;
}

/**
 * 긴 운세·풀이 문장을 한 문장씩 줄바꿈한다.
 *
 * 문장 끝 부호(. ! ?)와 그 뒤 따옴표·괄호 다음의 공백을 줄바꿈으로 바꿔,
 * 다음 문장이 새 줄에서 시작하도록 만든다. 렌더 측에서 `whitespace-pre-line`
 * 과 함께 쓴다. 같은 문자열에 두 번 적용해도 결과가 같다(멱등).
 *
 * - 소수점(예: 3.5)은 뒤에 공백이 없어 끊기지 않는다.
 * - 말줄임표(…)는 문장 중간 여운이므로 끊지 않는다.
 *
 * @example
 *   breakSentences("좋은 날이에요. 천천히 가요.");
 *   // "좋은 날이에요.\n천천히 가요."
 */
export function breakSentences(text: string): string {
  if (!text) return text;
  return text
    .replace(/\r\n/g, "\n")
    .replace(/([.!?]["'”’)\]]?)[ \t]+/g, "$1\n")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}
