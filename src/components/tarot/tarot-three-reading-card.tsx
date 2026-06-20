import Link from "next/link";
import type { Route } from "next";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Compass,
  History,
  Sparkles,
} from "lucide-react";
import { getLocale } from "next-intl/server";

import { ContinueWithMemberCta } from "@/components/chat/continue-with-member-cta";
import { ShareButton } from "@/components/shared/share-button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  CardOrientationBadge,
  TarotCardDisplay,
} from "@/components/tarot/tarot-card-display";
import type { TarotReading } from "@/db/schema";
import { ROUTES } from "@/lib/constants";
import {
  looksCorruptedText,
  safeReadingText,
  safeShortText,
} from "@/lib/content/safety";
import { parseThreeInterpretation } from "@/lib/tarot/service";
import { breakSentences } from "@/lib/utils";

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

export async function TarotThreeReadingCard({
  reading,
}: TarotThreeReadingCardProps) {
  const cards = asDrawnCards(reading.cards);
  const parsed = parseThreeInterpretation(reading.interpretation);
  const locale = await getLocale();

  if (!parsed || cards.length < 3) return null;

  const safeParsed = {
    summary: safeShortText(
      parsed.summary,
      "새로 뽑으면 3장 타로 요약을 볼 수 있어요.",
    ),
    past: safeReadingText(parsed.past),
    present: safeReadingText(parsed.present),
    future: safeReadingText(parsed.future),
    synthesis: safeReadingText(parsed.synthesis),
  };

  const positions = [
    {
      key: "past" as const,
      label: "과거",
      desc: "지나온 흐름",
      icon: History,
    },
    {
      key: "present" as const,
      label: "현재",
      desc: "지금의 자리",
      icon: Clock,
    },
    {
      key: "future" as const,
      label: "미래",
      desc: "다가올 방향",
      icon: ArrowRight,
    },
  ];

  const localeDateStr = new Date(reading.createdAt).toLocaleDateString(
    locale === "en" ? "en-US" : "ko-KR",
    locale === "en"
      ? { year: "numeric", month: "short", day: "numeric" }
      : undefined,
  );
  const question = looksCorruptedText(reading.question ?? "")
    ? null
    : reading.question;
  const contextTitle = "3장 타로 · 과거-현재-미래";
  const contextSummary = `요약: ${safeParsed.summary}`.slice(0, 120);
  const continuePrompt =
    "방금 본 과거, 현재, 미래 타로 결과를 내가 어떻게 받아들이면 좋을지 같이 정리해줘.";

  return (
    <Card className="app-surface ring-1 ring-accent/15" data-capture-root>
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
              <Sparkles className="h-6 w-6" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary/75">
                Tarot Reading
              </p>
              <p className="font-mystic text-pretty-ko text-[15px] font-semibold text-foreground">
                3장 타로 리포트
              </p>
              <p className="text-keep text-[15px] text-muted-foreground">
                과거, 현재, 미래의 흐름을 차례로 정리했어요.
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
        <div className="rounded-2xl border border-primary/20 bg-primary/[0.07] px-4 py-3">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
            <p className="text-[12px] font-semibold">흐름 요약</p>
          </div>
          <p className="mt-2 text-pretty-ko text-[15px] font-semibold leading-6 text-foreground">
            {safeParsed.summary}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid gap-8 md:grid-cols-3">
          {positions.map((pos, index) => {
            const Icon = pos.icon;
            const card = cards[index];
            return (
              <div key={pos.key} className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-1.5 text-[15px] font-medium text-accent">
                  <Icon className="h-4 w-4" aria-hidden />
                  <span className="font-mystic">{pos.label}</span>
                  <span className="text-[15px] font-normal text-muted-foreground/70">
                    {pos.desc}
                  </span>
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
                <p className="whitespace-pre-line text-center font-mystic text-[15px] leading-relaxed text-foreground/85 md:text-left">
                  {breakSentences(safeParsed[POSITION_KEYS[index]])}
                </p>
              </div>
            );
          })}
        </div>

        <div className="space-y-3 rounded-2xl border border-accent/25 bg-accent/10 p-5 shadow-sm">
          <div className="flex items-center gap-1.5 text-[15px] font-medium text-accent">
            <Sparkles className="h-4 w-4" aria-hidden />
            <span className="font-mystic">종합 해석</span>
          </div>
          <p className="whitespace-pre-line font-mystic leading-relaxed text-foreground/90">
            {breakSentences(safeParsed.synthesis)}
          </p>
          <div className="rounded-2xl border border-white/10 bg-background/50 px-4 py-3">
            <div className="flex items-center gap-2 text-primary">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
              <p className="text-[12px] font-semibold">다음 선택 기준</p>
            </div>
            <p className="mt-2 text-[14px] leading-6 text-muted-foreground">
              과거의 이유보다 현재 카드가 말하는 태도를 먼저 맞추고,
              미래 카드는 오늘 바꿀 작은 행동으로만 참고해요.
            </p>
          </div>
        </div>

        <ContinueWithMemberCta
          sourceLabel="3장 타로"
          prompt={continuePrompt}
          contextTitle={contextTitle}
          contextSummary={contextSummary}
        />

        <TarotThreeNextActions />

        <div className="flex justify-end">
          <ShareButton
            title={`3장 타로 · ${safeParsed.summary}`}
            text={`종합 해석: ${safeParsed.summary}\n\n과거: ${safeParsed.past}\n\n현재: ${safeParsed.present}\n\n미래: ${safeParsed.future}\n\n${safeParsed.synthesis}`}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function TarotThreeNextActions() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-4">
      <div className="flex items-center gap-2 text-primary">
        <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
        <p className="text-[12px] font-semibold">해석을 생활로 이어보기</p>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <NextActionLink
          href={ROUTES.today}
          icon={CalendarDays}
          title="오늘 운세"
          body="오늘 바로 할 행동으로 정리"
        />
        <NextActionLink
          href={ROUTES.saju}
          icon={Compass}
          title="사주"
          body="반복되는 선택 패턴 확인"
        />
      </div>
    </div>
  );
}

function NextActionLink({
  body,
  href,
  icon: Icon,
  title,
}: {
  body: string;
  href: Route;
  icon: typeof Sparkles;
  title: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 transition hover:border-primary/30 hover:bg-white/[0.08]"
    >
      <span className="flex items-center gap-2 text-primary">
        <Icon className="h-4 w-4" aria-hidden />
        <span className="text-[13px] font-semibold text-foreground">{title}</span>
      </span>
      <span className="mt-1.5 block text-[12px] leading-5 text-muted-foreground">
        {body}
      </span>
    </Link>
  );
}
