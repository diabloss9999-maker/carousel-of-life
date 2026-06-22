import Link from "next/link";
import type { Route } from "next";
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  LockKeyhole,
  Sparkles,
} from "lucide-react";
import { getLocale } from "next-intl/server";

import { SaveImageButton } from "@/components/shared/save-image-button";
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
import { breakSentences } from "@/lib/utils";

interface TarotReadingCardProps {
  reading: TarotReading;
  subscribed?: boolean;
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

export async function TarotReadingCard({
  reading,
  subscribed = false,
}: TarotReadingCardProps) {
  const cards = asDrawnCards(reading.cards);
  const card = cards[0];
  const locale = await getLocale();

  const localeDateStr = new Date(reading.createdAt).toLocaleDateString(
    locale === "en" ? "en-US" : "ko-KR",
    locale === "en"
      ? { year: "numeric", month: "short", day: "numeric" }
      : undefined,
  );
  const cardName = card
    ? locale === "en" && card.nameEn
      ? card.nameEn
      : card.nameKo
    : "타로";
  const orient = card?.isReversed ? "역방향" : "정방향";
  const dateForFile = new Date(reading.createdAt).toISOString().slice(0, 10);
  const interpretation = safeReadingText(reading.interpretation);
  const question = looksCorruptedText(reading.question ?? "")
    ? null
    : reading.question;
  const coreMessage = safeShortText(
    getFirstSentence(interpretation),
    "새로 뽑으면 오늘의 타로 메시지를 볼 수 있어요.",
  );

  return (
    <Card className="app-surface" data-capture-root>
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
              <Sparkles className="h-6 w-6" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary/75">
                Tarot Reading
              </p>
              <p className="font-mystic text-pretty-ko text-[15px] font-semibold text-foreground">
                한 장 타로 리포트
              </p>
              <p className="text-keep text-[15px] text-muted-foreground">
                카드가 보여주는 지금의 마음과 선택 기준
              </p>
            </div>
          </div>
          <p className="text-[15px] text-muted-foreground">{localeDateStr}</p>
        </div>
        {question ? (
          <p className="font-mystic text-pretty-ko text-base italic text-foreground/80">
            &ldquo;{question}&rdquo;
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-6">
        {card ? (
          <div className="tarot-reading-image-first flex flex-col items-center gap-3">
            <TarotCardDisplay
              id={card.id}
              nameKo={card.nameKo}
              nameEn={card.nameEn}
              isReversed={card.isReversed}
            />
            <CardOrientationBadge isReversed={card.isReversed} />
          </div>
        ) : null}

        <div className="tarot-reading-text-delayed rounded-2xl border border-primary/20 bg-primary/[0.07] px-4 py-3">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
            <p className="text-[12px] font-semibold">핵심 메시지</p>
          </div>
          <p className="mt-2 text-[15px] font-semibold leading-6 text-foreground">
            {coreMessage}
          </p>
        </div>

        <div className="tarot-reading-text-delayed space-y-4 border-t border-border/40 pt-6">
          <p className="whitespace-pre-line font-mystic leading-relaxed text-foreground/90">
            {breakSentences(interpretation)}
          </p>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <div className="flex items-center gap-2 text-primary">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
              <p className="text-[12px] font-semibold">오늘의 선택 기준</p>
            </div>
            <p className="mt-2 text-[14px] leading-6 text-muted-foreground">
              이 카드는 정답을 대신 정해주기보다, 지금 마음에 걸린 지점을
              더 선명하게 보게 해주는 신호로 읽으면 좋아요.
            </p>
          </div>
          {!subscribed ? <TarotUpgradeNudge /> : null}
          <TarotNextActions subscribed={subscribed} />
          <div className="flex items-center justify-end gap-2">
            {(() => {
              const tarotShareImageUrl = `/api/share/tarot?${new URLSearchParams({
                card: cardName,
                reversed: String(card?.isReversed ?? false),
                summary: interpretation.slice(0, 60),
                spread: "1장",
                date: localeDateStr,
                locale,
              })}`;
              return (
                <>
                  <SaveImageButton
                    imageUrl={tarotShareImageUrl}
                    filename={`인생의회전목마-타로-${dateForFile}.png`}
                  />
                  <ShareButton
                    title={`타로 한 장 · ${cardName}`}
                    text={`타로 한 장: ${cardName} (${orient})\n${interpretation}${question ? `\n\nQ. ${question}` : ""}`}
                    imageUrl={tarotShareImageUrl}
                  />
                </>
              );
            })()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TarotNextActions({ subscribed }: { subscribed: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-4">
      <div className="flex items-center gap-2 text-primary">
        <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
        <p className="text-[12px] font-semibold">카드 흐름 이어보기</p>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <NextActionLink
          href={subscribed ? ROUTES.tarot : `${ROUTES.pricing}?from=tarot`}
          icon={Sparkles}
          title="3장 타로"
          body={
            subscribed
              ? "과거, 현재, 미래 흐름으로 확장"
              : "라이트에서 3장 흐름 열기"
          }
        />
        <NextActionLink
          href={ROUTES.saju}
          icon={Compass}
          title="사주"
          body="내 기질과 선택 패턴 연결"
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
  href: string;
  icon: typeof Sparkles;
  title: string;
}) {
  return (
    <Link
      href={href as Route}
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

function TarotUpgradeNudge() {
  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/[0.06] px-4 py-3">
      <div className="flex items-start gap-3">
        <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-primary">
            더 깊게 보려면 3장 흐름까지 이어보세요
          </p>
          <p className="mt-1 text-[13px] leading-5 text-muted-foreground">
            지금 카드의 의미를 과거, 현재, 미래 흐름으로 더 선명하게
            확인할 수 있어요.
          </p>
          <Link
            href={`${ROUTES.pricing}?from=tarot` as Route}
            className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-primary"
          >
            라이트 구독 보기
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}

function getFirstSentence(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  const match = normalized.match(/^(.+?[.!?。？！])\s/);
  return match?.[1] ?? normalized.slice(0, 90);
}
