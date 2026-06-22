import { Crown, Sparkles, Target } from "lucide-react";
import { getLocale } from "next-intl/server";

import { ShareButton } from "@/components/shared/share-button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  CardOrientationBadge,
  TarotCardDisplay,
} from "@/components/tarot/tarot-card-display";
import type { TarotReading } from "@/db/schema";
import {
  looksCorruptedText,
  safeReadingText,
  safeShortText,
} from "@/lib/content/safety";
import { parseSevenInterpretation } from "@/lib/tarot/service";
import { breakSentences } from "@/lib/utils";

interface TarotSevenReadingCardProps {
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

const POSITION_LABELS = [
  "현재",
  "숨은 감정",
  "장애물",
  "내가 할 일",
  "상대/환경",
  "가까운 흐름",
  "최종 조언",
] as const;

export async function TarotSevenReadingCard({
  reading,
}: TarotSevenReadingCardProps) {
  const cards = asDrawnCards(reading.cards);
  const parsed = parseSevenInterpretation(reading.interpretation);
  const locale = await getLocale();

  if (!parsed || cards.length < 7) return null;

  const summary = safeShortText(
    parsed.summary,
    "지금은 방향을 깊게 다시 잡을 때예요.",
  );
  const sections = parsed.sections.map((section, index) => ({
    title: safeShortText(section.title, POSITION_LABELS[index] ?? "흐름"),
    interpretation: safeReadingText(section.interpretation),
  }));
  const synthesis = safeReadingText(parsed.synthesis);
  const actionPlan = safeReadingText(parsed.actionPlan);
  const question = looksCorruptedText(reading.question ?? "")
    ? null
    : reading.question;
  const localeDateStr = new Date(reading.createdAt).toLocaleDateString(
    locale === "en" ? "en-US" : "ko-KR",
    locale === "en"
      ? { year: "numeric", month: "short", day: "numeric" }
      : undefined,
  );

  return (
    <Card className="app-surface ring-1 ring-primary/20" data-capture-root>
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
              <Crown className="h-6 w-6" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary/75">
                Pro Tarot Report
              </p>
              <p className="font-mystic text-pretty-ko text-[15px] font-semibold text-foreground">
                7장 프로 전략 타로
              </p>
              <p className="text-keep text-[15px] text-muted-foreground">
                현재 흐름부터 최종 조언까지 깊게 정리했어요.
              </p>
            </div>
          </div>
          <p className="text-[15px] uppercase tracking-wider text-muted-foreground">
            {localeDateStr}
          </p>
        </div>
        {question ? (
          <p className="font-mystic text-pretty-ko text-base italic text-foreground/80">
            &ldquo;{question}&rdquo;
          </p>
        ) : null}
        <div className="tarot-reading-text-delayed rounded-2xl border border-primary/20 bg-primary/[0.07] px-4 py-3">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
            <p className="text-[12px] font-semibold">프로 요약</p>
          </div>
          <p className="mt-2 text-pretty-ko text-[15px] font-semibold leading-6 text-foreground">
            {summary}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="tarot-reading-image-first grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((section, index) => {
            const card = cards[index];
            return (
              <div
                key={`${card.id}-${index}`}
                className="rounded-2xl border border-border/50 bg-background/45 p-4"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0">
                    <TarotCardDisplay
                      id={card.id}
                      nameKo={card.nameKo}
                      nameEn={card.nameEn}
                      isReversed={card.isReversed}
                      className="w-24 sm:w-28"
                    />
                  </div>
                  <div className="min-w-0 space-y-2">
                    <p className="text-[12px] font-semibold text-primary">
                      {index + 1}. {POSITION_LABELS[index]}
                    </p>
                    <p className="font-mystic text-[15px] font-semibold text-foreground">
                      {section.title}
                    </p>
                    <CardOrientationBadge isReversed={card.isReversed} />
                  </div>
                </div>
                <p className="tarot-reading-text-delayed mt-4 whitespace-pre-line text-[14px] leading-6 text-foreground/85">
                  {breakSentences(section.interpretation)}
                </p>
              </div>
            );
          })}
        </div>

        <div className="tarot-reading-text-delayed space-y-3 rounded-2xl border border-primary/20 bg-primary/[0.06] p-5">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-4 w-4" aria-hidden />
            <p className="text-[13px] font-semibold">종합 해석</p>
          </div>
          <p className="whitespace-pre-line font-mystic leading-relaxed text-foreground/90">
            {breakSentences(synthesis)}
          </p>
        </div>

        <div className="tarot-reading-text-delayed space-y-3 rounded-2xl border border-accent/25 bg-accent/10 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-accent">
            <Target className="h-4 w-4" aria-hidden />
            <p className="text-[13px] font-semibold">7일 행동 계획</p>
          </div>
          <p className="whitespace-pre-line font-mystic leading-relaxed text-foreground/90">
            {breakSentences(actionPlan)}
          </p>
        </div>

        <div className="flex justify-end">
          <ShareButton
            title={`7장 프로 타로 · ${summary}`}
            text={`7장 프로 타로\n${summary}\n\n종합 해석: ${synthesis}\n\n7일 행동 계획: ${actionPlan}`}
          />
        </div>
      </CardContent>
    </Card>
  );
}
