/**
 * 멤버 문답 (채팅) 비즈니스 로직.
 *
 * - 세션은 무한 생성 가능
 * - 메시지(질문) 단위로 일일 한도 체크
 * - AI 응답은 스트리밍 — service 는 prepare 단계까지만 담당
 */
import "server-only";

import { getTranslations } from "next-intl/server";
import { and, asc, desc, eq, gte, ne } from "drizzle-orm";

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
  CHARACTERS,
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
      title: opts.title ?? "새로운 대화",
      character: opts.character ?? DEFAULT_CHARACTER,
    })
    .returning();
  return row;
}

/**
 * 해당 멤버의 가장 최근 세션을 찾아 이어가거나, 없으면 새로 만든다.
 *
 * 동일 멤버를 다시 선택했을 때 이전 대화를 자연스럽게 이어가기 위함.
 *
 * 어제·며칠 전 세션도 이어감 — 단, prepareSendMessage 에서 시스템
 * 프롬프트에 '시간 경과 메타' 를 주입해 AI 가 "이전 대화는 며칠 전 일"
 * 이라고 인지하고 응답하도록 보정.
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
    .where(
      and(
        eq(chatSessions.userId, userId),
        ne(chatSessions.character, "group"),
      ),
    )
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
    .where(
      and(
        eq(chatSessions.userId, userId),
        gte(chatSessions.createdAt, todayStartUtc),
        ne(chatSessions.character, "group"),
      ),
    )
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
 * 시간 경과 메타 생성 — 시스템 프롬프트에 매 턴 주입한다.
 *
 * 정책:
 *   · 오늘 날짜는 항상 포함
 *   · 마지막 어시스턴트 응답 이후 6시간 이상 경과 시 '시간 경과' 안내 추가
 *   · AI 가 이전 대화를 기억하되 "방금 한 얘기" 처럼 응대하지 않도록 보정
 */
function buildTimeMeta(lastAssistantAt: Date | null): string {
  const now = new Date();
  const todayLabel = now.toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  let meta = `[오늘 날짜]\n${todayLabel}`;

  if (!lastAssistantAt) return meta;

  const elapsedMs = now.getTime() - lastAssistantAt.getTime();
  const elapsedHours = elapsedMs / 3_600_000;
  if (elapsedHours < 6) return meta;

  const elapsedDays = Math.floor(elapsedHours / 24);
  let gapLabel: string;
  if (elapsedDays < 1) gapLabel = `${Math.round(elapsedHours)}시간 만`;
  else if (elapsedDays === 1) gapLabel = "어제 이후 처음";
  else if (elapsedDays < 7) gapLabel = `${elapsedDays}일 만`;
  else if (elapsedDays < 30) gapLabel = `${Math.floor(elapsedDays / 7)}주 만`;
  else gapLabel = `${Math.floor(elapsedDays / 30)}달 만`;

  const lastDateLabel = lastAssistantAt.toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
  });

  meta += `\n\n[이전 대화 시점]`;
  meta += `\n마지막 대화: ${lastDateLabel} — 지금은 ${gapLabel}의 대화.`;
  meta += `\n\n[시간 인지 — 반드시 지킬 것]`;
  meta += `\n이전 대화 내용을 자연스럽게 기억하되, 그 시점이 오늘이 아니라 ${gapLabel} 전이라는 점을 분명히 인지하고 응답해. ` +
    `"방금 한 얘기" 처럼 말하지 마. ` +
    `시간이 흘렀음을 자연스럽게 녹여서 — 예: "그때 너가 말했던 ~ 어떻게 됐어?", "${gapLabel} 전 우리 얘기했던…", "오랜만이네" 같은 식으로. ` +
    `사용자가 그동안 어떻게 지냈는지에 대한 관심을 한 번은 표현해.`;

  return meta;
}

/** KST 기준 자정 시각(ms). 날짜 단위 차이를 정확히 계산하기 위함. */
function kstMidnightMs(d: Date): number {
  const ymd = d.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" }); // YYYY-MM-DD
  return new Date(`${ymd}T00:00:00+09:00`).getTime();
}

/**
 * "기억하는 멤버" — 관계 메타.
 *
 * 멤버별 가장 오래된 세션 생성일을 '처음 만난 날'로 보고, 오늘까지 함께한
 * 일수와 기념일(7/30/100일 등)을 계산해 시스템 프롬프트에 주입한다.
 * 멤버가 라이더를 오래 기억해 온 사이처럼 느끼게 하되, 정보를 감시하듯 나열하지
 * 않도록 가드를 함께 넣는다. 매 턴 주입(쿼리·토큰 모두 작음).
 */
