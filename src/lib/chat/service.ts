/**
 * 주술사 문답 (채팅) 비즈니스 로직.
 *
 * - 세션은 무한 생성 가능
 * - 메시지(질문) 단위로 일일 한도 체크
 * - AI 응답은 스트리밍 — service 는 prepare 단계까지만 담당
 */
import "server-only";

import { and, asc, desc, eq, gte } from "drizzle-orm";

import { db } from "@/db";
import {
  chatMessages,
  chatSessions,
  dailyFortunes,
  personalityCareerFit,
  personalityStressProfile,
  personalityTripleAnalysis,
  type ChatMessage,
  type ChatSession,
  type Profile,
} from "@/db/schema";
import { buildChatContext, type ChatEnrichment } from "@/lib/ai/prompts";
import { getRecentMoods, buildMoodContext } from "@/lib/mood/service";
import { buildObservationContext, getCurrentHourKst } from "@/lib/observe/service";
import { getStreak } from "@/lib/streak/service";
import {
  buildCharacterSystemPrompt,
  DEFAULT_CHARACTER,
  type CharacterId,
} from "@/lib/chat/characters";
import { ensureSajuCalculated } from "@/lib/saju/calculate";
import { getTodayInSeoul } from "@/lib/usage/quota";
import { FREE_DAILY_LIMITS } from "@/lib/constants";
import { checkAndIncrementQuota } from "@/lib/usage/quota";

/**
 * 새 세션 생성 (빈 세션, 첫 메시지는 별도로).
 */
export async function createSession(opts: {
  userId: string;
  title?: string;
  character?: string;
}): Promise<ChatSession> {
  const [row] = await db
    .insert(chatSessions)
    .values({
      userId: opts.userId,
      title: opts.title ?? "새로운 문답",
      character: opts.character ?? DEFAULT_CHARACTER,
    })
    .returning();
  return row;
}

/**
 * 해당 캐릭터의 가장 최근 세션을 찾아 이어가거나, 없으면 새로 만든다.
 *
 * 동일 주술사를 다시 선택했을 때 이전 대화를 자연스럽게 이어가기 위함.
 */
export async function findOrCreateSessionForCharacter(opts: {
  userId: string;
  character: string;
}): Promise<{ session: ChatSession; resumed: boolean }> {
  const [recent] = await db
    .select()
    .from(chatSessions)
    .where(
      and(
        eq(chatSessions.userId, opts.userId),
        eq(chatSessions.character, opts.character),
      ),
    )
    .orderBy(desc(chatSessions.createdAt))
    .limit(1);

  if (recent) {
    return { session: recent, resumed: true };
  }

  const created = await createSession({
    userId: opts.userId,
    character: opts.character,
  });
  return { session: created, resumed: false };
}

/**
 * 사용자의 세션 목록 (최신순).
 */
export async function listSessions(
  userId: string,
  limit = 30,
): Promise<ChatSession[]> {
  return db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.userId, userId))
    .orderBy(desc(chatSessions.lastMessageAt))
    .limit(limit);
}

/**
 * 오늘(KST 기준) 생성된 채팅 세션만 반환.
 */
export async function listTodaySessions(userId: string): Promise<ChatSession[]> {
  const todayKst = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
  const todayStartUtc = new Date(`${todayKst}T00:00:00+09:00`);

  return db
    .select()
    .from(chatSessions)
    .where(and(eq(chatSessions.userId, userId), gte(chatSessions.createdAt, todayStartUtc)))
    .orderBy(desc(chatSessions.lastMessageAt));
}

/**
 * 특정 세션 + 본인 소유 검증. 메시지는 별도 함수로.
 */
export async function getSessionForUser(opts: {
  sessionId: string;
  userId: string;
}): Promise<ChatSession | null> {
  const [row] = await db
    .select()
    .from(chatSessions)
    .where(
      and(
        eq(chatSessions.id, opts.sessionId),
        eq(chatSessions.userId, opts.userId),
      ),
    )
    .limit(1);
  return row ?? null;
}

/**
 * 세션의 메시지 history (오래된 → 최신).
 */
export async function getSessionMessages(
  sessionId: string,
): Promise<ChatMessage[]> {
  return db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(asc(chatMessages.createdAt));
}

/**
 * 세션 삭제 (본인 소유만).
 */
