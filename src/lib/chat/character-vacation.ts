import type { CharacterCategory, CharacterId } from "@/lib/chat/characters";

export const VACATION_POSTCARD_BY_CHARACTER: Record<CharacterId, string> = {
  child: "/characters/vacation/child-matched.webp",
  witch: "/characters/vacation/witch-matched.webp",
  sage: "/characters/vacation/sage-matched.webp",
  shaman: "/characters/vacation/shaman-matched.webp",
  taoist: "/characters/vacation/taoist-matched.webp",
  dokkaebi: "/characters/vacation/dokkaebi-matched.webp",
  hunter: "/characters/vacation/hunter-matched.webp",
  runeshaman: "/characters/vacation/runeshaman-matched.webp",
  god: "/characters/vacation/god-matched.webp",
};

const CHARACTER_IDS = [
  "child",
  "witch",
  "sage",
  "shaman",
  "taoist",
  "dokkaebi",
  "hunter",
  "runeshaman",
  "god",
] as const satisfies readonly CharacterId[];

const CATEGORY_IDS: Record<CharacterCategory, readonly CharacterId[]> = {
  이세계: ["child", "witch", "sage"],
  동양: ["shaman", "taoist", "dokkaebi"],
  북유럽: ["god", "hunter", "runeshaman"],
};

/** 한 세계관의 멤버 수(= 휴가 로테이션 주기). */
const WORLDVIEW_SIZE = 3;

const CATEGORY_BY_CHARACTER = Object.fromEntries(
  Object.entries(CATEGORY_IDS).flatMap(([category, ids]) =>
    ids.map((id) => [id, category]),
  ),
) as Record<CharacterId, CharacterCategory>;

export interface CharacterVacation {
  characterId: CharacterId;
  recommendationId: CharacterId;
}

export interface CharacterVacationRoster {
  dateKey: string;
  vacations: CharacterVacation[];
}

function getKstDateKey(date: Date): string {
  return date.toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

/**
 * KST 자정 기준 정수 일자 인덱스(1970-01-01 = 0).
 * 연속한 두 날짜는 정확히 1씩 차이 나므로, % 연산으로 안정적인 로테이션을 만든다.
 */
function getKstDayIndex(dateKey: string): number {
  const utcMidnightMs = Date.parse(`${dateKey}T00:00:00+09:00`);
  return Math.floor(utcMidnightMs / 86_400_000);
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function randomFromSeed(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 멤버 배열을 시드로 셔플한 사본을 돌려준다. */
function shuffleMembers(
  members: readonly CharacterId[],
  seed: number,
): CharacterId[] {
  const ids = [...members];
  const random = randomFromSeed(seed);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids;
}

/**
 * 세계관별 고정 휴가 순서.
 * 모듈 로드 시 1회 결정 → 매일 (일자 index % WORLDVIEW_SIZE) 위치의 멤버가 휴가를 간다.
 * 결과적으로 (1) 매일 멤버 교체, (2) 같은 사람 연속 휴가 불가, (3) 3일마다 완전 균등.
 */
const WORLDVIEW_VACATION_ORDER: Record<CharacterCategory, readonly CharacterId[]> = {
  이세계: shuffleMembers(CATEGORY_IDS["이세계"], hashString("vacation-order:이세계")),
  동양: shuffleMembers(CATEGORY_IDS["동양"], hashString("vacation-order:동양")),
  북유럽: shuffleMembers(CATEGORY_IDS["북유럽"], hashString("vacation-order:북유럽")),
};

function recommendFor(
  characterId: CharacterId,
  vacationing: Set<CharacterId>,
  dateKey: string,
): CharacterId {
  const category = CATEGORY_BY_CHARACTER[characterId];
  const sameWorld = CATEGORY_IDS[category].filter((id) => !vacationing.has(id));
  const fallback = CHARACTER_IDS.filter((id) => !vacationing.has(id));
  const candidates = sameWorld.length > 0 ? sameWorld : fallback;
  const seed = hashString(`recommend:${dateKey}:${characterId}`);
  return candidates[seed % candidates.length];
}

/**
 * 오늘 휴가 중인 점술사 명단을 돌려준다.
 *
 * 규칙: 세계관(이세계·동양·북유럽)마다 정확히 1명씩, 총 3명이 휴가를 간다.
 * 휴가자는 매일 바뀌며, 같은 사람이 이틀 연속 휴가를 가지 않는다.
 * 3일을 한 주기로 각 세계관의 세 멤버가 한 번씩 휴가를 가므로 장기적으로 완전히 균등하다.
 */
export function getTodayCharacterVacations(
  date: Date = new Date(),
): CharacterVacationRoster {
  const dateKey = getKstDateKey(date);
  const dayIndex = getKstDayIndex(dateKey);
  const pos = ((dayIndex % WORLDVIEW_SIZE) + WORLDVIEW_SIZE) % WORLDVIEW_SIZE;

  const vacationing = new Set<CharacterId>(
    (Object.keys(WORLDVIEW_VACATION_ORDER) as CharacterCategory[]).map(
      (category) => WORLDVIEW_VACATION_ORDER[category][pos],
    ),
  );

  return {
    dateKey,
    vacations: [...vacationing].map((characterId) => ({
      characterId,
      recommendationId: recommendFor(characterId, vacationing, dateKey),
    })),
  };
}

export function getCharacterVacation(
  characterId: CharacterId,
  roster: CharacterVacationRoster = getTodayCharacterVacations(),
): CharacterVacation | null {
  return roster.vacations.find((item) => item.characterId === characterId) ?? null;
}
