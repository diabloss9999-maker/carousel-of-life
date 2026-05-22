/**
 * 운명 로그 서비스.
 *
 * 사용자의 모든 흔적을 하나의 타임라인으로 통합한다.
 * 단순한 기록이 아니라 "운명의 패턴"을 읽는 공간.
 */
import "server-only";

import { and, desc, eq, gte } from "drizzle-orm";
import { chatSessions } from "@/db/schema";

import { db } from "@/db";
import {
  dailyFortunes,
  tarotReadings,
  runeReadings,
  lenormandReadings,
  compatibilityReadings,
  moodEntries,
  characterAffinities,
} from "@/db/schema";
import { calcCrackLevel } from "@/lib/crack/service";
import { CHARACTERS } from "@/lib/chat/characters";
import type { CrackLevel } from "@/lib/crack/service";

export interface FateLogEntry {
  id: string;
  date: Date;
  type: "fortune" | "tarot" | "rune" | "lenormand" | "compatibility" | "mood" | "affinity" | "crack";
  title: string;
  detail: string;
  /** 세계관 언어로 표현된 의미 */
  significance: string;
  /** 반복 패턴 여부 */
  isPattern?: boolean;
}

export interface FateSummary {
  totalEntries: number;
  currentStreak: number;
  dominantMood: string | null;
  mostCalledCharacter: string | null;
  mostCalledCharacterCount: number;
  crackLevel: CrackLevel;
  patterns: string[];
  /** 서사 통계 */
  narrative: {
    totalDaysVisited: number;
    totalCardsDrawn: number;
    totalMoodEntries: number;
    /** 가장 자주 나온 타로 카드 */
    repeatedCard: string | null;
    repeatedCardCount: number;
    /** 어두운 날 / 전체 기록 비율 */
    darkDayRatio: number;
    /** 각 캐릭터 대화 수 */
    characterCounts: { name: string; count: number }[];
  };
}

