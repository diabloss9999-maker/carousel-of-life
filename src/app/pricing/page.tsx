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
import { ExternalPaymentNotice } from "@/components/payment/external-payment-notice";
import { PaymentPendingNotice } from "@/components/payment/payment-pending-notice";

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

  // 결제 활성화 여부 — 환경변수 검증 (server-side, 보안 OK)
  const portOneReady =
    !!process.env.NEXT_PUBLIC_PORTONE_STORE_ID &&
    !!process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY;
  const tossReady = !!process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
  const paymentReady = portOneReady || tossReady;

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

      {/* 결제 준비 중이면 안내 배너 */}
      {!paymentReady ? (
        <div className="mb-8">
          <PaymentPendingNotice />
        </div>
      ) : null}

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

      {/* 구매·결제 안내 — NHN KCP 가맹점 심사 4번/5번 요건 충족용 명시.
          상품 가격·결제 절차·취소·환불 흐름을 상세 페이지에 명문화. */}
      <section
        aria-labelledby="purchase-guide-heading"
        className="mt-12 rounded-2xl border border-border/40 bg-card/40 p-6 space-y-4"
      >
        <h2
          id="purchase-guide-heading"
          className="font-mystic text-xl font-semibold"
        >
          구매·결제 안내
        </h2>
        <dl className="space-y-3 text-[15px] leading-relaxed">
          <PurchaseRow
            label="결제 수단"
            value="신용카드 / 체크카드 (NHN KCP 가맹 — 국내 카드사 전체 지원)"
          />
          <PurchaseRow
            label="결제 방식"
            value="월 자동 정기결제 (빌링키 방식). 매월 같은 날짜에 자동 청구됩니다."
          />
          <PurchaseRow
            label="구매 절차"
            value="① 위에서 라이트 또는 프로 상품 선택 → ② [결제하기] 버튼 클릭 → ③ NHN KCP 결제창에서 카드 정보 입력 → ④ 결제 완료 즉시 멤버십 활성화."
          />
          <PurchaseRow
            label="결제 금액"
            value={`상기 표시된 금액(라이트 ${formatKRW(SUBSCRIPTION.lite.monthlyPriceKRW)} / 프로 ${formatKRW(SUBSCRIPTION.pro.monthlyPriceKRW)})이 결제창에서 청구되는 실 금액과 동일합니다.`}
          />
          <PurchaseRow
            label="해지 및 환불"
            value="설정 페이지에서 언제든 자동결제 해지 가능. 환불 정책은 환불정책 페이지를 참고해 주세요."
          />
          <PurchaseRow
            label="상품 제공 사업자"
            value="레오나르도코드 (사업자등록번호 859-35-01908, 통신판매업신고 제 2026-서울노원-0765 호)"
          />
        </dl>
      </section>

      <div className="mt-8">
        <ExternalPaymentNotice />
      </div>
    </main>
  );
}

function PurchaseRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-[8rem,1fr] sm:gap-3">
      <dt className="font-medium text-muted-foreground">{label}</dt>
      <dd className="text-foreground/90 break-keep">{value}</dd>
    </div>
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
