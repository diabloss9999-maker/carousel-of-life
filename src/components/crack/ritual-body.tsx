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

  body.classList.remove("ritual-day", "ritual-night");
  body.classList.add(isDay ? "ritual-day" : "ritual-night");
  body.setAttribute("data-time", isDay ? "day" : "night");

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
      body.classList.remove("ritual-day", "ritual-night", "fracture-high");
      body.removeAttribute("data-time");
    };
  }, [crackLevel]);

  return null;
}
