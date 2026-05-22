"use client";

/**
 * ?ref=XXX 쿼리 파라미터를 쿠키에 저장하는 무 UI 컴포넌트.
 *
 * 가입 페이지에서 사용. 가입 완료 후 onboarding-action 이 이 쿠키를 읽어
 * profiles.invitedBy 에 초대자 user_id 기록.
 *
 * 쿠키 수명: 30일.
 */
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

const COOKIE_NAME = "carousel_ref";
const MAX_AGE = 60 * 60 * 24 * 30; // 30일

export function RefCapture() {
  const params = useSearchParams();

  useEffect(() => {
    const ref = params.get("ref");
    if (!ref) return;
    // 형식 검증 (16진 6-12자)
    if (!/^[0-9a-fA-F]{6,12}$/.test(ref)) return;
    // 쿠키 저장 (Path=/, SameSite=Lax)
    document.cookie = `${COOKIE_NAME}=${ref.toLowerCase()}; path=/; max-age=${MAX_AGE}; samesite=lax`;
  }, [params]);

  return null;
}
