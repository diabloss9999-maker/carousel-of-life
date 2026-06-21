"use client";

/**
 * KST 시간에 따라 앱 배경 톤을 자동으로 전환하는 컴포넌트.
 *
 * 이전의 풍경 이미지는 화면마다 텍스트·카드와 충돌해 앱보다 웹 배경처럼 보였다.
 * 이제는 CSS 레이어만 사용해서 읽기 좋은 조용한 배경을 유지한다.
 */

import { useEffect, useState } from "react";

function getKstHour(): number {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }),
  ).getHours();
}

function isNightTime(hour: number): boolean {
  return hour >= 19 || hour < 7;
}

export function TimeAwareBg() {
  // SSR 기본값: 낮 (깜빡임 최소화)
  const [night, setNight] = useState(false);

  useEffect(() => {
    const applyTime = (isNight: boolean) => {
      setNight(isNight);
      if (typeof document !== "undefined") {
        document.body.dataset.time = isNight ? "night" : "day";
      }
    };

    applyTime(isNightTime(getKstHour()));

    // 자정·새벽 6시·밤 9시에 자동 전환하도록 1분마다 체크
    const timer = setInterval(() => {
      applyTime(isNightTime(getKstHour()));
    }, 60_000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div
      aria-hidden
      className={`ritual-backdrop ${night ? "is-night" : "is-day"}`}
    >
      <div className="ritual-backdrop__veil" />
      <div className="ritual-backdrop__wheel" />
      <div className="ritual-backdrop__threads" />
      <div className="ritual-backdrop__grain" />
    </div>
  );
}
