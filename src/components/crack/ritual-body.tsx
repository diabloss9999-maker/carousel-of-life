"use client";

/**
 * body에 낮/밤 배경 + 균열 클래스를 자동 적용하는 클라이언트 컴포넌트.
 * 시간 기반 (07~18시 = 낮, 그 외 = 밤).
 * 균열 수치 3+ 이면 fracture-high 클래스를 추가한다.
 */
import { useEffect } from "react";
import type { CrackLevel } from "@/lib/crack/service";

interface RitualBodyProps {
  crackLevel: CrackLevel;
}

function getKstHour(): number {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }),
  ).getHours();
}

function applyTimeClass(body: HTMLElement, crackLevel: CrackLevel) {
  const hour = getKstHour();
  const isDay = hour >= 7 && hour < 19;
  const isDawn = hour >= 2 && hour < 5;

  body.classList.remove("ritual-day", "ritual-night");
  body.classList.add(isDay ? "ritual-day" : "ritual-night");
  body.classList.toggle("ritual-dawn", isDawn);
  body.setAttribute("data-time", isDay ? "day" : "night");

  // 인라인 style로 직접 지정 — CSS 클래스 캐스케이드 충돌 방지
  body.style.backgroundImage = `url('/backgrounds/${isDay ? "day" : "night"}.png')`;
  body.style.backgroundSize = "cover";
  body.style.backgroundPosition = "center";
  body.style.backgroundRepeat = "no-repeat";
  body.style.backgroundAttachment = "fixed";

  // 텍스트 색상도 직접 지정
  body.style.color = isDay ? "rgba(0,0,0,0.88)" : "rgba(255,255,255,0.92)";

  if (crackLevel >= 3) {
    body.classList.add("fracture-high");
  } else {
    body.classList.remove("fracture-high");
  }
}

export function RitualBody({ crackLevel }: RitualBodyProps) {
  useEffect(() => {
    const body = document.body;

    // 즉시 적용
    applyTimeClass(body, crackLevel);

    // 매분 체크 — 낮/밤 경계를 놓치지 않도록
    const timer = setInterval(() => applyTimeClass(body, crackLevel), 60_000);

    return () => {
      clearInterval(timer);
    };
  }, [crackLevel]);

  return null;
}
