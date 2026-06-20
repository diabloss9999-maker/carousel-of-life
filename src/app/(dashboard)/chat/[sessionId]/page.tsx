import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ChatWindow, type InitialMessage } from "@/components/chat/chat-window";
import { AffinityBar } from "@/components/affinity/affinity-bar";
import { BiasButton } from "@/components/chat/bias-button";
import { GiftShop } from "@/components/gifts/gift-shop";
import { CharacterImage } from "@/components/shared/character-image";
import { CharacterBg } from "@/components/layout/character-bg";
import {
  MemberProfilePanel,
  type MemberFact,
} from "@/components/chat/member-profile-panel";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth/get-user";
import {
  getSessionForUser,
  getSessionMessages,
} from "@/lib/chat/service";
import { getAffinity } from "@/lib/affinity/service";
import { CHARACTERS, type CharacterId } from "@/lib/chat/characters";
import { ROUTES, fortuneQuestionLimitForTier } from "@/lib/constants";
import { getSubscriptionTier } from "@/lib/payment/subscription-state";
import { characterToEntityKey } from "@/lib/systems/entity-mood";
import { getTodayUsage } from "@/lib/usage/quota";

export const metadata: Metadata = {
  title: "대화",
  description: "멤버와의 대화.",
};

interface ChatSessionPageProps {
  params: Promise<{ sessionId: string }>;
  searchParams?: Promise<{
    prefill?: string;
    source?: string;
    ctxTitle?: string;
    ctxSummary?: string;
  }>;
}

export default async function ChatSessionPage({
  params,
  searchParams,
}: ChatSessionPageProps) {
  const { sessionId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const initialPrompt =
    typeof resolvedSearchParams.prefill === "string"
      ? resolvedSearchParams.prefill.slice(0, 100)
      : undefined;
  const readingContext =
    typeof resolvedSearchParams.source === "string" ||
    typeof resolvedSearchParams.ctxTitle === "string" ||
    typeof resolvedSearchParams.ctxSummary === "string"
      ? {
          source: resolvedSearchParams.source?.slice(0, 24) ?? "방금 본 풀이",
          title: resolvedSearchParams.ctxTitle?.slice(0, 48) ?? null,
          summary: resolvedSearchParams.ctxSummary?.slice(0, 120) ?? null,
        }
      : undefined;
  const { profile } = await requireProfile();

  const session = await getSessionForUser({
    sessionId,
    userId: profile.userId,
  });
  if (!session) notFound();

  const charId = (session.character ?? "witch") as CharacterId;
  const character = CHARACTERS[charId] ?? CHARACTERS.witch;

  const [messages, affinityRow, usage, tier] = await Promise.all([
    getSessionMessages(sessionId),
    getAffinity(profile.userId, charId),
    getTodayUsage(profile.userId).catch(() => ({
      fortuneCount: 0,
      tarotCount: 0,
      chatCount: 0,
      palmCount: 0,
    })),
    getSubscriptionTier(profile.userId).catch(() => "free" as const),
  ]);

  const initial: InitialMessage[] = messages.map((m) => {
    const meta = m.metadata as { cards?: unknown } | null;
    const rawCards = Array.isArray(meta?.cards) ? meta.cards : null;
    return {
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
      cards: rawCards as InitialMessage["cards"],
    };
  });

  const affinityPoints = affinityRow?.points ?? 0;
  const entityKey = characterToEntityKey(charId);
  const tChar = await getTranslations("characters");
  const tType = await getTranslations("personalityTypes");
  const profileFacts = (tChar.raw(`${charId}.facts`) as MemberFact[]) ?? [];
  const typeNickname = tType(`${character.mbti}_nickname`);

  return (
    <div className={`entity-${entityKey} kakao-chat-page mobile-chat-page space-y-3 md:space-y-4`}>
      <CharacterBg characterId={charId} />
      {/* Messenger-style header */}
      <header className="mobile-chat-header kakao-chat-header flex items-center justify-between gap-2">
        <div className="kakao-chat-left">
          <Button asChild variant="ghost" size="sm" className="kakao-chat-back">
            <Link href={ROUTES.chat}>
              <ArrowLeft className="h-5 w-5" aria-hidden />
              <span className="sr-only">대화 목록</span>
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="kakao-chat-title">{character.name}</h1>
            <p className="kakao-chat-subtitle">{character.title}</p>
          </div>
        </div>
        <div className="kakao-chat-actions flex items-center gap-1">
          <GiftShop
            characterId={charId}
            characterName={character.name}
            returnTo={`/chat/${sessionId}`}
            compact
          />
          <BiasButton
            characterId={charId}
            isBias={profile.biasCharacter === charId}
            compact
          />
        </div>
      </header>

      {/* 모바일: 멤버 컴팩트 뱃지 */}
      <div className="mobile-chat-member-strip flex md:hidden items-center gap-3 rounded-xl app-surface px-3 py-2 backdrop-blur">
        <div className="relative w-10 h-14 overflow-hidden rounded-lg flex-shrink-0 ring-1 ring-border/40">
          <CharacterImage
            character={character}
            fill
            className="object-cover object-top"
            sizes="40px"
          />
        </div>
        <div>
          <p className="font-mystic font-bold text-[15px]">{character.name}</p>
          <p className="text-[15px] text-muted-foreground">{character.title}</p>
        </div>
      </div>

      <MemberProfilePanel
        className="mobile-chat-profile"
        name={character.name}
        age={character.age}
        positionLabel={character.specialty}
        typeCode={character.mbti}
        typeNickname={typeNickname}
        description={character.description}
        facts={profileFacts}
      />

      {/* 데스크톱: 좌측 멤버 이미지 + 우측 대화창 — 같은 높이 / 모바일: 전체 차지 */}
      <div className="mobile-chat-session flex gap-4 h-[calc(100dvh-8rem)] md:h-[calc(100dvh-10rem)]">
        {/* 멤버 이미지 — 데스크톱 전용, sticky */}
        <div className="desktop-member-rail hidden md:flex flex-col items-center gap-2 sticky top-20 flex-shrink-0 w-40 h-full">
          <div className="relative w-full flex-1 overflow-hidden rounded-2xl shadow-xl ring-1 ring-amber-200/20">
            <CharacterImage
              character={character}
              fill
              className="object-cover object-top"
              quality={95}
              maxSlides={1 + Math.floor(affinityPoints / 10)}
              sizes="(min-width: 768px) 320px, 80px"
              priority
            />
          </div>
          <div className="text-center space-y-2 shrink-0 w-full">
            <p className="font-mystic font-bold text-[15px] text-foreground/90">{character.name}</p>
            <p className="text-[15px] text-muted-foreground">{character.title}</p>
            <AffinityBar characterId={charId} points={affinityPoints} compact />
          </div>
        </div>

        {/* 대화창 */}
        <div className="flex-1 min-w-0 h-full">
          <ChatWindow
            sessionId={sessionId}
            initialMessages={initial}
            characterId={charId}
            initialPrompt={initialPrompt}
            chatUsage={{
              used: usage.chatCount,
              max: fortuneQuestionLimitForTier(tier).question,
            }}
            readingContext={readingContext}
          />
        </div>
      </div>
    </div>
  );
}
