/**
 * 가챠 기반 카드 컬렉션 서비스.
 *
 * - 일일 한도: free=1, lite=3, pro=5 (KST 기준)
 * - 131장 풀에서 균등 랜덤 (중복 가능, 중복은 카운트만 소모)
 * - 등급별 문답 보너스: common=0, rare=2, legendary=5
 * - 새 카드면 collection_cards 에 저장, 일일 카운트는 gacha_daily 에 누적
 */
import "server-only";

import { and, count, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { collectionCards, gachaDaily, usageQuotas } from "@/db/schema";
import { GACHA_DAILY_LIMITS, GACHA_RARITY_BONUS } from "@/lib/constants";
import { consumeBonusGacha, getStreak } from "@/lib/streak/service";
import {
  COLLECTION_BY_CATEGORY,
  type CollectionCardMeta,
  type CollectionCategory,
} from "@/lib/collection/cards-data";
import {
  getSubscriptionTier,
  type SubscriptionTier,
} from "@/lib/payment/subscription-state";

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
  /** 이번 뽑기로 얻은 문답 보너스 수. 0 이면 보너스 없음. */
  chatBonus: number;
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
  /** 스트릭 마일스톤 보너스 크레딧. */
  bonusCredits: number;
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

/** 구독 티어별 일일 한도. */
function dailyLimitForTier(tier: SubscriptionTier): number {
  return GACHA_DAILY_LIMITS[tier];
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
 */
export async function getTodayGachaStatus(
  userId: string,
): Promise<GachaStatus> {
  const today = getTodayKst();
  const tier = await getSubscriptionTier(userId);
  const limit = dailyLimitForTier(tier);
  const [row, streak] = await Promise.all([
    db
      .select({ pullCount: gachaDaily.pullCount })
      .from(gachaDaily)
      .where(and(eq(gachaDaily.userId, userId), eq(gachaDaily.pullDate, today)))
      .limit(1)
      .then((r) => r[0]),
    getStreak(userId),
  ]);
  const used = row?.pullCount ?? 0;
  return {
    used,
    remaining: Math.max(0, limit - used),
    limit,
    bonusCredits: streak?.bonusGachaCredits ?? 0,
  };
}

/**
 * 등급별 문답 보너스를 즉시 적용한다.
 *
 * 오늘 usageQuotas 행이 있으면 chatCount 를 보너스만큼 차감(GREATEST 0),
 * 없으면 무시 (어차피 0 이므로 한도 차감 효과가 없음).
 *
 * @param userId - 사용자 ID
 * @param today - YYYY-MM-DD (KST)
 * @param bonus - 추가 보너스 수
 */
async function applyChatBonus(
  userId: string,
  today: string,
  bonus: number,
): Promise<void> {
  if (bonus <= 0) return;
  await db
    .update(usageQuotas)
    .set({
      chatCount: sql`GREATEST(0, ${usageQuotas.chatCount} - ${bonus})`,
    })
    .where(
      and(
        eq(usageQuotas.userId, userId),
        eq(usageQuotas.usageDate, today),
      ),
    );
}

/**
 * 가챠 1회 실행.
 *
 * 1) 일일 한도 확인 → 초과면 quotaExceeded 반환 (보너스 크레딧 우선 소비 시도)
 * 2) 131장 풀에서 균등 랜덤 카드 1장 선택
 * 3) 신규 카드면 collection_cards INSERT (onConflictDoNothing)
 * 4) gacha_daily upsert 로 카운트 +1
 * 5) 카드 등급별 문답 보너스 즉시 적용
 *
 * @param userId - 사용자 ID
 */
export async function pullGacha(userId: string): Promise<GachaPullResult> {
  const today = getTodayKst();
  const tier = await getSubscriptionTier(userId);
  const limit = dailyLimitForTier(tier);

  // 1) 한도 확인 (기본 한도 초과 시 보너스 크레딧으로 대체)
  const [daily] = await db
    .select()
    .from(gachaDaily)
    .where(and(eq(gachaDaily.userId, userId), eq(gachaDaily.pullDate, today)))
    .limit(1);
  const used = daily?.pullCount ?? 0;

  let usedBonusCredit = false;
  if (used >= limit) {
    // 보너스 가챠 크레딧 소비 시도
    const consumed = await consumeBonusGacha(userId);
    if (!consumed) {
      return { ok: false, quotaExceeded: true, remaining: 0, limit };
    }
    usedBonusCredit = true;
    // 보너스로 진행 — 일일 카운트는 올리지 않음 (별도 크레딧 차감)
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

  // 4) 일일 카운트 갱신 (보너스 크레딧으로 진행한 경우는 제외)
  if (!usedBonusCredit) {
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
  }

  // 5) 등급별 문답 보너스 적용
  const chatBonus = GACHA_RARITY_BONUS[card.rarity] ?? 0;
  await applyChatBonus(userId, today, chatBonus);

  // 갱신된 소장 카드 수
  const ownedCount = await getOwnedCount(userId);

  const newUsed = usedBonusCredit ? used : used + 1;
  return {
    ok: true,
    card,
    isNew,
    remaining: Math.max(0, limit - newUsed),
    limit,
    ownedCount,
    chatBonus,
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
