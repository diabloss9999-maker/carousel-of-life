"use client";

import { useState, useEffect } from "react";
import type { Character } from "@/lib/chat/characters";

/** KST 기준 낮 시작/끝 시각(시 단위). */
const KST_DAY_START_HOUR = 7;
const KST_DAY_END_HOUR = 19;
/** 시간대 갱신 주기(ms). */
const UPDATE_INTERVAL_MS = 60_000;

/**
 * 현재 KST 시각이 낮 시간대(07:00 ~ 18:59)인지 판별한다.
 */
function getIsDay(): boolean {
  const hour = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }),
  ).getHours();
  return hour >= KST_DAY_START_HOUR && hour < KST_DAY_END_HOUR;
}

/**
 * 현재 KST 시간대에 맞는 멤버 이미지 경로를 반환한다.
 * 1분마다 시간대를 재확인한다.
 */
export function useCharacterImage(character: Character): string {
  const [isDay, setIsDay] = useState<boolean>(getIsDay);

  useEffect(() => {
    const update = (): void => setIsDay(getIsDay());
    const timer = setInterval(update, UPDATE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return isDay ? character.imageSrcDay : character.imageSrc;
}
