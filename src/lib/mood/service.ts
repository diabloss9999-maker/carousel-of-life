/**
 * 감정 기록 서비스.
 * 하루 1회 기분을 기록하고, AI 컨텍스트에 활용된다.
 */
import "server-only";

import { and, desc, eq, gte } from "drizzle-orm";

import { db } from "@/db";
import { moodEntries, type MoodEntry } from "@/db/schema";

export const MOODS = [
  { key: "great",   label: "최고야",   symbol: "✦" },
  { key: "good",    label: "좋아",     symbol: "○" },
  { key: "neutral", label: "그냥 그래", symbol: "—" },
  { key: "tough",   label: "힘드네",   symbol: "△" },
  { key: "hard",    label: "많이 힘들어", symbol: "▼" },
] as const;

export type MoodKey = (typeof MOODS)[number]["key"];

function todayKst(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

/** 오늘 감정 기록 조회 */
export async function getTodayMood(userId: string): Promise<MoodEntry | null> {
  const [row] = await db
    .select()
    .from(moodEntries)
    .where(
      and(
        eq(moodEntries.userId, userId),
        eq(moodEntries.entryDate, todayKst()),
      ),
    )
    .limit(1);
  return row ?? null;
}

/** 감정 기록 저장 (이미 있으면 업데이트) */
export async function saveMood(opts: {
  userId: string;
  mood: MoodKey;
  note?: string;
  source?: string;
}): Promise<MoodEntry> {
  const today = todayKst();
  const existing = await getTodayMood(opts.userId);

  if (existing) {
    const [updated] = await db
      .update(moodEntries)
      .set({ mood: opts.mood, note: opts.note ?? null })
      .where(eq(moodEntries.id, existing.id))
      .returning();
    return updated;
  }

  const [inserted] = await db
    .insert(moodEntries)
    .values({
      userId: opts.userId,
      entryDate: today,
      mood: opts.mood,
      note: opts.note ?? null,
      source: opts.source ?? "fortune",
    })
    .returning();
  return inserted;
}

/** 최근 N일 감정 기록 */
export async function getRecentMoods(
  userId: string,
  days = 7,
): Promise<MoodEntry[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });

  return db
    .select()
    .from(moodEntries)
    .where(
      and(
        eq(moodEntries.userId, userId),
        gte(moodEntries.entryDate, sinceStr),
      ),
    )
    .orderBy(desc(moodEntries.entryDate))
    .limit(days);
}

/** AI 컨텍스트용 감정 요약 문자열 */
export function buildMoodContext(moods: MoodEntry[]): string {
  if (moods.length === 0) return "";

  const moodMap: Record<string, string> = {
    great: "최고", good: "좋음", neutral: "평범", tough: "힘듦", hard: "매우 힘듦",
  };

  const lines = moods.slice(0, 5).map((m) => {
    const label = moodMap[m.mood] ?? m.mood;
    const note = m.note ? ` (${m.note})` : "";
    return `${m.entryDate}: ${label}${note}`;
  });

  return `\n[최근 감정 기록]\n${lines.join("\n")}`;
}
