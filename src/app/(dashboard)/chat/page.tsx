import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { BiasGallery } from "@/components/chat/bias-gallery";
import { BirthdayDdayStrip } from "@/components/chat/birthday-dday-strip";
import { CharacterSelect } from "@/components/chat/character-select";
import { SessionDrawer } from "@/components/chat/session-drawer";
import { WelcomeGreeting } from "@/components/chat/welcome-greeting";
import { Card, CardContent } from "@/components/ui/card";
import { requireProfile } from "@/lib/auth/get-user";
import { getAllAffinities } from "@/lib/affinity/service";
import { buildMatchScoreMap } from "@/lib/chat/character-match";
import { listTodaySessions } from "@/lib/chat/service";
import { getSubscriptionTier } from "@/lib/payment/subscription-state";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  title: "멤버",
  description: "9명의 버추얼 아이돌 멤버와 대화를 시작해요.",
};

export default async function ChatPage() {
  const { profile } = await requireProfile();
  const t = await getTranslations("chat");

  const [sessions, tier, affinityRows] = await Promise.all([
    listTodaySessions(profile.userId),
    getSubscriptionTier(profile.userId),
    getAllAffinities(profile.userId),
  ]);

  const affinities = Object.fromEntries(
    affinityRows.map((a) => [a.characterId, a.points]),
  );
  const matchScores = buildMatchScoreMap(profile.mbti);

  return (
    <div className="space-y-8">
      <WelcomeGreeting />
      <header className="space-y-3">
        <h1 className="font-mystic flex items-center gap-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          <img
            src="/icons/whisper-hand.svg"
            alt=""
            aria-hidden
            className="h-8 w-8 opacity-60"
          />
          {t("title")}
        </h1>
        <p className="text-muted-foreground">{t("description")}</p>
        <BirthdayDdayStrip />
      </header>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.2em] text-primary/80">
              Carousel Nine
            </p>
            <h2 className="font-mystic text-2xl font-semibold tracking-tight">
              단톡방
            </h2>
          </div>
          <Link
            href="/group"
            className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[15px] font-semibold transition hover:bg-white/20"
          >
            들어가기
          </Link>
        </div>
        <Link
          href="/group"
          className="group relative block overflow-hidden rounded-2xl border border-white/15 shadow-lg"
          aria-label="Carousel Nine 단톡방 열기"
        >
          <div className="relative aspect-[16/9] w-full bg-white/10">
            <Image
              src="/characters/idols/group-chat.png"
              alt="Carousel Nine 단체 프로필 이미지"
              fill
              sizes="(max-width: 768px) 100vw, 960px"
              className="img-shimmer object-cover transition-transform duration-500 group-hover:scale-[1.015]"
              priority
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent"
            />
          </div>
        </Link>
      </section>

      <Card className="app-surface">
        <CardContent className="pt-5">
          <CharacterSelect
            affinities={affinities}
            matchScores={matchScores}
          />
        </CardContent>
      </Card>

      <BiasGallery
        biasCharacterId={profile.biasCharacter ?? null}
        subscribed={tier !== "free"}
      />

      <SessionDrawer sessions={sessions} />
    </div>
  );
}
