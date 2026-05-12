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

export function RitualBody({ crackLevel }: RitualBodyProps) {
  useEffect(() => {
    const body = document.body;
    const hour = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }),
    ).getHours();

    // 낮/밤 배경
    const isDay = hour >= 7 && hour < 18;
    body.classList.remove("ritual-day", "ritual-night");
    body.classList.add(isDay ? "ritual-day" : "ritual-night");

    // 균열 클래스
    if (crackLevel >= 3) {
      body.classList.add("fracture-high");
    } else {
      body.classList.remove("fracture-high");
    }

    return () => {
      body.classList.remove("ritual-day", "ritual-night", "fracture-high");
    };
  }, [crackLevel]);

  return null;
}
