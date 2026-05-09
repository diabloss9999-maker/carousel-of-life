"use client";

import { useEffect, useRef } from "react";

/**
 * isPending 이 true → false 로 전환되는 순간 targetId 요소로 부드럽게 스크롤한다.
 *
 * @param isPending  Server Action / Transition 진행 여부
 * @param targetId   스크롤 목적지 요소의 id
 * @param delay      DOM 업데이트 대기 시간(ms). 기본값 400.
 */
export function useScrollToResult(
  isPending: boolean,
  targetId: string,
  delay = 400,
) {
  const prevRef = useRef(false);

  useEffect(() => {
    if (prevRef.current && !isPending) {
      const timer = setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, delay);
      return () => clearTimeout(timer);
    }
    prevRef.current = isPending;
  }, [isPending, targetId, delay]);
}
