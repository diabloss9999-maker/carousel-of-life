/**
 * 단체방 세션·히스토리·저장 로직.
 *
 * 단체방은 기존 chat_sessions/chat_messages 를 재사용한다.
 *   - 세션: character = "group" (사용자당 1개, find-or-create)
 *   - 멤버 발화: assistant 메시지 + metadata { speaker, group:true }
 */
import "server-only";

import { and, asc, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  chatSessions,
  chatMessages,
  type ChatSession,
  type ChatMessage,
} from "@/db/schema";
import { CHARACTERS, type CharacterId } from "@/lib/chat/characters";
import type { GroupTurn } from "@/lib/chat/group";

export type GroupApiMessage = {
  role: "user" | "assistant";
  content:
    | string
    | (
        | { type: "text"; text: string }
        | {
            type: "image";
            source: {
              type: "base64";
              media_type: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
              data: string;
            };
          }
      )[];
};

/** 단체방 세션 식별용 character 값. */
export const GROUP_CHARACTER = "group";

/** 단체방 세션을 찾거나 없으면 만든다. */
export async function findOrCreateGroupSession(
  userId: string,
): Promise<ChatSession> {
  const [existing] = await db
    .select()
    .from(chatSessions)
    .where(
      and(
        eq(chatSessions.userId, userId),
        eq(chatSessions.character, GROUP_CHARACTER),
      ),
    )
    .orderBy(desc(chatSessions.createdAt))
    .limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(chatSessions)
    .values({
      userId,
      title: "Carousel Nine 단체방",
      character: GROUP_CHARACTER,
    })
    .returning();
  return created;
}

/** 단체방 메시지 history (오래된 → 최신). */
export async function getGroupMessages(
  sessionId: string,
): Promise<ChatMessage[]> {
  return db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(asc(chatMessages.createdAt));
}

/**
 * chat_messages 를 모델 입력용 messages 배열로 변환한다.
 * 연속된 멤버 발화는 한 assistant 메시지("[이름] 대사" 줄들)로 합친다.
 */
export function buildGroupApiMessages(
  messages: ChatMessage[],
): GroupApiMessage[] {
  const out: GroupApiMessage[] = [];
  let pending: string[] = [];

  const flush = () => {
    if (pending.length > 0) {
      out.push({ role: "assistant", content: pending.join("\n") });
      pending = [];
    }
  };

  for (const m of messages) {
    if (m.role === "user") {
      flush();
      out.push({ role: "user", content: m.content });
    } else if (m.role === "assistant") {
      const meta = m.metadata as { speaker?: string } | null;
      const speaker = meta?.speaker as CharacterId | undefined;
      const name = speaker ? CHARACTERS[speaker]?.name : undefined;
      pending.push(name ? `[${name}] ${m.content}` : m.content);
    }
  }
  flush();

  // Anthropic 은 첫 메시지가 user 여야 한다 — 앞쪽 assistant 는 제거.
  while (out.length > 0 && out[0].role === "assistant") out.shift();
  return out;
}

function cleanGroupMemoryLine(text: string): string {
  return text
    .replace(/\[사진 첨부[^\]]*\]/g, "")
    .replace(/:carousel_(?:happy|cheer|shy|comfort|surprise|wink|pout|sleepy|love):/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildGroupRecentMemory(messages: ChatMessage[]): string {
  const userLines = messages
    .filter((m) => m.role === "user")
    .slice(-8)
    .map((m) => cleanGroupMemoryLine(m.content))
    .filter((line) => line.length >= 8)
    .map((line) => (line.length > 80 ? `${line.slice(0, 79).trimEnd()}…` : line));

  if (userLines.length === 0) return "";

  return (
    `\n\n[단톡방 최근 기억]\n` +
    userLines.map((line, i) => `${i + 1}. ${line}`).join("\n") +
    `\n\n[단톡방 기억 사용법]\n` +
    `멤버들은 위 최근 화제를 단톡방에서 같이 본 것처럼 기억한다. ` +
    `지금 말과 연결될 때만 한 가지를 자연스럽게 꺼내고, 전부 나열하지 마라. ` +
    `멤버끼리 "아 맞다 그때…"처럼 받아칠 수 있다.`
  );
}

/** 멤버 turn 배열을 assistant 메시지로 저장하고 세션 시각을 갱신한다. */
export async function saveGroupTurns(opts: {
  sessionId: string;
  userId: string;
  turns: GroupTurn[];
  model: string;
}): Promise<void> {
  if (opts.turns.length === 0) return;

  await db.insert(chatMessages).values(
    opts.turns.map((t) => ({
      sessionId: opts.sessionId,
      userId: opts.userId,
      role: "assistant" as const,
      content: t.text,
      model: opts.model,
      metadata: { speaker: t.speaker, group: true } as Record<string, unknown>,
    })),
  );

  await db
    .update(chatSessions)
    .set({ lastMessageAt: new Date() })
    .where(eq(chatSessions.id, opts.sessionId));
}
