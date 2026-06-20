import Link from "next/link";
import type { Metadata } from "next";
import type { Route } from "next";
import { ArrowRight, CalendarDays, Heart, Sparkles, TrendingUp } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { HistoryFilteredList } from "@/components/history/history-filtered-list";
import { requireProfile } from "@/lib/auth/get-user";
import { ROUTES } from "@/lib/constants";
import { getHistory, getHistoryCounts } from "@/lib/history/service";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("historyPage");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function ArchivePage() {
  const { profile } = await requireProfile();
  const t = await getTranslations("historyPage");
  const [items, counts] = await Promise.all([
    getHistory(profile.userId, 30),
    getHistoryCounts(profile.userId),
  ]);

  return (
    <div className="space-y-7">
      <header className="space-y-3">
        <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-primary/75">
          {t("category")}
        </p>
        <div className="space-y-2">
          <h1 className="font-mystic text-4xl font-semibold tracking-tight sm:text-5xl">
            {t("heading")}
          </h1>
          <p className="max-w-2xl text-[15px] leading-6 text-muted-foreground">
            {t("intro")}
          </p>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <CountCard label={t("totalRecords")} value={counts.total} />
        <CountCard label={t("itemFortune")} value={counts.fortune} />
        <CountCard label={t("itemTarot")} value={counts.tarot} />
        <CountCard label={t("itemCompatShort")} value={counts.compatibility} />
      </section>

      <WeeklyReportBanner total={counts.total} />

      {items.length > 0 ? <HistoryFilteredList items={items} /> : <EmptyArchive />}
    </div>
  );
}

function WeeklyReportBanner({ total }: { total: number }) {
  return (
    <section className="app-surface overflow-hidden rounded-2xl border border-primary/20 px-5 py-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <TrendingUp className="h-5 w-5" aria-hidden />
          </span>
          <div className="space-y-1">
            <p className="text-[13px] font-semibold text-primary">
              이번 주 흐름 리포트
            </p>
            <h2 className="text-xl font-semibold tracking-tight">
              쌓인 기록을 한 번에 요약해서 볼 수 있어요
            </h2>
            <p className="text-[14px] leading-6 text-muted-foreground">
              운세, 타로, 궁합 기록을 모아 이번 주 관심사와 흐름을 정리해요.
              현재 저장 기록 {total}개를 기준으로 볼 수 있어요.
            </p>
          </div>
        </div>
        <Link
          href={ROUTES.weekly as Route}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[14px] font-semibold text-primary-foreground transition hover:opacity-90"
        >
          리포트 보기
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}

function CountCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="app-surface rounded-2xl px-4 py-3">
      <p className="text-[13px] font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1.5 font-mystic text-2xl font-semibold tabular-nums sm:text-3xl">
        {value}
      </p>
    </div>
  );
}

async function EmptyArchive() {
  const t = await getTranslations("historyPage");

  return (
    <section className="app-surface space-y-5 rounded-2xl px-5 py-8 text-center">
      <div className="space-y-2">
        <h2 className="font-mystic text-2xl font-semibold">{t("emptyTitle")}</h2>
        <p className="mx-auto max-w-md text-[15px] leading-6 text-muted-foreground">
          {t("emptyBody")}
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <ArchiveAction
          href="/today"
          icon={CalendarDays}
          title={t("startFortune")}
          body={t("startFortuneBody")}
        />
        <ArchiveAction
          href={ROUTES.tarot}
          icon={Sparkles}
          title={t("startTarot")}
          body={t("startTarotBody")}
        />
        <ArchiveAction
          href={ROUTES.compatibility}
          icon={Heart}
          title={t("startCompat")}
          body={t("startCompatBody")}
        />
      </div>
    </section>
  );
}

function ArchiveAction({
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
      className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-left transition hover:border-primary/30 hover:bg-white/[0.08]"
    >
      <span className="flex items-center gap-2 text-primary">
        <Icon className="h-4 w-4" aria-hidden />
        <span className="text-[14px] font-semibold text-foreground">
          {title}
        </span>
      </span>
      <span className="mt-2 block text-[13px] leading-5 text-muted-foreground">
        {body}
      </span>
    </Link>
  );
}
