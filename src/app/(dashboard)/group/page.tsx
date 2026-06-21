import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BodyClass } from "@/components/layout/body-class";
import { requireProfile } from "@/lib/auth/get-user";
import {
  findOrCreateGroupSession,
  getGroupMessages,
} from "@/lib/chat/group-service";
import { GroupChat, type GroupMessage } from "@/components/chat/group-chat";
import type { CharacterId } from "@/lib/chat/characters";
import { fortuneQuestionLimitForTier } from "@/lib/constants";
import { getSubscriptionTier } from "@/lib/payment/subscription-state";
import { getTodayUsage } from "@/lib/usage/quota";

export const metadata: Metadata = {
  title: "단체방",
  description: "Carousel Nine 9명과의 단체 대화.",
};

export default async function GroupPage() {
  const { profile } = await requireProfile();
  const [session, usage, tier] = await Promise.all([
    findOrCreateGroupSession(profile.userId),
    getTodayUsage(profile.userId).catch(() => ({
      fortuneCount: 0,
      tarotCount: 0,
      chatCount: 0,
      palmCount: 0,
    })),
    getSubscriptionTier(profile.userId).catch(() => "free" as const),
  ]);
  const messages = await getGroupMessages(session.id);

  const initial: GroupMessage[] = messages.map((m) => {
    if (m.role === "user") {
      return { id: m.id, role: "user" as const, content: m.content };
    }
    const meta = m.metadata as { speaker?: string } | null;
    return {
      id: m.id,
      role: "member" as const,
      speaker: (meta?.speaker ?? "witch") as CharacterId,
      content: m.content,
    };
  });

  return (
    <div className="kakao-chat-page mobile-chat-page group-chat-page mx-auto flex h-[calc(100dvh-11rem)] w-full max-w-3xl flex-col gap-2.5">
      <BodyClass className="chat-shell-active" />
      <header className="mobile-chat-header kakao-chat-header flex items-center justify-between gap-2">
        <div className="kakao-chat-left">
          <Button asChild variant="ghost" size="sm" className="kakao-chat-back">
            <Link href="/chat">
              <ArrowLeft className="h-5 w-5" aria-hidden />
              <span className="sr-only">멤버 목록</span>
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="kakao-chat-title">Carousel Nine</h1>
            <p className="kakao-chat-subtitle">단체방</p>
          </div>
        </div>
      </header>

      <div className="mobile-chat-session min-h-0 flex-1">
        <GroupChat
          initialMessages={initial}
          chatUsage={{
            used: usage.chatCount,
            max: fortuneQuestionLimitForTier(tier).question,
          }}
        />
      </div>
    </div>
  );
}
