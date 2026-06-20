/**
 * 오늘의 멤버 순환 — 클라이언트·서버 공용.
 * (server-only 의존성 없음)
 */
import type { CharacterCategory, CharacterId } from "@/lib/chat/characters";

const CHARACTER_ROTATION: CharacterId[] = [
  "child", "witch", "sage",
  "shaman", "taoist", "dokkaebi",
  "god", "hunter", "runeshaman",
];

/** 카테고리별 멤버 풀 — 새 멤버 설정 전까지 슬롯 단위로 순환한다. */
const ROTATION_BY_CATEGORY: Record<CharacterCategory, CharacterId[]> = {
  기본: ["child", "witch", "sage"],
  확장: ["shaman", "taoist", "dokkaebi"],
  보관: ["god", "hunter", "runeshaman"],
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
function pickAvailableCharacter(
  pool: readonly CharacterId[],
  dateStr?: string,
): CharacterId {
  const dateKey = resolveDate(dateStr);
  const idx = dayOfYear(dateKey) % pool.length;
  return pool[idx];
}

/** 날짜 기반으로 오늘의 멤버를 결정한다 (결정론적). 9명 전체 풀. */
export function getTodayCharacter(dateStr?: string): CharacterId {
  return pickAvailableCharacter(CHARACTER_ROTATION, dateStr);
}

/**
 * 카테고리 제한 일일 멤버.
 */
export function getTodayCharacterByCategory(
  category: CharacterCategory,
  dateStr?: string,
): CharacterId {
  return pickAvailableCharacter(ROTATION_BY_CATEGORY[category], dateStr);
}
