"use client";

import Link from "next/link";
import type { Route } from "next";
import { useLocale } from "next-intl";
import { ArrowRight, CalendarDays, Compass, Sparkles } from "lucide-react";

import { ContinueWithMemberCta } from "@/components/chat/continue-with-member-cta";
import { DailyActionGuide } from "@/components/fortune/daily-action-guide";
import { LuckyInfo } from "@/components/fortune/lucky-info";
import { SaveImageButton } from "@/components/shared/save-image-button";
import { ShareButton } from "@/components/shared/share-button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { DailyFortune } from "@/db/schema";
import { ROUTES, type FortuneCategoryId } from "@/lib/constants";
import {
  sanitizeFortuneCopy,
  sanitizeFortuneTitle,
} from "@/lib/fortune/sanitize-copy";
import { breakSentences } from "@/lib/utils";

interface FortuneCardProps {
  fortune: DailyFortune;
}

const CATEGORY_LABEL: Record<FortuneCategoryId, string> = {
  general: "종합운세",
  love: "연애운",
  money: "재물운",
  career: "커리어운",
  health: "건강운",
  study: "공부운",
  zodiac: "별자리 운세",
  chinese_zodiac: "띠별 운세",
};

export function FortuneCard({ fortune }: FortuneCardProps) {
  const locale = useLocale();
  const category = fortune.category as FortuneCategoryId;
  const label = CATEGORY_LABEL[category] ?? "오늘의 운세";
  const title = sanitizeFortuneTitle(fortune.title);
  const content = sanitizeFortuneCopy(fortune.content);
  const continuePrompt =
    "방금 본 오늘 운세를 내가 어떻게 받아들이고 움직이면 좋을지 같이 정리해줘.";
  const contextSummary = `${title} · ${content.replace(/\s+/g, " ").slice(0, 90)}`;

  function buildShareImageUrl(): string {
    const params = new URLSearchParams({
      title,
      score: String(fortune.score ?? 70),
      category: label,
      content: content.slice(0, 80),
      ...(fortune.luckyColor && { color: fortune.luckyColor }),
      ...(fortune.luckyNumber && { number: String(fortune.luckyNumber) }),
      ...(fortune.luckyDirection && { direction: fortune.luckyDirection }),
      date: new Date(fortune.createdAt).toLocaleDateString(
        locale === "en" ? "en-US" : "ko-KR",
      ),
      locale,
    });
    return `/api/share/fortune?${params}`;
  }

  return (
    <Card
      className="liquid-glass-panel liquid-fortune-card p-5 ring-1 ring-border/40 sm:p-7"
      data-capture-root
    >
      <CardHeader className="space-y-0 p-0">
        <div className="liquid-oracle-header flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
              <CalendarDays className="h-6 w-6" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-primary/75">
                Daily Reading
              </p>
              <p className="font-mystic text-pretty-ko text-lg font-semibold leading-tight text-foreground/90">
                {label} 리포트
              </p>
              <p className="text-keep mt-1 text-[15px] text-muted-foreground">
                오늘의 흐름을 생활 기준으로 정리했어요.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <span className="liquid-character-chip px-3 py-1 text-[15px] text-muted-foreground">
              {fortune.fortuneDate}
            </span>
          </div>
        </div>

        <h2 className="font-mystic text-balance-ko px-1 pt-5 text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
          {title}
        </h2>
      </CardHeader>

      <CardContent className="space-y-5 p-0 pt-5">
        <p className="liquid-reading-copy whitespace-pre-line font-mystic text-base leading-loose text-foreground/90">
          {breakSentences(content)}
        </p>

        <LuckyInfo
          color={fortune.luckyColor ?? null}
          number={fortune.luckyNumber ?? null}
          direction={fortune.luckyDirection ?? null}
        />

        <DailyActionGuide fortune={fortune} />

        <ContinueWithMemberCta
          sourceLabel="오늘 운세"
          prompt={continuePrompt}
          contextTitle={`${label} · ${title}`}
          contextSummary={contextSummary}
        />

        <FortuneNextActions />

        <div className="liquid-share-row flex flex-wrap items-center justify-end gap-2">
          <SaveImageButton
            imageUrl={buildShareImageUrl()}
            filename={`인생의회전목마-${label}.png`}
            className="liquid-soft-button"
          />
          <ShareButton
            title={`[${label}] ${title}`}
            text={`[${label}] ${title}\n${content}\n\n행운 색: ${fortune.luckyColor ?? "-"} · 숫자: ${fortune.luckyNumber ?? "-"} · 방향: ${fortune.luckyDirection ?? "-"}`}
            imageUrl={buildShareImageUrl()}
            className="liquid-soft-button"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function FortuneNextActions() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-4">
      <div className="flex items-center gap-2 text-primary">
        <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
        <p className="text-[12px] font-semibold">다음으로 이어보기</p>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <NextActionLink
          href={ROUTES.tarot}
          icon={Sparkles}
          title="타로"
          body="지금 마음에 걸리는 선택을 카드로 확인"
        />
        <NextActionLink
          href={ROUTES.saju}
          icon={Compass}
          title="사주"
          body="오늘 흐름을 내 기질과 연결해서 보기"
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
        <span className="text-[13px] font-semibold text-foreground">
          {title}
        </span>
      </span>
      <span className="mt-1.5 block text-[12px] leading-5 text-muted-foreground">
        {body}
      </span>
    </Link>
  );
}
