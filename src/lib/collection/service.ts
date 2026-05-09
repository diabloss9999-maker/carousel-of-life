/**
 * 가챠 기반 카드 컬렉션 서비스.
 *
 * - 무료: 일 1회 / 프리미엄: 일 3회 (KST 기준)
 * - 131장 풀에서 균등 랜덤 (중복 가능, 중복은 카운트만 소모)
 * - 새 카드면 collection_cards 에 저장, 일일 카운트는 gacha_daily 에 누적
 */
import "server-only";

import { and, count, eq } from "drizzle-orm";

import { db } from "@/db";
import { collectionCards, gachaDaily } from "@/db/schema";
import {
  COLLECTION_BY_CATEGORY,
  type CollectionCardMeta,
  type CollectionCategory,
} from "@/lib/collection/cards-data";

/** 무료 사용자 일일 가챠 한도. */
export const FREE_DAILY_GACHA = 1;
/** 프리미엄 사용자 일일 가챠 한도. */
export const PREMIUM_DAILY_GACHA = 3;

/** 전체 풀 카드 수 (런타임 검증용). */
export const GACHA_POOL_SIZE = Object.values(COLLECTION_BY_CATEGORY).reduce(
  (sum, cards) => sum + cards.length,
  0,
);

/** 클라이언트로 직렬화 가능한 카드 단건 (category 포함). */
export interface FlatCardDTO {
  id: string;
  category: CollectionCategory;
  nameKo: string;
  nameEn?: string;
  imageSrc: string;
  description: string;
  rarity: CollectionCardMeta["rarity"];
}

/** 가챠 성공 결과. */
export interface GachaPullSuccess {
  ok: true;
  card: FlatCardDTO;
  /** 이번 뽑기로 새로 획득한 카드인지. */
  isNew: boolean;
  /** 뽑기 후 남은 횟수. */
  remaining: number;
  /** 오늘의 한도. */
  limit: number;
  /** 갱신된 소장 카드 총 개수. */
  ownedCount: number;
}

/** 일일 한도 초과. */
export interface GachaPullQuotaExceeded {
  ok: false;
  quotaExceeded: true;
  remaining: 0;
  limit: number;
}

export type GachaPullResult = GachaPullSuccess | GachaPullQuotaExceeded;

/** 오늘 가챠 현황. */
export interface GachaStatus {
  used: number;
  remaining: number;
  limit: number;
}

/** KST 오늘 날짜를 YYYY-MM-DD 형식으로 반환한다. */
function getTodayKst(): string {
  const kstString = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Seoul",
  });
  const d = new Date(kstString);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** 구독 여부에 따른 일일 한도. */
function dailyLimit(isSubscribed: boolean): number {
  return isSubscribed ? PREMIUM_DAILY_GACHA : FREE_DAILY_GACHA;
}

/** 모든 카드를 평면 배열로 변환 — 풀 캐싱. */
let cachedPool: FlatCardDTO[] | null = null;
function getCardPool(): FlatCardDTO[] {
  if (cachedPool) return cachedPool;
  const out: FlatCardDTO[] = [];
  const cats = Object.keys(COLLECTION_BY_CATEGORY) as CollectionCategory[];
  for (const cat of cats) {
    for (const card of COLLECTION_BY_CATEGORY[cat]) {
      out.push({
        id: card.id,
        category: cat,
        nameKo: card.nameKo,
        nameEn: card.nameEn,
        imageSrc: card.imageSrc,
        description: card.description,
        rarity: card.rarity,
      });
    }
  }
  cachedPool = out;
  return out;
}

/**
 * 사용자의 오늘 가챠 현황을 조회한다.
 *
 * @param userId - 사용자 ID
 * @param isSubscribed - 활성 구독 여부
 */
export async function getTodayGachaStatus(
  userId: string,
  isSubscribed: boolean,
): Promise<GachaStatus> {
  const today = getTodayKst();
  const limit = dailyLimit(isSubscribed);
  const [row] = await db
    .select({ pullCount: gachaDaily.pullCount })
    .from(gachaDaily)
    .where(and(eq(gachaDaily.userId, userId), eq(gachaDaily.pullDate, today)))
    .limit(1);
  const used = row?.pullCount ?? 0;
  return {
    used,
    remaining: Math.max(0, limit - used),
    limit,
  };
}

/**
 * 가챠 1회 실행.
 *
 * 1) 일일 한도 확인 → 초과면 quotaExceeded 반환
 * 2) 131장 풀에서 균등 랜덤 카드 1장 선택
 * 3) 신규 카드면 collection_cards INSERT (onConflictDoNothing)
 * 4) gacha_daily upsert 로 카운트 +1
 *
 * @param userId - 사용자 ID
 * @param isSubscribed - 활성 구독 여부
 */
export async function pullGacha(
  userId: string,
  isSubscribed: boolean,
): Promise<GachaPullResult> {
  const today = getTodayKst();
  const limit = dailyLimit(isSubscribed);

  // 1) 한도 확인
  const [daily] = await db
    .select()
    .from(gachaDaily)
    .where(and(eq(gachaDaily.userId, userId), eq(gachaDaily.pullDate, today)))
    .limit(1);
  const used = daily?.pullCount ?? 0;
  if (used >= limit) {
    return { ok: false, quotaExceeded: true, remaining: 0, limit };
  }

  // 2) 카드 추첨
  const pool = getCardPool();
  const card = pool[Math.floor(Math.random() * pool.length)];

  // 3) 신규 여부
  const [existing] = await db
    .select({ id: collectionCards.id })
    .from(collectionCards)
    .where(
      and(
        eq(collectionCards.userId, userId),
        eq(collectionCards.cardId, card.id),
      ),
    )
    .limit(1);
  const isNew = !existing;

  if (isNew) {
    await db
      .insert(collectionCards)
      .values({
        userId,
        cardCategory: card.category,
        cardId: card.id,
      })
      .onConflictDoNothing();
  }

  // 4) 일일 카운트 갱신
  if (daily) {
    await db
      .update(gachaDaily)
      .set({ pullCount: daily.pullCount + 1 })
      .where(eq(gachaDaily.id, daily.id));
  } else {
    await db.insert(gachaDaily).values({
      userId,
      pullDate: today,
      pullCount: 1,
    });
  }

  // 갱신된 소장 카드 수
  const ownedCount = await getOwnedCount(userId);

  return {
    ok: true,
    card,
    isNew,
    remaining: Math.max(0, limit - used - 1),
    limit,
    ownedCount,
  };
}

/** 사용자가 소장한 모든 카드 ID Set. */
export async function getOwnedCardIds(userId: string): Promise<Set<string>> {
  const rows = await db
    .select({ cardId: collectionCards.cardId })
    .from(collectionCards)
    .where(eq(collectionCards.userId, userId));
  return new Set(rows.map((r) => r.cardId));
}

/** 소장 카드 총 개수. */
export async function getOwnedCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(collectionCards)
    .where(eq(collectionCards.userId, userId));
  return Number(row?.value ?? 0);
}
