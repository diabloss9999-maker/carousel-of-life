import type { Metadata } from "next";
import Link from "next/link";
import { Check, Crown } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ROUTES,
  SUBSCRIPTION,
  FREE_DAILY_LIMITS,
  LITE_DAILY_LIMITS,
  PRO_DAILY_LIMITS,
} from "@/lib/constants";
import { getUser } from "@/lib/auth/get-user";
import { getSubscriptionTier } from "@/lib/payment/subscription-state";
import { formatKRW } from "@/lib/utils";
import { SubscribeCta } from "@/components/payment/subscribe-cta";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pricing");
  return {
    title: t("metaTitle"),
    description: t("metaDescriptionFull"),
    alternates: { canonical: "/pricing" },
  };
}

export default async function PricingPage() {
  const user = await getUser();
  const tier = user ? await getSubscriptionTier(user.id) : "free";
  const t = await getTranslations("pricing");

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16">
      <header className="mb-10 text-center space-y-2">
        <h1 className="font-mystic text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("h1")}
        </h1>
        <p className="text-muted-foreground">
          {t("h1Sub")}
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-3">
        {/* Free plan */}
        <Card className="app-surface">
          <CardHeader>
            <CardTitle className="font-mystic text-2xl">{t("freeName")}</CardTitle>
            <CardDescription>{t("freeDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="font-mystic text-3xl font-semibold">₩0</p>
            <ul className="space-y-2 text-[15px]">
              <Bullet>{t("fortuneLine", { n: FREE_DAILY_LIMITS.fortune })}</Bullet>
              <Bullet>{t("tarotOneLine", { n: FREE_DAILY_LIMITS.tarot })}</Bullet>
              <Bullet>{t("chatLine", { n: FREE_DAILY_LIMITS.chat })}</Bullet>
            </ul>
            {!user ? (
              <Button asChild className="w-full" variant="outline">
                <Link href={ROUTES.login}>{t("ctaFreeStart")}</Link>
              </Button>
            ) : tier === "free" ? (
              <Button className="w-full" variant="outline" disabled>
                {t("ctaCurrent")}
              </Button>
            ) : (
              <Button className="w-full" variant="outline" disabled>
                {t("ctaFree")}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Light plan */}
        <Card className="app-surface">
          <CardHeader>
            <CardTitle className="font-mystic text-2xl">
              {SUBSCRIPTION.lite.label}
            </CardTitle>
            <CardDescription>
              {t("lightDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="font-mystic text-3xl font-semibold">
              {formatKRW(SUBSCRIPTION.lite.monthlyPriceKRW)}
              <span className="text-base text-muted-foreground font-normal">
                {" "}
                {t("perMonth")}
              </span>
            </p>
            <ul className="space-y-2 text-[15px]">
              <Bullet>{t("fortuneLine", { n: LITE_DAILY_LIMITS.fortune })}</Bullet>
              <Bullet>{t("tarotLine", { n: LITE_DAILY_LIMITS.tarot })}</Bullet>
              <Bullet>{t("chatLine", { n: LITE_DAILY_LIMITS.chat })}</Bullet>
              <Bullet>{t("palmLine", { n: LITE_DAILY_LIMITS.palm })}</Bullet>
              <Bullet>{t("bulletZodiac")}</Bullet>
              <Bullet>{t("bulletTarotThree")}</Bullet>
              <Bullet>{t("bulletCompat")}</Bullet>
            </ul>
            {tier === "lite" ? (
              <Button className="w-full" variant="secondary" disabled>
                {t("ctaSubscribed")}
              </Button>
            ) : tier === "pro" ? (
              <Button className="w-full" variant="outline" disabled>
                {t("ctaProActive")}
              </Button>
            ) : !user ? (
              <Button asChild className="w-full" variant="secondary">
                <Link href={ROUTES.login}>{t("ctaLightStart")}</Link>
              </Button>
            ) : (
              <SubscribeCta
                plan="lite"
                userId={user.id}
                email={user.email ?? ""}
                label={t("ctaLightStart")}
                variant="secondary"
              />
            )}
          </CardContent>
        </Card>

        {/* Pro plan */}
        <Card className="app-surface ring-2 ring-primary/40 relative overflow-hidden">
          <div className="absolute top-0 right-0">
            <div className="flex items-center gap-1 bg-primary text-primary-foreground text-[15px] font-bold px-3 py-1.5 rounded-bl-xl">
              <Crown className="h-3.5 w-3.5" aria-hidden />
              {t("recommended")}
            </div>
          </div>

          <CardHeader className="pt-8">
            <CardTitle className="font-mystic text-2xl">
              {SUBSCRIPTION.pro.label}
            </CardTitle>
            <CardDescription>
              {t("proDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="font-mystic text-3xl font-semibold text-primary">
              {formatKRW(SUBSCRIPTION.pro.monthlyPriceKRW)}
              <span className="text-base text-muted-foreground font-normal">
                {" "}
                {t("perMonth")}
              </span>
            </p>
            <ul className="space-y-2 text-[15px]">
              <Bullet>{t("fortuneLine", { n: PRO_DAILY_LIMITS.fortune })}</Bullet>
              <Bullet>{t("bulletTarotCeltic", { n: PRO_DAILY_LIMITS.tarot })}</Bullet>
              <Bullet>{t("chatLine", { n: PRO_DAILY_LIMITS.chat })}</Bullet>
              <Bullet>{t("palmLine", { n: PRO_DAILY_LIMITS.palm })}</Bullet>
              <Bullet>{t("bulletZodiac")}</Bullet>
              <Bullet>{t("bulletLenormand")}</Bullet>
              <Bullet>{t("bulletRunes")}</Bullet>
              <Bullet>{t("bulletCompat")}</Bullet>
              <Bullet>{t("bulletSajuDeep")}</Bullet>
              <Bullet>{t("bulletGacha")}</Bullet>
            </ul>

            {tier === "pro" ? (
              <Button className="w-full" disabled>
                {t("ctaSubscribed")}
              </Button>
            ) : !user ? (
              <Button asChild className="w-full">
                <Link href={ROUTES.login}>{t("ctaProStart")}</Link>
              </Button>
            ) : (
              <SubscribeCta
                plan="pro"
                userId={user.id}
                email={user.email ?? ""}
                label={t("ctaProStart")}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <p className="mt-6 text-center text-[15px] text-muted-foreground">
        {t("footer")}
      </p>
    </main>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="h-4 w-4 mt-0.5 shrink-0 text-accent" aria-hidden />
      <span>{children}</span>
    </li>
  );
}
