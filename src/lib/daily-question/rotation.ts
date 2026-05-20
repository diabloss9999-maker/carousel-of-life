/**
 * 오늘의 캐릭터 순환 — 클라이언트·서버 공용.
 * (server-only 의존성 없음)
 */
import type { CharacterCategory, CharacterId } from "@/lib/chat/characters";

const CHARACTER_ROTATION: CharacterId[] = [
  "child", "witch", "sage",
  "shaman", "taoist", "dokkaebi",
  "god", "hunter", "runeshaman",
];

/** 카테고리별 캐릭터 풀 — 각 점술 영역 전용 해설 점술사. */
const ROTATION_BY_CATEGORY: Record<CharacterCategory, CharacterId[]> = {
  이세계: ["child", "witch", "sage"],
  동양:   ["shaman", "taoist", "dokkaebi"],
  북유럽: ["god", "hunter", "runeshaman"],
};

function dayOfYear(dateStr: string): number {
  const d = new Date(dateStr);
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function resolveDate(dateStr?: string): string {
  return (
    dateStr ??
    new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" })
  );
}

/** 날짜 기반으로 오늘의 캐릭터를 결정한다 (결정론적). 9명 전체 풀. */
export function getTodayCharacter(dateStr?: string): CharacterId {
  const idx = dayOfYear(resolveDate(dateStr)) % CHARACTER_ROTATION.length;
  return CHARACTER_ROTATION[idx];
}

/**
 * 카테고리 제한 일일 캐릭터 — 점술 영역별 전용 해설자.
 *
 * - 이세계: 타로·르노르망 카드 해설
 * - 동양:   사주(타고남) 해설
 * - 북유럽: 룬 해설
 */
export function getTodayCharacterByCategory(
  category: CharacterCategory,
  dateStr?: string,
): CharacterId {
  const pool = ROTATION_BY_CATEGORY[category];
  const idx = dayOfYear(resolveDate(dateStr)) % pool.length;
  return pool[idx];
}
