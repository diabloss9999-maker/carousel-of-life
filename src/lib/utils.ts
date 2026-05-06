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
