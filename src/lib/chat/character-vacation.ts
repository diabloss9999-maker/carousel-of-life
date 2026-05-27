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

function shuffledCharacterIds(seed: number): CharacterId[] {
  const ids = [...CHARACTER_IDS];
  const random = randomFromSeed(seed);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids;
}

function vacationCount(seed: number): number {
  if (seed % 5 === 0) return 0;
  return seed % 3 === 0 ? 2 : 1;
}

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

export function getTodayCharacterVacations(
  date: Date = new Date(),
): CharacterVacationRoster {
  const dateKey = getKstDateKey(date);
  const seed = hashString(`carousel-character-vacation:${dateKey}`);
  const vacationing = new Set(
    shuffledCharacterIds(seed).slice(0, vacationCount(seed)),
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
