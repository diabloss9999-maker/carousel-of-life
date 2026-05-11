import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ChatWindow, type InitialMessage } from "@/components/chat/chat-window";
import { requireProfile } from "@/lib/auth/get-user";
import {
  getSessionForUser,
  getSessionMessages,
} from "@/lib/chat/service";
import { CHARACTERS, type CharacterId } from "@/lib/chat/characters";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "대화",
  description: "주술사와의 문답.",
};

interface ChatSessionPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function ChatSessionPage({
  params,
}: ChatSessionPageProps) {
  const { sessionId } = await params;
  const { profile } = await requireProfile();

  const session = await getSessionForUser({
    sessionId,
    userId: profile.userId,
  });
  if (!session) notFound();

  const messages = await getSessionMessages(sessionId);
  const initial: InitialMessage[] = messages.map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const charId = (session.character ?? "witch") as CharacterId;
  const character = CHARACTERS[charId] ?? CHARACTERS.witch;

  return (
    <div className="space-y-4">
      {/* 헤더: 뒤로가기 + 제목 */}
      <header className="flex items-center justify-between gap-2">
        <div className="space-y-0.5">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link href={ROUTES.chat}>
              <ArrowLeft className="h-4 w-4" aria-hidden /> 지난 대화
            </Link>
          </Button>
          <h1 className="font-mystic text-2xl font-semibold tracking-tight">
            {session.title}
          </h1>
        </div>
      </header>

      {/* 모바일: 캐릭터 컴팩트 뱃지 */}
      <div className="flex md:hidden items-center gap-3 rounded-xl border border-border/30 bg-card/30 px-3 py-2 backdrop-blur">
        <div className="relative w-10 h-14 overflow-hidden rounded-lg flex-shrink-0 ring-1 ring-border/40">
          <Image
            src={character.imageSrc}
            alt={character.name}
            fill
            className="object-cover object-top"
            sizes="40px"
          />
        </div>
        <div>
          <p className="font-mystic font-bold text-sm">{character.name}</p>
          <p className="text-xs text-muted-foreground">{character.title}</p>
        </div>
      </div>

      {/* 데스크톱: 좌측 캐릭터 이미지 + 우측 대화창 — 같은 높이 / 모바일: 전체 차지 */}
      <div className="flex gap-4 h-[calc(100vh-16rem)] md:h-[calc(100vh-13rem)]">
        {/* 캐릭터 이미지 — 데스크톱 전용, sticky */}
        <div className="hidden md:flex flex-col items-center gap-2 sticky top-20 flex-shrink-0 w-40 h-full">
          <div className="relative w-full flex-1 overflow-hidden rounded-2xl shadow-xl ring-1 ring-amber-200/20">
            <Image
              src={character.imageSrc}
              alt={character.name}
              fill
              className="object-cover object-top"
              sizes="160px"
              priority
            />
          </div>
          <div className="text-center space-y-0.5 shrink-0">
            <p className="font-mystic font-bold text-sm text-foreground/90">{character.name}</p>
            <p className="text-[10px] text-muted-foreground">{character.title}</p>
          </div>
        </div>

        {/* 대화창 */}
        <div className="flex-1 min-w-0 h-full">
          <ChatWindow
            sessionId={sessionId}
            initialMessages={initial}
            characterId={charId}
          />
        </div>
      </div>
    </div>
  );
}
