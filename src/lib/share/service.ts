/**
 * 운세 공유 페이지 service.
 *
 * - 본인 운세를 10자 base62 토큰으로 봉인 → public URL.
 * - 토큰은 추측 불가 (crypto.randomBytes 기반, 62^10 ≈ 8.4×10^17 경우의 수).
 * - 같은 운세를 여러 번 봉인해도 별개 토큰 발급 (각각 다른 SNS 채널 추적용).
 * - views 카운트는 service_role 로 증가 (RLS UPDATE 차단).
 */
import "server-only";

import { randomBytes } from "crypto";
import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { sharedFortunes, type SharedFortune } from "@/db/schema";

const TOKEN_LENGTH = 10;
const ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/** 10자 base62 토큰 생성. crypto-safe, URL-safe. */
function generateToken(): string {
  const bytes = randomBytes(TOKEN_LENGTH);
  let out = "";
  for (let i = 0; i < TOKEN_LENGTH; i += 1) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

export interface FortuneSnapshot {
  title: string;
  content: string;
  score: number | null;
  luckyColor: string | null;
  luckyNumber: number | null;
  luckyDirection: string | null;
  fortuneDate: string;
  character: {
    id: string;
    name: string;
    title: string;
  };
}

export interface CreateShareInput {
  userId: string;
  category:
    | "general"
    | "love"
    | "money"
    | "career"
    | "health"
    | "study"
    | "zodiac"
    | "chinese_zodiac";
  snapshot: FortuneSnapshot;
  showDisplayName?: boolean;
}

/** 공유 토큰 생성. 충돌 시 5번까지 재시도. */
export async function createSharedFortune(
  input: CreateShareInput,
): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const id = generateToken();
    try {
      await db.insert(sharedFortunes).values({
        id,
        userId: input.userId,
        category: input.category,
        snapshot: input.snapshot as unknown as Record<string, unknown>,
        showDisplayName: input.showDisplayName ?? false,
      });
      return id;
    } catch (e) {
      // PK 충돌 (확률 매우 낮음 — 재시도)
      const message = e instanceof Error ? e.message : String(e);
      if (!message.includes("duplicate") && !message.includes("unique")) {
        throw e;
      }
    }
  }
  throw new Error("공유 토큰 생성 실패 — 잠시 후 다시 시도해 주세요.");
}

/** 공유 토큰으로 운세 조회 + view 증가. */
export async function getSharedFortune(
  id: string,
): Promise<SharedFortune | null> {
  // 토큰 형식 검증 (base62 10자)
  if (!/^[0-9A-Za-z]{10}$/.test(id)) return null;

  const rows = await db
    .select()
    .from(sharedFortunes)
    .where(eq(sharedFortunes.id, id))
    .limit(1);
  return rows[0] ?? null;
}

/** view 카운트 +1 (fire-and-forget). 본인 조회는 호출 안 함. */
export async function incrementViews(id: string): Promise<void> {
  if (!/^[0-9A-Za-z]{10}$/.test(id)) return;
  await db
    .update(sharedFortunes)
    .set({ views: sql`${sharedFortunes.views} + 1` })
    .where(eq(sharedFortunes.id, id));
}

/** 공유 URL 빌드. */
export function buildShareUrl(id: string, origin: string): string {
  return `${origin}/share/fortune/${id}`;
}
