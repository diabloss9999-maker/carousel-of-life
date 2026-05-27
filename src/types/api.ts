/**
 * API 요청·응답 공용 타입.
 */

/** 표준 API 성공 응답. */
export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

/** 표준 API 실패 응답. */
export interface ApiFailure {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

/** API 에러 코드 화이트리스트. */
export const API_ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  RATE_LIMITED: "RATE_LIMITED",
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED",
  CHARACTER_ON_VACATION: "CHARACTER_ON_VACATION",
  PROVIDER_ERROR: "PROVIDER_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ApiErrorCode =
  (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];
