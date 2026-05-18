"use client";

/**
 * body에 낮/밤 배경 + 균열 클래스 + dominant 존재 광원 클래스를
 * 자동 적용하는 클라이언트 컴포넌트.
 *
 * - 시간 기반 (07~18시 = 낮, 그 외 = 밤).
 * - 균열 수치 3+ 이면 fracture-high 클래스를 추가.
 * - dominant entity (luna/rael/gael) 가 있으면 presence-* 클래스를 추가.
 */
import { useEffect } from "react";

import type { CrackLevel } from "@/lib/crack/service";
import { loadEntityMemory } from "@/lib/entity/entity-memory";
import { loadFractureState } from "@/lib/fracture/fracture-state";
import { computeEntityRelation } from "@/lib/systems/entity-relations";

interface RitualBodyProps {
  crackLevel: CrackLevel;
}

const PRESENCE_CLASSES = [
  "presence-luna",
  "presence-rael",
  "presence-gael",
] as const;

function getKstHour(): number {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }),
  ).getHours();
}

function applyPresenceClass(body: HTMLElement): void {
  try {
    const memory = loadEntityMemory();
    const fracture = loadFractureState();
    const relation = computeEntityRelation(memory, fracture);
    body.classList.remove(...PRESENCE_CLASSES);
    if (relation.dominant) {
      body.classList.add(`presence-${relation.dominant}`);
    }
  } catch {
    /* localStorage 접근 실패 등은 조용히 무시 */
  }
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
  body.style.backgroundImage = `url('/backgrounds/${isDay ? "day" : "night"}.webp')`;
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

  applyPresenceClass(body);
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
      body.classList.remove(...PRESENCE_CLASSES);
    };
  }, [crackLevel]);

  return null;
}