export async function deleteSession(opts: {
  sessionId: string;
  userId: string;
}): Promise<boolean> {
  const result = await db
    .delete(chatSessions)
    .where(
      and(
        eq(chatSessions.id, opts.sessionId),
        eq(chatSessions.userId, opts.userId),
      ),
    )
    .returning({ id: chatSessions.id });
  return result.length > 0;
}

/**
 * 세션 제목 자동 갱신 (첫 사용자 메시지 기준).
 */
export async function maybeAutoTitle(opts: {
  sessionId: string;
  firstUserMessage: string;
}): Promise<void> {
  // 첫 메시지의 앞 24자를 제목으로.
  const candidate = opts.firstUserMessage.trim().slice(0, 24);
  if (!candidate) return;

  await db
    .update(chatSessions)
    .set({
      title: candidate.length === opts.firstUserMessage.trim().length
        ? candidate
        : `${candidate}…`,
      lastMessageAt: new Date(),
    })
    .where(eq(chatSessions.id, opts.sessionId));
}

/**
 * 메시지 전송 준비:
 *
 * 1. 한도 체크
 * 2. 사주 보장
 * 3. user message DB 저장
 * 4. AI 에 전달할 system + messages 배열 구성
 *
 * 실제 AI 호출/스트림은 호출자(Route Handler)가 처리한다.
 */
export interface PrepareSendResult {
  ok: true;
  profile: Profile;
  systemPrompt: string;
  /** Anthropic API 에 그대로 넘길 messages 배열. */
  messages: { role: "user" | "assistant"; content: string }[];
  userMessageId: string;
}

export interface PrepareSendQuotaError {
  ok: false;
  reason: "quota_exceeded";
  max: number;
}

export interface PrepareSendOtherError {
  ok: false;
  reason: "saju_failed" | "session_not_found";
  message: string;
}

export type PrepareSendOutcome =
  | PrepareSendResult
  | PrepareSendQuotaError
  | PrepareSendOtherError;