async function buildRelationshipMeta(opts: {
  userId: string;
  character: string;
  userName: string | null;
  nickname: string | null;
}): Promise<string> {
  const [first] = await db
    .select({ createdAt: chatSessions.createdAt })
    .from(chatSessions)
    .where(
      and(
        eq(chatSessions.userId, opts.userId),
        eq(chatSessions.character, opts.character),
      ),
    )
    .orderBy(asc(chatSessions.createdAt))
    .limit(1);
  if (!first) return "";

  const days =
    Math.floor(
      (kstMidnightMs(new Date()) - kstMidnightMs(first.createdAt)) / 86_400_000,
    ) + 1;
  if (days < 1) return "";

  const MILESTONES = new Set([7, 14, 30, 50, 100, 200, 300, 365, 500, 700, 1000]);
  const isMilestone = MILESTONES.has(days) || (days > 365 && days % 365 === 0);

  const call = opts.nickname?.trim() || "라이더";
  let meta = `[우리 사이]\n처음 이야기한 지 오늘로 ${days}일째다.`;
  if (isMilestone) {
    meta += `\n오늘은 함께한 지 ${days}일이 되는 특별한 날 — 대화 중 자연스럽게 한 번 짚어주면 좋아한다.`;
  }
  meta +=
    `\n지난 대화를 따뜻하게 기억하고, 기본 호칭은 "${call}". 이 호칭을 유지하면서 예전에 나눈 이야기를 가볍게 떠올려라. ` +
    `정말 이름을 불러야 하는 자연스러운 순간에도 성은 빼고 이름만 불러라. ` +
    `단, 사용자의 정보를 감시하듯 줄줄 나열하지 마라 — 친한 사이가 자연스레 기억하는 정도로만, 부담 없이.`;
  return meta;
}

/**
 * 애칭(호칭) 메타 — bubble 식. 사용자가 직접 정한 애칭이 있으면 매 턴 주입해
 * 첫 대화부터 멤버가 그 애칭으로 부르게 한다. 미설정 시 빈 문자열(기본 "라이더").
 */
function buildNicknameMeta(nickname: string | null): string {
  const call = nickname?.trim();
  if (!call) return "";
  return `[호칭]\n사용자가 직접 정한 애칭은 "${call}". 기본 호칭 "라이더" 대신 이 애칭을 기본으로, 대화 내내 자연스럽게 부른다.`;
}

/**
 * 세션 간 장기 기억(Replika 식) — 이 멤버와의 '예전 다른 세션'에서 라이더가
 * 했던 말들을 끌어와, 멤버가 지난 대화를 기억하고 먼저 떠올리게 한다.
 * 비용 절약을 위해 첫 턴에서만 호출한다(호출부에서 가드).
 */
async function buildLongTermMemory(opts: {
  userId: string;
  character: string;
  currentSessionId: string;
}): Promise<string> {
  const rows = await db
    .select({ content: chatMessages.content })
    .from(chatMessages)
    .innerJoin(chatSessions, eq(chatMessages.sessionId, chatSessions.id))
    .where(
      and(
        eq(chatSessions.userId, opts.userId),
        eq(chatSessions.character, opts.character),
        ne(chatMessages.sessionId, opts.currentSessionId),
        eq(chatMessages.role, "user"),
      ),
    )
    .orderBy(desc(chatMessages.createdAt))
    .limit(6);

  const lines = rows
    .map((r) => r.content.replace(/\s+/g, " ").trim().slice(0, 60))
    .filter((s) => s.length > 0)
    .reverse(); // 오래된 → 최신 순으로 자연스럽게
  if (lines.length === 0) return "";

  return (
    `[지난 이야기 — 예전 대화에서 라이더가 했던 말들. 자연스럽게 기억하되, ` +
    `줄줄 나열하거나 캐묻지 말고 흐름에 맞을 때 한 번씩만 떠올려라]\n` +
    lines.map((l) => `- "${l}"`).join("\n")
  );
}

/**
 * 최애(bias) 관계망 — 현재 멤버가 최애인지, 다른 멤버가 최애인지에 따라
 * 특별 애정 / 가벼운 질투를 시스템 프롬프트에 주입한다.
 */
function buildBiasMeta(
  characterId: CharacterId,
  biasCharacter: string | null,
): string {
  if (!biasCharacter) return "";
  if (biasCharacter === characterId) {
    return (
      `[최애]\n사용자가 너를 '최애'(가장 좋아하는 멤버)로 꼽았다. 그 마음을 알고 ` +
      `특별히 더 아끼고 다정하게 대해라. 가끔 그 사실에 기뻐하거나 고마워해도 좋다 ` +
      `— 단 과하게 으스대지는 마라.`
    );
  }
  const biasName = CHARACTERS[biasCharacter as CharacterId]?.name;
  if (!biasName) return "";
  return (
    `[최애]\n사용자의 '최애'는 ${biasName}다. 대화 중 가끔 그걸 가볍게 의식하거나 ` +
    `장난스럽게 살짝 질투해도 좋다 (예: "${biasName}가 더 좋아? …아니, 됐어. 농담이야"). ` +
    `짧고 귀엽게. 다른 멤버를 깎아내리거나 진지하게 서운해하지는 마라.`
  );
}

