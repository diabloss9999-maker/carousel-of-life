import { ArrowRight, Clock, History, Sparkles } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  CardOrientationBadge,
  TarotCardDisplay,
} from "@/components/tarot/tarot-card-display";
import { ShareButton } from "@/components/shared/share-button";
import type { TarotReading } from "@/db/schema";
import { parseThreeInterpretation } from "@/lib/tarot/service";

interface TarotThreeReadingCardProps {
  reading: TarotReading;
}

interface DrawnCardJson {
  id: string;
  nameKo: string;
  nameEn: string;
  isReversed: boolean;
}

function asDrawnCards(cards: unknown): DrawnCardJson[] {
  if (Array.isArray(cards)) return cards as DrawnCardJson[];
  return [];
}

const POSITION_KEYS = ["past", "present", "future"] as const;

export async function TarotThreeReadingCard({ reading }: TarotThreeReadingCardProps) {
  const cards = asDrawnCards(reading.cards);
  const parsed = parseThreeInterpretation(reading.interpretation);
  const t = await getTranslations("tarotForm");
  const locale = await getLocale();

  if (!parsed || cards.length < 3) {
    return null;
  }

  const positions = [
    { key: "past" as const,    label: t("positionPast"),    desc: t("positionPastSub"),    icon: History },
    { key: "present" as const, label: t("positionPresent"), desc: t("positionPresentSub"), icon: Clock },
    { key: "future" as const,  label: t("positionFuture"),  desc: t("positionFutureSub"),  icon: ArrowRight },
  ];

  const localeDateStr = new Date(reading.createdAt).toLocaleDateString(
    locale === "en" ? "en-US" : "ko-KR",
    locale === "en"
      ? { year: "numeric", month: "short", day: "numeric" }
      : undefined,
  );

  return (
    <Card className="app-surface ring-1 ring-accent/15" data-capture-root>
      <CardHeader className="space-y-3">
        <p className="text-[15px] uppercase tracking-wider text-muted-foreground">
          {localeDateStr} · {t("spreadThreeLabel")}
        </p>
        {reading.question ? (
          <p className="font-mystic text-base text-foreground/80 italic">
            “{reading.question}”
          </p>
        ) : null}
        <p className="font-mystic text-lg font-medium leading-relaxed">
          {parsed.summary}
        </p>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid gap-8 md:grid-cols-3">
          {positions.map((pos, i) => {
            const Icon = pos.icon;
            const card = cards[i];
            return (
              <div key={pos.key} className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-1.5 text-[15px] font-medium text-accent">
                  <Icon className="h-4 w-4" aria-hidden />
                  <span className="font-mystic">{pos.label}</span>
                  <span className="text-[15px] text-muted-foreground/70 font-normal">{pos.desc}</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <TarotCardDisplay
                    id={card.id}
                    nameKo={card.nameKo}
                    nameEn={card.nameEn}
                    isReversed={card.isReversed}
                    className="w-32 sm:w-36"
                  />
                  <CardOrientationBadge isReversed={card.isReversed} />
                </div>
                <p className="font-mystic whitespace-pre-line leading-relaxed text-[15px] text-foreground/85 text-center md:text-left">
                  {parsed[POSITION_KEYS[i]]}
                </p>
              </div>
            );
          })}
        </div>

        <div className="space-y-2 rounded-xl border border-accent/25 bg-accent/10 p-5 shadow-sm">
          <div className="flex items-center gap-1.5 text-[15px] font-medium text-accent">
            <Sparkles className="h-4 w-4" aria-hidden />
            <span className="font-mystic">{t("synthesis")}</span>
          </div>
          <p className="font-mystic whitespace-pre-line leading-relaxed text-foreground/90">
            {parsed.synthesis}
          </p>
        </div>

        <div className="flex justify-end">
          <ShareButton
            title={t("shareTitleThree", { summary: parsed.summary })}
            text={`${t("synthesis")}: ${parsed.summary}\n\n${t("positionPast")}: ${parsed.past}\n\n${t("positionPresent")}: ${parsed.present}\n\n${t("positionFuture")}: ${parsed.future}\n\n${parsed.synthesis}`}
          />
        </div>
      </CardContent>
    </Card>
  );
}
