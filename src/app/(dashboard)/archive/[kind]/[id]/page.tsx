import Link from "next/link";
import type { Metadata } from "next";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Heart, RefreshCw, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { CompatibilityCard } from "@/components/compatibility/compatibility-card";
import { FortuneCard } from "@/components/fortune/fortune-card";
import { TarotReadingCard } from "@/components/tarot/tarot-reading-card";
import { TarotThreeReadingCard } from "@/components/tarot/tarot-three-reading-card";
import { requireProfile } from "@/lib/auth/get-user";
import { ROUTES } from "@/lib/constants";
import {
  getHistoryItem,
  type HistoryKind,
} from "@/lib/history/service";
import { hasActiveSubscription } from "@/lib/payment/subscription-state";
import { formatKoreanDate } from "@/lib/utils";

interface ArchiveDetailPageProps {
  params: Promise<{ kind: string; id: string }>;
}

const VALID_KINDS = new Set<HistoryKind>([
  "fortune",
  "tarot",
  "compatibility",
]);

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("historyPage");
  return {
    title: t("detailMetaTitle"),
    description: t("detailMetaDescription"),
  };
}

export default async function ArchiveDetailPage({
  params,
}: ArchiveDetailPageProps) {
  const { kind: rawKind, id } = await params;
  if (!VALID_KINDS.has(rawKind as HistoryKind)) notFound();

  const kind = rawKind as HistoryKind;
  const { profile } = await requireProfile();
  const t = await getTranslations("historyPage");
  const [item, subscribed] = await Promise.all([
    getHistoryItem(profile.userId, kind, id),
    hasActiveSubscription(profile.userId).catch(() => false),
  ]);

  if (!item) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/archive"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-[13px] font-semibold text-muted-foreground transition hover:border-primary/30 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t("backToArchive")}
        </Link>
      </div>

      <header className="space-y-2">
        <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-primary/75">
          {t("detailCategory")}
        </p>
        <h1 className="font-mystic text-4xl font-semibold tracking-tight sm:text-5xl">
          {t("detailHeading")}
        </h1>
        <p className="max-w-2xl text-[15px] leading-6 text-muted-foreground">
          {t("detailIntro")}
        </p>
      </header>

      <section className="app-surface grid gap-3 rounded-2xl px-4 py-4 sm:grid-cols-3">
        <DetailInfo
          label={t("detailKindLabel")}
          value={kindLabel(item.kind, t)}
        />
        <DetailInfo
          label={t("detailDateLabel")}
          value={formatKoreanDate(item.date)}
        />
        <DetailInfo
          label={detailSubjectLabel(item.kind, t)}
          value={detailSubjectValue(item, t)}
        />
      </section>

      {item.kind === "fortune" ? <FortuneCard fortune={item.data} /> : null}
      {item.kind === "tarot" && item.data.spreadType === "three" ? (
        <TarotThreeReadingCard reading={item.data} />
      ) : null}
      {item.kind === "tarot" && item.data.spreadType !== "three" ? (
        <TarotReadingCard reading={item.data} subscribed={subscribed} />
      ) : null}
      {item.kind === "compatibility" ? (
        <CompatibilityCard reading={item.data} />
      ) : null}

      <section className="app-surface space-y-4 rounded-2xl px-5 py-5">
        <div className="space-y-1">
          <h2 className="font-mystic text-2xl font-semibold">
            {t("nextActionTitle")}
          </h2>
          <p className="text-[14px] leading-6 text-muted-foreground">
            {t("nextActionBody")}
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <DetailAction
            href={actionHref(item.kind)}
            icon={actionIcon(item.kind)}
            title={actionTitle(item.kind, t)}
            body={actionBody(item.kind, t)}
            primary
          />
          <DetailAction
            href="/archive"
            icon={ArrowLeft}
            title={t("backToArchive")}
            body={t("backToArchiveBody")}
          />
        </div>
      </section>
    </div>
  );
}

function DetailInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-[15px] font-semibold text-foreground">{value}</p>
    </div>
  );
}

function DetailAction({
  body,
  href,
  icon: Icon,
  primary = false,
  title,
}: {
  body: string;
  href: Route;
  icon: typeof Sparkles;
  primary?: boolean;
  title: string;
}) {
  return (
    <Link
      href={href}
      className={
        primary
          ? "rounded-2xl border border-primary/40 bg-primary px-4 py-4 text-primary-foreground transition hover:opacity-90"
          : "rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 transition hover:border-primary/30"
      }
    >
      <span className="flex items-center gap-2 text-[15px] font-semibold">
        <Icon className="h-4 w-4" aria-hidden />
        {title}
      </span>
      <span
        className={
          primary
            ? "mt-2 block text-[13px] leading-5 text-primary-foreground/80"
            : "mt-2 block text-[13px] leading-5 text-muted-foreground"
        }
      >
        {body}
      </span>
    </Link>
  );
}

function kindLabel(kind: HistoryKind, t: Awaited<ReturnType<typeof getTranslations>>) {
  if (kind === "fortune") return t("itemFortune");
  if (kind === "tarot") return t("itemTarot");
  return t("itemCompatShort");
}

function detailSubjectLabel(
  kind: HistoryKind,
  t: Awaited<ReturnType<typeof getTranslations>>,
) {
  if (kind === "fortune") return t("detailFortuneCategoryLabel");
  if (kind === "tarot") return t("detailTarotQuestionLabel");
  return t("detailCompatibilityPartnerLabel");
}

function detailSubjectValue(
  item: NonNullable<Awaited<ReturnType<typeof getHistoryItem>>>,
  t: Awaited<ReturnType<typeof getTranslations>>,
) {
  if (item.kind === "fortune") return t("itemFortune");
  if (item.kind === "tarot") {
    return item.data.question?.trim() || t("detailTarotNoQuestion");
  }
  return item.data.partnerName || t("detailCompatibilityNoPartner");
}

function actionHref(kind: HistoryKind): Route {
  if (kind === "fortune") return ROUTES.today as Route;
  if (kind === "tarot") return ROUTES.tarot as Route;
  return ROUTES.compatibility as Route;
}

function actionIcon(kind: HistoryKind) {
  if (kind === "fortune") return RefreshCw;
  if (kind === "tarot") return Sparkles;
  return Heart;
}

function actionTitle(
  kind: HistoryKind,
  t: Awaited<ReturnType<typeof getTranslations>>,
) {
  if (kind === "fortune") return t("actionFortuneTitle");
  if (kind === "tarot") return t("actionTarotTitle");
  return t("actionCompatTitle");
}

function actionBody(
  kind: HistoryKind,
  t: Awaited<ReturnType<typeof getTranslations>>,
) {
  if (kind === "fortune") return t("actionFortuneBody");
  if (kind === "tarot") return t("actionTarotBody");
  return t("actionCompatBody");
}
