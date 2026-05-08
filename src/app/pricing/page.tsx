import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES, SUBSCRIPTION, FREE_DAILY_LIMITS } from "@/lib/constants";
import { getUser } from "@/lib/auth/get-user";
import { hasActiveSubscription } from "@/lib/payment/subscription-state";
import { formatKRW } from "@/lib/utils";

export const metadata: Metadata = {
  title: "멤버십",
  description:
    "무료와 프리미엄 멤버십을 비교해보세요. 프리미엄은 타로 3장 스프레드, 사주 심층 분석, 무제한 풀이를 제공해요.",
  alternates: { canonical: "/pricing" },
};

export default async function PricingPage() {
  const user = await getUser();
  const subscribed = user ? await hasActiveSubscription(user.id) : false;

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <header className="mb-10 text-center space-y-2">
        <h1 className="font-mystic text-3xl font-semibold tracking-tight sm:text-4xl">
          두 가지 멤버십
        </h1>
        <p className="text-muted-foreground">
          당신에게 맞는 멤버십을 골라보세요.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2">
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
            ) : (
              <Button className="w-full" variant="outline" disabled>
                현재 사용 중
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="app-surface ring-1 ring-primary/20">
          <CardHeader>
            <CardTitle className="font-mystic text-2xl">프리미엄</CardTitle>
            <CardDescription>
              한도 없이 모든 풀이를 받을 수 있어요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="font-mystic text-3xl font-semibold">
              {formatKRW(SUBSCRIPTION.monthlyPriceKRW)}
              <span className="text-base text-muted-foreground"> / 월</span>
            </p>
            <ul className="space-y-2 text-sm">
              <Bullet>오늘의 운세 무제한</Bullet>
              <Bullet>타로 풀카드 스프레드 (켈틱 크로스 등)</Bullet>
              <Bullet>주술사 문답 무제한</Bullet>
              <Bullet>궁합 풀이 무제한</Bullet>
              <Bullet>월간·연간 운세 리포트</Bullet>
            </ul>
            {subscribed ? (
              <Button className="w-full" disabled>
                구독 중
              </Button>
            ) : !user ? (
              <Button asChild className="w-full">
                <Link href={ROUTES.signup}>프리미엄 시작</Link>
              </Button>
            ) : (
              <Button asChild className="w-full">
                <a href="/api/checkout">프리미엄 시작</a>
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
