import type { Metadata } from "next";
import Link from "next/link";
import { Check, Crown } from "lucide-react";

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
} from "@/lib/constants";
import { getUser } from "@/lib/auth/get-user";
import { getSubscriptionTier } from "@/lib/payment/subscription-state";
import { formatKRW } from "@/lib/utils";

export const metadata: Metadata = {
  title: "멤버십",
  description:
    "무료 / 라이트 / 프로 멤버십을 비교해보세요. 라이트는 일일 한도를 크게 늘려주고, 프로는 모든 풀이를 무제한으로 제공해요.",
  alternates: { canonical: "/pricing" },
};

export default async function PricingPage() {
  const user = await getUser();
  const tier = user ? await getSubscriptionTier(user.id) : "free";

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16">
      <header className="mb-10 text-center space-y-2">
        <h1 className="font-mystic text-3xl font-semibold tracking-tight sm:text-4xl">
          세 가지 멤버십
        </h1>
        <p className="text-muted-foreground">
          당신에게 맞는 멤버십을 골라보세요.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-3">
        {/* 무료 플랜 */}
        <Card className="app-surface">
          <CardHeader>
            <CardTitle className="font-mystic text-2xl">무료</CardTitle>
            <CardDescription>매일 가벼운 풀이를 받아보세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="font-mystic text-3xl font-semibold">₩0</p>
            <ul className="space-y-2 text-sm">
              <Bullet>오늘의 운세 일일 {FREE_DAILY_LIMITS.fortune}회</Bullet>
              <Bullet>타로 한 장 일일 {FREE_DAILY_LIMITS.tarot}회</Bullet>
              <Bullet>주술사 문답 일일 {FREE_DAILY_LIMITS.chat}회</Bullet>
            </ul>
            {!user ? (
              <Button asChild className="w-full" variant="outline">
                <Link href={ROUTES.signup}>무료로 시작</Link>
              </Button>
            ) : tier === "free" ? (
              <Button className="w-full" variant="outline" disabled>
                현재 사용 중
              </Button>
            ) : (
              <Button className="w-full" variant="outline" disabled>
                무료 플랜
              </Button>
            )}
          </CardContent>
        </Card>

        {/* 라이트 플랜 */}
        <Card className="app-surface">
          <CardHeader>
            <CardTitle className="font-mystic text-2xl">
              {SUBSCRIPTION.lite.label}
            </CardTitle>
            <CardDescription>
              일일 한도를 크게 늘려 더 자주 만나봐요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="font-mystic text-3xl font-semibold">
              {formatKRW(SUBSCRIPTION.lite.monthlyPriceKRW)}
              <span className="text-base text-muted-foreground font-normal">
                {" "}
                / 월
              </span>
            </p>
            <ul className="space-y-2 text-sm">
              <Bullet>오늘의 운세 일일 {LITE_DAILY_LIMITS.fortune}회</Bullet>
              <Bullet>타로 일일 {LITE_DAILY_LIMITS.tarot}회</Bullet>
              <Bullet>주술사 문답 일일 {LITE_DAILY_LIMITS.chat}회</Bullet>
              <Bullet>별자리·십이간지 운세</Bullet>
              <Bullet>타로 3장 스프레드</Bullet>
              <Bullet>궁합 풀이</Bullet>
            </ul>
            {tier === "lite" ? (
              <Button className="w-full" variant="secondary" disabled>
                구독 중
              </Button>
            ) : tier === "pro" ? (
              <Button className="w-full" variant="outline" disabled>
                프로 사용 중
              </Button>
            ) : !user ? (
              <Button asChild className="w-full" variant="secondary">
                <Link href={ROUTES.signup}>라이트 시작</Link>
              </Button>
            ) : (
              <Button asChild className="w-full" variant="secondary">
                <a href="/api/checkout">라이트 시작</a>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* 프로 플랜 */}
        <Card className="app-surface ring-2 ring-primary/40 relative overflow-hidden">
          <div className="absolute top-0 right-0">
            <div className="flex items-center gap-1 bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-bl-xl">
              <Crown className="h-3.5 w-3.5" aria-hidden />
              추천
            </div>
          </div>

          <CardHeader className="pt-8">
            <CardTitle className="font-mystic text-2xl">
              {SUBSCRIPTION.pro.label}
            </CardTitle>
            <CardDescription>
              한도 없이 모든 풀이를 받을 수 있어요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="font-mystic text-3xl font-semibold text-primary">
              {formatKRW(SUBSCRIPTION.pro.monthlyPriceKRW)}
              <span className="text-base text-muted-foreground font-normal">
                {" "}
                / 월
              </span>
            </p>
            <ul className="space-y-2 text-sm">
              <Bullet>오늘의 운세 무제한</Bullet>
              <Bullet>타로 무제한 (켈틱 크로스 포함)</Bullet>
              <Bullet>주술사 문답 무제한</Bullet>
              <Bullet>별자리·십이간지 운세</Bullet>
              <Bullet>르노르망 9장·그랑 타블로</Bullet>
              <Bullet>룬 5장·9장 스프레드</Bullet>
              <Bullet>궁합 풀이 무제한</Bullet>
              <Bullet>사주 심층 분석 (평생 보관)</Bullet>
              <Bullet>카드 가챠 매일 3장</Bullet>
            </ul>

            {tier === "pro" ? (
              <Button className="w-full" disabled>
                구독 중
              </Button>
            ) : !user ? (
              <Button asChild className="w-full">
                <Link href={ROUTES.signup}>프로 시작</Link>
              </Button>
            ) : (
              <Button asChild className="w-full">
                <a href="/api/checkout/pro">프로 시작</a>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        결제는 Lemon Squeezy 가 안전하게 처리해요. 언제든 취소할 수 있어요.
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
