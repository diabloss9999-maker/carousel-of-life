"use client";

/**
 * KST 시간에 따라 배경 이미지를 자동으로 전환하는 컴포넌트.
 *
 * 06:00 ~ 20:59 → 천국의 회전목마 (밝은 낮 배경)
 * 21:00 ~ 05:59 → 밤 회전목마 (어두운 밤 배경)
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

  const wideSrc   = night ? "/backgrounds/night.png" : "/backgrounds/day.png";
  const mobileSrc = night ? "/backgrounds/night.png" : "/backgrounds/day.png";

  return (
    <>
      {/* 모바일 배경 */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-20 sm:hidden">
        <Image
          key={mobileSrc}
          src={mobileSrc}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center transition-opacity duration-700"
        />
      </div>
      {/* 데스크톱 배경 */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-20 hidden sm:block">
        <Image
          key={wideSrc}
          src={wideSrc}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center transition-opacity duration-700"
        />
      </div>
    </>
  );
}

