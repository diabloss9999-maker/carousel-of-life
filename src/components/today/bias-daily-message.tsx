import Link from "next/link";
import type { Route } from "next";
import { MessageCircle } from "lucide-react";

import { BiasShareButton } from "@/components/today/bias-share-button";
import { CharacterImage } from "@/components/shared/character-image";
import { CHARACTERS } from "@/lib/chat/characters";
import { ROUTES } from "@/lib/constants";
import {
  DAILY_MESSAGE_TONE,
  getBiasDailyMessage,
} from "@/lib/daily-message/service";
import type { Profile } from "@/db/schema";

function withAndParticle(name: string): string {
  const lastChar = name.at(-1);
  if (!lastChar) return name;
  const code = lastChar.charCodeAt(0);
  const hasBatchim = code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0;
  return `${name}${hasBatchim ? "과" : "와"}`;
}

export function BiasDailyMessage({ profile }: { profile: Profile }) {
  const message = getBiasDailyMessage(profile);
  const character = CHARACTERS[message.characterId];
  const tone = DAILY_MESSAGE_TONE[message.tone];
  const chatLabel = `${withAndParticle(message.characterName)} 대화하기`;

  return (
    <section className="app-surface overflow-hidden rounded-3xl border border-primary/20 p-4 sm:p-5">
      <div className="flex gap-4">
        <Link
          href={ROUTES.chat as Route}
          className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/10 sm:h-20 sm:w-20"
          aria-label={chatLabel}
        >
          <CharacterImage
            character={character}
            fill
            sizes="80px"
            slideshowActive={false}
            style={{ objectPosition: "center 18%" }}
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[15px] font-semibold">
              {message.characterName}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {tone.emoji} {tone.label}
            </span>
            <span className="text-[11px] font-medium text-primary/80">
              오늘의 한마디
            </span>
          </div>

          <p className="mt-1.5 text-[14px] font-medium leading-6">
            {message.opener}
          </p>
          <p className="mt-1 text-[14px] leading-6 text-muted-foreground">
            {message.insight}
          </p>
          <p className="mt-2 text-[13px] leading-5 text-foreground/80">
            “{message.signOff}”{" "}
            <span className="text-muted-foreground">— {message.characterName}</span>
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link
              href={ROUTES.chat as Route}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 px-3 py-1.5 text-[13px] font-semibold text-primary transition hover:bg-primary/10"
            >
              <MessageCircle className="h-3.5 w-3.5" aria-hidden />
              {chatLabel}
            </Link>
            <BiasShareButton
              name={message.characterName}
              opener={message.opener}
              insight={message.insight}
              signOff={message.signOff}
              tone={message.tone}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