export async function prepareSendMessage(opts: {
  sessionId: string;
  userMessage: string;
  profile: Profile;
}): Promise<PrepareSendOutcome> {
  // 0) 세션 본인 소유 검증.
  const session = await getSessionForUser({
    sessionId: opts.sessionId,
    userId: opts.profile.userId,
  });
  if (!session) {
    return {
      ok: false,
      reason: "session_not_found",
      message: "해당 세션을 찾지 못했어요.",
    };
  }

  // 1) 한도 체크.
  const quota = await checkAndIncrementQuota({
    userId: opts.profile.userId,
    kind: "chat",
    max: FREE_DAILY_LIMITS.chat,
  });
  if (!quota.ok) {
    return { ok: false, reason: "quota_exceeded", max: quota.max };
  }

  // 2) 사주 보장.
  let profile: Profile;
  try {
    profile = await ensureSajuCalculated(opts.profile);
  } catch (e) {
    return {
      ok: false,
      reason: "saju_failed",
      message:
        "사주를 풀이할 별의 흐름을 읽지 못했어요: " +
        (e instanceof Error ? e.message : "알 수 없는 원인"),
    };
  }

  // 3) user message 저장.
  const [savedUserMessage] = await db
    .insert(chatMessages)
    .values({
      sessionId: opts.sessionId,
      userId: profile.userId,
      role: "user",
      content: opts.userMessage,
    })
    .returning();

  // 4) AI 에 전달할 history 구성.
  const history = await getSessionMessages(opts.sessionId);
  const apiMessages = history
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  // 첫 사용자 메시지면 system 에 사용자 컨텍스트 포함.
  const isFirstTurn =
    history.filter((m) => m.role === "user").length === 1; // 방금 저장한 것 포함

  const characterId = (session.character ?? DEFAULT_CHARACTER) as CharacterId;

  // 첫 턴에만 전체 컨텍스트 로드 — 실패해도 기본 컨텍스트로 폴백
  let userCtx = "";
  if (isFirstTurn) {
    try {
      const today = getTodayInSeoul();
      const results = await Promise.allSettled([
        db.select().from(personalityTripleAnalysis)
          .where(eq(personalityTripleAnalysis.userId, profile.userId)).limit(1),
        db.select().from(personalityStressProfile)
          .where(eq(personalityStressProfile.userId, profile.userId)).limit(1),
        db.select().from(personalityCareerFit)
          .where(eq(personalityCareerFit.userId, profile.userId)).limit(1),
        db.select().from(dailyFortunes)
          .where(and(
            eq(dailyFortunes.userId, profile.userId),
            eq(dailyFortunes.fortuneDate, today),
            eq(dailyFortunes.category, "general"),
          )).limit(1),
        getRecentMoods(profile.userId, 7),
        getStreak(profile.userId),
      ]);

      const get = <T>(r: PromiseSettledResult<T[]>): T | null =>
        r.status === "fulfilled" ? (r.value[0] ?? null) : null;
      const getAll = <T>(r: PromiseSettledResult<T[]>): T[] =>
        r.status === "fulfilled" ? r.value : [];

      // 사주 심층 분석 — 핵심 필드만 짧게 (토큰 절약)
      const rawSaju = profile.sajuDeepReading as Record<string, string> | null;
      const sajuDeep = rawSaju
        ? {
            personality: rawSaju.personality?.slice(0, 200) ?? null,
            strengths:   rawSaju.strengths?.slice(0, 150) ?? null,
            cautions:    rawSaju.cautions?.slice(0, 150) ?? null,
            loveStyle:   rawSaju.loveStyle?.slice(0, 150) ?? null,
            lifeFlow:    rawSaju.lifeFlow?.slice(0, 200) ?? null,
          }
        : null;

      const tripleData  = get(results[0] as PromiseSettledResult<typeof personalityTripleAnalysis.$inferSelect[]>);
      const stressData  = get(results[1] as PromiseSettledResult<typeof personalityStressProfile.$inferSelect[]>);
      const careerData  = get(results[2] as PromiseSettledResult<typeof personalityCareerFit.$inferSelect[]>);
      const fortuneData = get(results[3] as PromiseSettledResult<typeof dailyFortunes.$inferSelect[]>);
      const moodData    = getAll(results[4] as PromiseSettledResult<import("@/db/schema").MoodEntry[]>);
      const streakResult = results[5] as PromiseSettledResult<import("@/db/schema").Streak | null>;
      const streak = streakResult.status === "fulfilled" ? streakResult.value : null;
      const moodCtx     = buildMoodContext(moodData);

      // 관측 메시지 — 사용자 행동 패턴을 캐릭터에게 암시적으로 전달
      const todayStr = getTodayInSeoul();
      const lastCheckIn = streak?.lastCheckIn ?? null;
      const wasReset = lastCheckIn !== null && lastCheckIn !== todayStr &&
        Math.round((new Date(todayStr).getTime() - new Date(lastCheckIn).getTime()) / 86400000) > 1;

      const observationCtx = buildObservationContext({
        characterId,
        hourKst: getCurrentHourKst(),
        recentMoods: moodData,
        currentStreak: streak?.currentStreak ?? 0,
        wasReset,
      });

      const enrichment: ChatEnrichment = {
        sajuDeep:          sajuDeep,
        personalityTriple: tripleData?.data as Record<string, unknown> | null,
        personalityStress: stressData?.data as Record<string, unknown> | null,
        personalityCareer: careerData?.data as Record<string, unknown> | null,
        todayFortune:      fortuneData?.content?.slice(0, 150) ?? null,
        moodHistory:       moodCtx || null,
        observation:       observationCtx || null,
      };

      userCtx = buildChatContext(profile, enrichment);
    } catch {
      // enrichment 실패 시 기본 컨텍스트만 사용
      userCtx = buildChatContext(profile, {});
    }
  }

  const systemPrompt = isFirstTurn
    ? buildCharacterSystemPrompt(characterId, userCtx)
    : buildCharacterSystemPrompt(characterId, "");

  // 첫 턴이면 자동으로 제목도 짧게.
  if (isFirstTurn) {
    await maybeAutoTitle({
      sessionId: opts.sessionId,
      firstUserMessage: opts.userMessage,
    });
  }

  return {
    ok: true,
    profile,
    systemPrompt,
    messages: apiMessages,
    userMessageId: savedUserMessage.id,
  };
}

/**
 * AI 응답을 메시지로 저장 + 세션 last_message_at 업데이트.
 */
export async function saveAssistantMessage(opts: {
  sessionId: string;
  userId: string;
  content: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
}): Promise<void> {
  await db.insert(chatMessages).values({
    sessionId: opts.sessionId,
    userId: opts.userId,
    role: "assistant",
    content: opts.content,
    tokenInput: opts.inputTokens,
    tokenOutput: opts.outputTokens,
    model: opts.model,
  });

  await db
    .update(chatSessions)
    .set({ lastMessageAt: new Date() })
    .where(eq(chatSessions.id, opts.sessionId));
}