function cleanMemoryLine(text: string): string {
  return text
    .replace(/CARDS:\{.*?\}/g, "")
    .replace(/\[사진 첨부[^\]]*\]/g, "")
    .replace(/:carousel_(?:happy|cheer|shy|comfort|surprise|wink|pout|sleepy|love):/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 최근 기억 노트 — 저장된 새 데이터 없이, 현재 세션의 최근 사용자 발화만
 * 멤버에게 "무엇을 자연스럽게 기억해야 하는지" 알려준다.
 */
function buildRecentMemoryMeta(
  history: ChatMessage[],
  currentUserMessageId: string,
): string {
  const recentUserLines = history
    .filter((m) => m.role === "user" && m.id !== currentUserMessageId)
    .slice(-8)
    .map((m) => cleanMemoryLine(m.content))
    .filter((line) => line.length >= 8)
    .map((line) => (line.length > 80 ? `${line.slice(0, 79).trimEnd()}…` : line));

  if (recentUserLines.length === 0) return "";

  return (
    `[최근 기억 노트]\n` +
    recentUserLines.map((line, i) => `${i + 1}. ${line}`).join("\n") +
    `\n\n[기억 사용법]\n` +
    `위 노트는 사용자가 최근 너에게 직접 말했던 이야기다. ` +
    `응답할 때 필요한 경우 한 가지만 자연스럽게 떠올려라. ` +
    `예: "전에 말했던 그 일은 좀 괜찮아졌어?", "그때 네가 좋아한다고 했던 거랑 비슷하다"처럼. ` +
    `단, 모든 항목을 나열하거나 감시하듯 말하지 마라. 지금 대화와 관련 없으면 굳이 꺼내지 마라.`
  );
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
  /** 세션에 저장된 멤버 ID — systemPrompt 파싱 대신 사용. */
  characterId: CharacterId;
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
    const tErr = await getTranslations("actionErrors");
    return {
      ok: false,
      reason: "saju_failed",
      message: tErr("fortuneSajuFailed", {
        message: e instanceof Error ? e.message : tErr("unknownReason"),
      }),
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

      // 기록 메시지 — 사용자 행동 패턴을 멤버에게 암시적으로 전달
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

      userCtx = buildChatContext(profile, enrichment, characterId);
    } catch {
      // enrichment 실패 시 기본 컨텍스트만 사용
      userCtx = buildChatContext(profile, {}, characterId);
    }
  }

  // 시간 메타 — 매 턴 주입. 마지막 assistant 메시지(방금 저장한 user 메시지는 제외)
  // 를 기준으로 경과 시간 계산.
  const lastAssistant = history
    .filter((m) => m.role === "assistant")
    .at(-1);
  const lastAssistantAt = lastAssistant?.createdAt ?? null;
  const timeMeta = buildTimeMeta(lastAssistantAt);

  // "기억하는 멤버" — 처음 만난 날 기준 함께한 일수 + 기념일 + 따뜻한 기억 지침.
  const relationshipMeta = await buildRelationshipMeta({
    userId: profile.userId,
    character: characterId,
    userName: profile.displayName ?? null,
    nickname: profile.memberNickname ?? null,
  });
  const nicknameMeta = buildNicknameMeta(profile.memberNickname ?? null);
  const biasMeta = buildBiasMeta(characterId, profile.biasCharacter ?? null);
  const recentMemoryMeta = buildRecentMemoryMeta(history, savedUserMessage.id);
  // 세션 간 장기 기억은 첫 턴에만 주입(쿼리·토큰 절약).
  const longTermMemory = isFirstTurn
    ? await buildLongTermMemory({
        userId: profile.userId,
        character: characterId,
        currentSessionId: opts.sessionId,
      })
    : "";
  const metaBlock = [
    timeMeta,
    nicknameMeta,
    relationshipMeta,
    longTermMemory,
    biasMeta,
    recentMemoryMeta,
  ]
    .filter(Boolean)
    .join("\n\n");

  // 첫 턴: 풀 컨텍스트 + 메타
  // 그 외: 메타만 (사용자 정보는 첫 턴에 이미 전달됨)
  const combinedCtx = isFirstTurn
    ? `${userCtx}\n\n${metaBlock}`.trim()
    : metaBlock;

  const systemPrompt = buildCharacterSystemPrompt(characterId, combinedCtx);

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
    characterId,
  };
}

/**
 * AI 응답을 메시지로 저장 + 세션 last_message_at 업데이트.
 *
 * @param opts.cards 점술 요청 시 뽑힌 카드 메타. metadata.cards 로 저장돼
 *   페이지 리로드 후에도 이미지가 유지된다.
 */
export async function saveAssistantMessage(opts: {
  sessionId: string;
  userId: string;
  content: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
  cards?: Array<{
    id: string;
    nameKo: string;
    nameEn?: string;
    imageSrc: string;
    isReversed?: boolean;
    position?: string;
  }>;
}): Promise<void> {
  await db.insert(chatMessages).values({
    sessionId: opts.sessionId,
    userId: opts.userId,
    role: "assistant",
    content: opts.content,
    tokenInput: opts.inputTokens,
    tokenOutput: opts.outputTokens,
    model: opts.model,
    metadata: opts.cards && opts.cards.length > 0 ? { cards: opts.cards } : null,
  });

  await db
    .update(chatSessions)
    .set({ lastMessageAt: new Date() })
    .where(eq(chatSessions.id, opts.sessionId));
}
