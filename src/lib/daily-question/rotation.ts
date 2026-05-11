/**
 * 오늘의 캐릭터 순환 — 클라이언트·서버 공용.
 * (server-only 의존성 없음)
 */
import type { CharacterId } from "@/lib/chat/characters";

const CHARACTER_ROTATION: CharacterId[] = ["child", "witch", "sage", "shaman", "taoist", "dokkaebi"];

function dayOfYear(dateStr: string): number {
  const d = new Date(dateStr);
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

/** 날짜 기반으로 오늘의 캐릭터를 결정한다 (결정론적). */
export function getTodayCharacter(dateStr?: string): CharacterId {
  const date =
    dateStr ??
    new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
  const idx = dayOfYear(date) % CHARACTER_ROTATION.length;
  return CHARACTER_ROTATION[idx];
}