function todayMinus(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

/** 최근 30일 운명 로그 */
export async function getFateLog(userId: string): Promise<FateLogEntry[]> {
  const since = todayMinus(30);
  const entries: FateLogEntry[] = [];

  const [fortunes, tarots, runes, lenormands, compats, moods, affinities] =
    await Promise.all([
      // 운세 (최근 10개)
      db.select().from(dailyFortunes)
        .where(and(eq(dailyFortunes.userId, userId), gte(dailyFortunes.createdAt, since)))
        .orderBy(desc(dailyFortunes.createdAt))
        .limit(10),
      // 타로
      db.select().from(tarotReadings)
        .where(and(eq(tarotReadings.userId, userId), gte(tarotReadings.createdAt, since)))
        .orderBy(desc(tarotReadings.createdAt))
        .limit(15),
      // 룬
      db.select().from(runeReadings)
        .where(and(eq(runeReadings.userId, userId), gte(runeReadings.createdAt, since)))
        .orderBy(desc(runeReadings.createdAt))
        .limit(10),
      // 르노르망
      db.select().from(lenormandReadings)
        .where(and(eq(lenormandReadings.userId, userId), gte(lenormandReadings.createdAt, since)))
        .orderBy(desc(lenormandReadings.createdAt))
        .limit(10),
      // 궁합
      db.select().from(compatibilityReadings)
        .where(and(eq(compatibilityReadings.userId, userId), gte(compatibilityReadings.createdAt, since)))
        .orderBy(desc(compatibilityReadings.createdAt))
        .limit(5),
      // 감정
      db.select().from(moodEntries)
        .where(and(eq(moodEntries.userId, userId), gte(moodEntries.createdAt, since)))
        .orderBy(desc(moodEntries.createdAt))
        .limit(30),
      // 친밀도
      db.select().from(characterAffinities)
        .where(eq(characterAffinities.userId, userId)),
    ]);

  const moodLabel: Record<string, string> = {
    great: "최고야",
    good:  "좋아",
    neutral: "그냥 그래",
    tough: "힘드네",
    hard:  "많이 힘들어",
  };

  const moodSignificance: Record<string, string> = {
    great:   "기운이 충만했던 날. 경계의 균형이 맞았어.",
    good:    "잔잔하게 좋은 날. 흔들림 없이 서 있었어.",
    neutral: "그냥 흘러간 날. 그것도 선택이야.",
    tough:   "버텼던 날. 균열이 조금 깊어졌어.",
    hard:    "힘들었던 날. 경계가 흔들렸어. 하지만 여기 있잖아.",
  };

  // 운세 로그
  for (const f of fortunes) {
    entries.push({
      id: `f-${f.id}`,
      date: f.createdAt,
      type: "fortune",
      title: f.title,
      detail: `${f.category} · ${f.score ?? "?"}점`,
      significance: f.score && f.score >= 75
        ? "별의 흐름이 맞았던 날이야."
        : f.score && f.score < 45
          ? "별의 흐름이 거칠었던 날. 그래도 넘겼어."
          : "평범한 하루의 흔적.",
    });
  }

  // 타로 로그
  for (const t of tarots) {
    const cards = Array.isArray(t.cards) ? t.cards as { nameKo?: string }[] : [];
    const cardNames = cards.map((c) => c?.nameKo ?? "").filter(Boolean).join(" · ");
    entries.push({
      id: `t-${t.id}`,
      date: t.createdAt,
      type: "tarot",
      title: cardNames || "타로 뽑기",
      detail: t.spreadType,
      significance: "카드가 선택한 것인지, 네가 선택한 것인지.",
    });
  }

  // 룬 로그
  for (const r of runes) {
    entries.push({
      id: `r-${r.id}`,
      date: r.createdAt,
      type: "rune",
      title: "룬의 계시",
      detail: r.spreadType,
      significance: "고대 문자가 뭔가를 말하려 했어.",
    });
  }

  // 르노르망 로그
  for (const l of lenormands) {
    entries.push({
      id: `l-${l.id}`,
      date: l.createdAt,
      type: "lenormand",
      title: "르노르망 리딩",
      detail: l.spreadType,
      significance: "일상의 흐름 속에 숨겨진 뭔가.",
    });
  }

  // 궁합 로그
  for (const c of compats) {
    entries.push({
      id: `c-${c.id}`,
      date: c.createdAt,
      type: "compatibility",
      title: c.partnerName ? `${c.partnerName}과의 인연` : "궁합 풀이",
      detail: `${c.score ?? "?"}점`,
      significance: "두 운명이 교차한 순간.",
    });
  }

  // 감정 로그
  for (const m of moods) {
    entries.push({
      id: `m-${m.id}`,
      date: m.createdAt,
      type: "mood",
      title: moodLabel[m.mood] ?? m.mood,
      detail: m.note ?? "",
      significance: moodSignificance[m.mood] ?? "감정의 흔적.",
    });
  }

  // 친밀도 마일스톤 로그 (points 10, 30, 60, 100 도달 시)
  const MILESTONES = [10, 30, 60, 100];
  for (const a of affinities) {
    const char = CHARACTERS[a.characterId as keyof typeof CHARACTERS];
    if (!char) continue;
    for (const m of MILESTONES) {
      if (a.points >= m) {
        entries.push({
          id: `a-${a.id}-${m}`,
          date: a.updatedAt,
          type: "affinity",
          title: `${char.name}과의 인연 — ${m}회`,
          detail: `${char.title}`,
          significance:
            m >= 100 ? `${char.name}이 이제 당신을 운명적 존재로 인식하고 있어.`
            : m >= 60 ? `${char.name}이 당신에게 진심을 조금씩 허락하고 있어.`
            : m >= 30 ? `${char.name}이 당신을 기억하기 시작했어.`
            : `${char.name}이 당신의 존재를 알아챘어.`,
        });
      }
    }
  }

  // 날짜 정렬
  return entries.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 50);
}

