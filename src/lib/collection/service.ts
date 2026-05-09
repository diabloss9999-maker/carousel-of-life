/**
 * 컬렉션 발견 로직.
 *
 * 별도 DB 테이블 없이 기존 사용자 데이터(profiles, tarotReadings, chatSessions)에서
 * "어떤 카드를 발견했는가"를 계산해 Set 으로 반환한다.
 */
import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { chatSessions, tarotReadings, type Profile } from "@/db/schema";
import { getZodiacSign } from "@/lib/fortunes/zodiac";

/** 천간 한자 → 이미지 ID. */
const STEM_TO_IMG: Record<string, string> = {
  甲: "gap",
  乙: "eul",
  丙: "byung",
  丁: "jeong",
  戊: "mu",
  己: "gi",
  庚: "gyeong",
  辛: "sin",
  壬: "im",
  癸: "gye",
};

/** 지지 한자 → 십이간지 ID. */
const BRANCH_TO_ZODIAC: Record<string, string> = {
  子: "rat",
  丑: "ox",
  寅: "tiger",
  卯: "rabbit",
  辰: "dragon",
  巳: "snake",
  午: "horse",
  未: "goat",
  申: "monkey",
  酉: "rooster",
  戌: "dog",
  亥: "pig",
};

/** 지원되는 캐릭터 ID 화이트리스트 (정적 카드 데이터와 일치). */
const SUPPORTED_CHARACTER_IDS = new Set(["witch", "child", "sage"]);

/** tarotReadings.cards jsonb 의 단일 항목 형태 가드. */
interface TarotCardEntry {
  cardId: string;
}

function isCardEntry(v: unknown): v is TarotCardEntry {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return typeof o.cardId === "string";
}

/**
 * 사용자가 지금까지 뽑은 모든 타로 카드 id 를 수집한다.
 */
async function getDiscoveredTarotIds(userId: string): Promise<Set<string>> {
  const rows = await db
    .select({ cards: tarotReadings.cards })
    .from(tarotReadings)
    .where(eq(tarotReadings.userId, userId));

  const found = new Set<string>();
  for (const row of rows) {
    const cards = row.cards;
    if (!Array.isArray(cards)) continue;
    for (const c of cards) {
      if (isCardEntry(c)) {
        found.add(c.cardId);
      }
    }
  }
  return found;
}

/**
 * MBTI 발견 — 프로필에 mbti 가 저장되어 있으면 해당 1개.
 */
function getDiscoveredMbtiIds(profile: Profile): Set<string> {
  const found = new Set<string>();
  if (profile.mbti && /^[EI][SN][TF][JP]$/.test(profile.mbti)) {
    found.add(profile.mbti.toUpperCase());
  }
  return found;
}

/**
 * 별자리 — 회원가입 시점에 birthDate 로 항상 1개가 결정된다.
 */
function getDiscoveredZodiacIds(profile: Profile): Set<string> {
  const found = new Set<string>();
  if (profile.birthDate) {
    const sign = getZodiacSign(profile.birthDate);
    found.add(sign.id);
  }
  return found;
}

/** sajuPillars jsonb 단일 기둥 가드. */
function pillarOf(v: unknown): { stem: string; branch: string } | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (typeof o.stem === "string" && typeof o.branch === "string") {
    return { stem: o.stem, branch: o.branch };
  }
  return null;
}

/** sajuPillars 에서 모든 기둥(year/month/day/hour) 을 추출. */
function extractPillars(
  pillars: unknown,
): Array<{ stem: string; branch: string }> {
  if (!pillars || typeof pillars !== "object") return [];
  const o = pillars as Record<string, unknown>;
  const out: Array<{ stem: string; branch: string }> = [];
  for (const key of ["year", "month", "day", "hour"]) {
    const p = pillarOf(o[key]);
    if (p) out.push(p);
  }
  return out;
}

/**
 * 십이간지 — 사주 8자가 계산되어 있으면 지지(branch)에서 추출 + 생년에서도 1개.
 */
function getDiscoveredChineseZodiacIds(profile: Profile): Set<string> {
  const found = new Set<string>();

  // 지지 → 동물
  for (const p of extractPillars(profile.sajuPillars)) {
    const id = BRANCH_TO_ZODIAC[p.branch];
    if (id) found.add(id);
  }

  // 생년 기반 폴백 — 사주 미계산 사용자도 1개는 보장.
  if (profile.birthDate) {
    const year = Number(profile.birthDate.split("-")[0]);
    if (Number.isFinite(year)) {
      const idx = ((year - 1900) % 12 + 12) % 12;
      const order: string[] = [
        "rat",
        "ox",
        "tiger",
        "rabbit",
        "dragon",
        "snake",
        "horse",
        "goat",
        "monkey",
        "rooster",
        "dog",
        "pig",
      ];
      found.add(order[idx]);
    }
  }

  return found;
}

/**
 * 천간 — 사주 8자가 계산되어 있으면 천간(stem) 에서 추출.
 */
function getDiscoveredCheonganIds(profile: Profile): Set<string> {
  const found = new Set<string>();
  for (const p of extractPillars(profile.sajuPillars)) {
    const id = STEM_TO_IMG[p.stem];
    if (id) found.add(id);
  }
  return found;
}

/**
 * 주술사 — chatSessions.character 에 한 번이라도 등장한 캐릭터.
 */
async function getDiscoveredCharacterIds(
  userId: string,
): Promise<Set<string>> {
  const rows = await db
    .select({ character: chatSessions.character })
    .from(chatSessions)
    .where(eq(chatSessions.userId, userId));

  const found = new Set<string>();
  for (const row of rows) {
    const c = row.character;
    if (typeof c === "string" && SUPPORTED_CHARACTER_IDS.has(c)) {
      found.add(c);
    }
  }
  return found;
}

/** 카테고리별 발견된 ID 집합 — Server → Client 로 안전하게 직렬화하기 위해 string[] 로도 변환. */
export interface DiscoveredCollection {
  tarot: Set<string>;
  mbti: Set<string>;
  zodiac: Set<string>;
  chineseZodiac: Set<string>;
  cheongan: Set<string>;
  characters: Set<string>;
}

/**
 * 사용자의 전체 발견 정보를 한 번에 조회한다.
 */
export async function getDiscoveredCollection(
  userId: string,
  profile: Profile,
): Promise<DiscoveredCollection> {
  const [tarot, characters] = await Promise.all([
    getDiscoveredTarotIds(userId),
    getDiscoveredCharacterIds(userId),
  ]);

  return {
    tarot,
    mbti: getDiscoveredMbtiIds(profile),
    zodiac: getDiscoveredZodiacIds(profile),
    chineseZodiac: getDiscoveredChineseZodiacIds(profile),
    cheongan: getDiscoveredCheonganIds(profile),
    characters,
  };
}

/** 카테고리별 발견 ID 를 직렬화 가능한 객체로 변환. */
export interface DiscoveredCollectionPlain {
  tarot: string[];
  mbti: string[];
  zodiac: string[];
  chineseZodiac: string[];
  cheongan: string[];
  characters: string[];
}

/** Server Component → Client Component 전달용 직렬화. */
export function toPlain(d: DiscoveredCollection): DiscoveredCollectionPlain {
  return {
    tarot: Array.from(d.tarot),
    mbti: Array.from(d.mbti),
    zodiac: Array.from(d.zodiac),
    chineseZodiac: Array.from(d.chineseZodiac),
    cheongan: Array.from(d.cheongan),
    characters: Array.from(d.characters),
  };
}
