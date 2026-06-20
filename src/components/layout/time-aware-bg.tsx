"use client";

/**
 * KST 시간에 따라 배경 이미지를 자동으로 전환하는 컴포넌트.
 *
 * 06:00 ~ 20:59 → 천국의 회전목마 (밝은 낮 배경)
 * 21:00 ~ 05:59 → 밤 회전목마 (어두운 밤 배경)
 *
 * 이미지 위에는 CSS 레이어로 별자리 지도·회전 원형·종이 질감을 얹어
 * 모든 페이지가 같은 세계 안에 놓인 느낌을 만든다.
 */

import Image from "next/image";
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

  const src = "/backgrounds/carousel-meadow.webp";

  return (
    <div
      aria-hidden
      className={`ritual-backdrop ${night ? "is-night" : "is-day"}`}
    >
      <Image
        key={src}
        src={src}
        alt=""
        fill
        priority
        sizes="100vw"
        className="ritual-backdrop__image"
      />
      <div className="ritual-backdrop__veil" />
      <div className="ritual-backdrop__wheel" />
      <div className="ritual-backdrop__threads" />
      <div className="ritual-backdrop__grain" />
    </div>
  );
}