/** 운명 요약 통계 */
export async function getFateSummary(
  userId: string,
  crackScore: number,
): Promise<FateSummary> {
  const since30 = todayMinus(30);

  const [moodRows, tarotRows, sessionRows, runeRows, lenormandRows] =
    await Promise.all([
      db.select().from(moodEntries)
        .where(and(eq(moodEntries.userId, userId), gte(moodEntries.createdAt, since30)))
        .orderBy(desc(moodEntries.createdAt)).limit(30),
      db.select().from(tarotReadings)
        .where(and(eq(tarotReadings.userId, userId), gte(tarotReadings.createdAt, since30)))
        .limit(30),
      db.select({ character: chatSessions.character })
        .from(chatSessions)
        .where(and(eq(chatSessions.userId, userId), gte(chatSessions.createdAt, since30))),
      db.select().from(runeReadings)
        .where(and(eq(runeReadings.userId, userId), gte(runeReadings.createdAt, since30)))
        .limit(20),
      db.select().from(lenormandReadings)
        .where(and(eq(lenormandReadings.userId, userId), gte(lenormandReadings.createdAt, since30)))
        .limit(20),
    ]);

  // 지배적 감정
  const moodCount: Record<string, number> = {};
  for (const m of moodRows) moodCount[m.mood] = (moodCount[m.mood] ?? 0) + 1;
  const dominantMood = Object.entries(moodCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // 가장 많이 대화한 캐릭터 (세션 기반)
  const sessionCharCount: Record<string, number> = {};
  for (const s of sessionRows) {
    const ch = s.character ?? "witch";
    sessionCharCount[ch] = (sessionCharCount[ch] ?? 0) + 1;
  }
  const sortedChars = Object.entries(sessionCharCount).sort((a, b) => b[1] - a[1]);
  const topCharEntry = sortedChars[0];
  const mostCalledCharacter = topCharEntry
    ? CHARACTERS[topCharEntry[0] as keyof typeof CHARACTERS]?.name ?? null
    : null;
  const mostCalledCharacterCount = topCharEntry?.[1] ?? 0;

  // 캐릭터별 세션 수
  const characterCounts = sortedChars.map(([id, cnt]) => ({
    name: CHARACTERS[id as keyof typeof CHARACTERS]?.name ?? id,
    count: cnt,
  }));

  // 패턴 감지
  const patterns: string[] = [];
  const darkCount = moodRows.filter((m) => m.mood === "tough" || m.mood === "hard").length;
  if (darkCount >= 5) patterns.push(`30일 중 ${darkCount}일이 힘들었어.`);

  // 타로 반복 카드 감지
  const cardNames: Record<string, number> = {};
  for (const t of tarotRows) {
    const cards = Array.isArray(t.cards) ? t.cards as { nameKo?: string }[] : [];
    for (const c of cards) {
      if (c?.nameKo) cardNames[c.nameKo] = (cardNames[c.nameKo] ?? 0) + 1;
    }
  }
  const repeatedCardEntry = Object.entries(cardNames).sort((a, b) => b[1] - a[1])[0];
  const repeatedCard = repeatedCardEntry && repeatedCardEntry[1] >= 3 ? repeatedCardEntry[0] : null;
  const repeatedCardCount = repeatedCardEntry?.[1] ?? 0;
  if (repeatedCard) patterns.push(`'${repeatedCard}' 카드가 최근 ${repeatedCardCount}번 나왔어.`);

  const totalCardsDrawn = tarotRows.length + runeRows.length + lenormandRows.length;
  const totalDaysVisited = moodRows.length; // 감정 기록 = 방문 일수 근사
  const darkDayRatio = moodRows.length > 0 ? darkCount / moodRows.length : 0;

  return {
    totalEntries: moodRows.length + tarotRows.length + runeRows.length,
    currentStreak: 0,
    dominantMood,
    mostCalledCharacter,
    mostCalledCharacterCount,
    crackLevel: calcCrackLevel(crackScore),
    patterns,
    narrative: {
      totalDaysVisited,
      totalCardsDrawn,
      totalMoodEntries: moodRows.length,
      repeatedCard,
      repeatedCardCount,
      darkDayRatio,
      characterCounts,
    },
  };
}
