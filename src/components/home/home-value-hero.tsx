import Link from "next/link";
import type { Route } from "next";
import {
  ArrowRight,
  MessageCircle,
  Sparkles,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";

const HERO_ACTIONS: Array<{
  href: Route;
  labelKey: "primaryCta" | "tarotCta" | "chatCta";
  icon: LucideIcon;
  isPrimary?: boolean;
}> = [
  {
    href: "/today?category=general#today-reading" as Route,
    labelKey: "primaryCta",
    icon: Sun,
    isPrimary: true,
  },
  {
    href: "/tarot#tarot" as Route,
    labelKey: "tarotCta",
    icon: Sparkles,
  },
  {
    href: "/chat" as Route,
    labelKey: "chatCta",
    icon: MessageCircle,
  },
];

export async function HomeValueHero() {
  const t = await getTranslations("today.hero");

  return (
    <section
      aria-labelledby="today-value-heading"
      className="home-value-hero liquid-glass-panel space-y-4 rounded-[28px] p-5 sm:p-7"
    >
      <div className="space-y-2.5">
        <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {t("eyebrow")}
        </p>
        <h2
          id="today-value-heading"
          className="max-w-3xl text-2xl font-semibold leading-tight tracking-tight sm:text-4xl"
        >
          {t("headline")}
        </h2>
        <p className="max-w-2xl text-[15px] leading-7 text-muted-foreground sm:text-base">
          {t("body")}
        </p>
      </div>

      <div className="home-primary-actions grid gap-2 sm:grid-cols-3">
        {HERO_ACTIONS.map((action) => {
          const Icon = action.icon;
          return action.isPrimary ? (
            <Button
              asChild
              key={action.href as string}
              size="lg"
              className="home-primary-action h-12 justify-between px-4"
              data-keep-color
            >
              <Link href={action.href}>
                <span className="inline-flex items-center gap-2">
                  <Icon className="h-4 w-4" aria-hidden />
                  {t(action.labelKey)}
                </span>
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          ) : (
            <Link
              key={action.href as string}
              href={action.href}
              className="home-secondary-action app-surface flex min-h-12 items-center justify-between gap-3 rounded-2xl px-4 text-[15px] font-semibold transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <span className="inline-flex items-center gap-2">
                <Icon className="h-4 w-4 opacity-75" aria-hidden />
                {t(action.labelKey)}
              </span>
              <ArrowRight className="h-4 w-4 opacity-60" aria-hidden />
            </Link>
          );
        })}
      </div>

      <p className="text-[13px] leading-6 text-muted-foreground">
        {t("freeHint")}
      </p>
    </section>
  );
}
