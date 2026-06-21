import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import type { Route } from "next";
import { cookies } from "next/headers";
import {
  ArrowRight,
  Check,
  Crown,
  Info,
  LockKeyhole,
  Sparkles,
} from "lucide-react";

import { SubscribeCta } from "@/components/payment/subscribe-cta";
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
} from "@/lib/constants";
import { BUSINESS_INFO } from "@/lib/constants/business-info";
import { getUser } from "@/lib/auth/get-user";
import { getSubscriptionTier } from "@/lib/payment/subscription-state";
import { formatKRW } from "@/lib/utils";

export const metadata: Metadata = {
  title: "멤버십",
  description:
    "인생의 회전목마 라이트·프로 멤버십으로 오늘운세, 타로, 사주, 월간·신년 심층 리포트를 더 깊게 열어보세요.",
  alternates: { canonical: "/pricing" },
};

type PricingPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type PricingContext = {
  afterSubscribeLabel: string;
  backHref: Route;
  description: string;
  liteFit: string;
  pricingHref: string;
  proFit: string;
  recommendation: string;
  recommendedPlan: "lite" | "pro";
  returnTo: string;
  title: string;
  unlocks: string[];
};

const PLAN_FEATURES = {
  free: [
    "오늘운세 기본 제공",
    "타로 1장 기본 제공",
    "멤버 대화 기본 제공",
  ],
  lite: [
    "3장 타로와 월간 흐름 해석",
    "별자리·띠별 운세 확장",
    "멤버와 더 오래 이어지는 대화",
    "오늘운세 이후 다음 행동 추천",
    "가벼운 심층 리포트 보관",
  ],
  pro: [
    "사주 심층 풀이 전체 해금",
    "월간·신년 심층 리포트",
    "궁합 심층 풀이",
    "멤버와 가장 깊게 이어지는 대화",
    "보관함·컬렉션 확장",
    "장기 흐름 리포트 우선 제공",
  ],
} as const;

const COMPARISON_ROWS = [
  { label: "오늘운세", free: "기본", lite: "확장 해석", pro: "깊은 흐름 연결" },
  { label: "타로", free: "1장", lite: "3장 스프레드", pro: "고급 스프레드" },
  { label: "사주", free: "기본 계산", lite: "기본+요약", pro: "심층 풀이" },
  { label: "월간운세", free: "기본", lite: "심층 리포트", pro: "심층 리포트" },
  { label: "2026 신년운세", free: "기본", lite: "미리보기", pro: "심층 리포트" },
  { label: "멤버 대화", free: "짧게 체험", lite: "자주 대화", pro: "긴 대화" },
] as const;

const PLAN_USAGE_NOTES = {
  free: "멤버 대화 10회/일",
  lite: "멤버 대화 50회/일",
  pro: "멤버 대화 120회/일",
} as const;

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const params = (await searchParams) ?? {};
  const from = typeof params.from === "string" ? params.from : undefined;
  const context = getPricingContext(from);

  const cookieStore = await cookies();
  const appPlatform = cookieStore.get("col_platform")?.value;
  if (appPlatform === "ios") {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-20">
        <div className="app-surface space-y-3 rounded-2xl p-8 text-center">
          <h1 className="font-mystic text-2xl font-semibold tracking-tight">
            멤버십
          </h1>
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            iOS 앱에서는 현재 앱 내 결제를 제공하지 않아요. 무료 기능은 그대로 이용할 수 있습니다.
          </p>
        </div>
      </main>
    );
  }

  const user = await getUser();
  const tier = user ? await getSubscriptionTier(user.id) : "free";

  const portOneReady =
    !!process.env.NEXT_PUBLIC_PORTONE_STORE_ID &&
    !!process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY;
  const paymentReady = appPlatform === "android" || portOneReady;

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-6 sm:py-12">
      <header className="reading-hero mb-7 text-center sm:px-8">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-[16px] bg-primary/[0.09] text-primary ring-1 ring-primary/10">
          <Sparkles className="h-5 w-5" aria-hidden />
        </div>
        <p className="reading-kicker mx-auto mt-4 w-fit">
          Membership
        </p>
        <h1 className="mt-2 font-mystic text-3xl font-semibold tracking-tight sm:text-5xl">
          {context.title}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-7 text-muted-foreground">
          {context.description}
        </p>
      </header>

      {!paymentReady ? (
        <div data-hide-in-app className="mb-8">
          <PaymentSetupNotice />
        </div>
      ) : null}

      <section className="mb-8 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <div className="app-surface rounded-[24px] border p-5">
          <div className="flex items-center gap-2">
            <LockKeyhole className="h-5 w-5 text-primary" aria-hidden />
            <h2 className="text-xl font-semibold">멤버십에서 열리는 것</h2>
          </div>
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {context.unlocks.map((item) => (
              <Benefit key={item}>{item}</Benefit>
            ))}
          </div>
        </div>
        <div className="app-surface rounded-[24px] border border-primary/15 p-5">
          <p className="text-[13px] font-semibold text-primary">추천 흐름</p>
          <h2 className="mt-2 text-xl font-semibold">{context.recommendation}</h2>
          <p className="mt-3 text-[14px] leading-6 text-muted-foreground">
            무료로 먼저 흐름을 확인한 뒤, 더 구체적인 풀이가 필요할 때 멤버십을 열면 좋아요.
          </p>
          <p className="mt-3 rounded-2xl border border-primary/15 bg-primary/5 px-3 py-2 text-[13px] font-medium text-primary">
            결제 후 {context.afterSubscribeLabel} 화면으로 바로 돌아가요.
          </p>
          <Link
            href={context.backHref}
            className="mt-4 inline-flex items-center gap-2 text-[14px] font-semibold text-primary"
          >
            보고 있던 리포트로 돌아가기
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>

      <PlanDecisionStrip context={context} />

      <div className="grid gap-5 lg:grid-cols-3">
        <PlanCard
          name="무료"
          description="처음 써보고 감을 잡기 좋아요."
          price="0원"
          features={PLAN_FEATURES.free}
          current={tier === "free"}
          cta={
            !user ? (
              <Button asChild className="w-full" variant="outline">
                <Link href={ROUTES.login}>무료로 시작하기</Link>
              </Button>
            ) : (
              <Button className="w-full" variant="outline" disabled>
                {tier === "free" ? "현재 이용 중" : "무료 플랜"}
              </Button>
            )
          }
          footer={PLAN_USAGE_NOTES.free}
        />

        <PlanCard
          name={SUBSCRIPTION.lite.label}
          description="가볍게 자주 보는 사용자에게 좋아요."
          price={formatKRW(SUBSCRIPTION.lite.monthlyPriceKRW)}
          priceSuffix="/ 월"
          features={PLAN_FEATURES.lite}
          current={tier === "lite"}
          recommended={context.recommendedPlan === "lite"}
          cta={renderPlanCta({
            active: tier === "lite",
            blocked: tier === "pro",
            email: user?.email ?? "",
            label: "라이트 멤버십 시작",
            loginHref: `${ROUTES.login}?redirect=${encodeURIComponent(context.pricingHref)}`,
            loginLabel: "로그인하고 라이트 시작",
            plan: "lite",
            returnTo: context.returnTo,
            userId: user?.id,
            variant: "secondary",
          })}
          footer={PLAN_USAGE_NOTES.lite}
        />

        <PlanCard
          name={SUBSCRIPTION.pro.label}
          description="심층 풀이와 긴 대화를 모두 쓰고 싶다면 추천해요."
          price={formatKRW(SUBSCRIPTION.pro.monthlyPriceKRW)}
          priceSuffix="/ 월"
          features={PLAN_FEATURES.pro}
          current={tier === "pro"}
          recommended={context.recommendedPlan === "pro"}
          cta={renderPlanCta({
            active: tier === "pro",
            email: user?.email ?? "",
            label: "프로 멤버십 시작",
            loginHref: `${ROUTES.login}?redirect=${encodeURIComponent(context.pricingHref)}`,
            loginLabel: "로그인하고 프로 시작",
            plan: "pro",
            returnTo: context.returnTo,
            userId: user?.id,
          })}
          footer={PLAN_USAGE_NOTES.pro}
        />
      </div>

      <ComparisonTable />
      <PurchaseGuide />
      <ExternalPaymentGuide />
    </main>
  );
}

function renderPlanCta({
  active,
  blocked = false,
  email,
  label,
  loginHref,
  loginLabel,
  plan,
  returnTo,
  userId,
  variant,
}: {
  active: boolean;
  blocked?: boolean;
  email: string;
  label: string;
  loginHref: string;
  loginLabel: string;
  plan: "lite" | "pro";
  returnTo: string;
  userId?: string;
  variant?: "default" | "secondary";
}) {
  if (active) {
    return (
      <Button className="w-full" variant={variant} disabled>
        이용 중
      </Button>
    );
  }

  if (blocked) {
    return (
      <Button className="w-full" variant="outline" disabled>
        프로 이용 중
      </Button>
    );
  }

  if (!userId) {
    return (
      <Button asChild className="w-full" variant={variant}>
        <Link href={loginHref as never}>{loginLabel}</Link>
      </Button>
    );
  }

  return (
    <SubscribeCta
      plan={plan}
      userId={userId}
      email={email}
      label={label}
      returnTo={returnTo}
      variant={variant}
    />
  );
}

function PlanDecisionStrip({ context }: { context: PricingContext }) {
  return (
    <section className="mb-5 grid gap-3 md:grid-cols-2">
      <div
        className={`rounded-[20px] border p-4 ${
          context.recommendedPlan === "lite"
            ? "border-primary/25 bg-primary/[0.07] ring-1 ring-primary/15"
            : "border-black/10 bg-white/60"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-[13px] font-semibold text-primary">라이트가 맞는 경우</p>
          {context.recommendedPlan === "lite" ? (
            <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground">
              지금 추천
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-[14px] leading-6 text-muted-foreground">{context.liteFit}</p>
      </div>
      <div
        className={`rounded-[20px] border p-4 ${
          context.recommendedPlan === "pro"
            ? "border-primary/25 bg-primary/[0.07] ring-1 ring-primary/15"
            : "border-black/10 bg-white/60"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-[13px] font-semibold text-primary">프로가 맞는 경우</p>
          {context.recommendedPlan === "pro" ? (
            <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground">
              지금 추천
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-[14px] leading-6 text-muted-foreground">{context.proFit}</p>
      </div>
    </section>
  );
}

function PlanCard({
  cta,
  current,
  description,
  features,
  footer,
  name,
  price,
  priceSuffix,
  recommended,
}: {
  cta: ReactNode;
  current: boolean;
  description: string;
  features: readonly string[];
  footer: string;
  name: string;
  price: string;
  priceSuffix?: string;
  recommended?: boolean;
}) {
  return (
    <Card className={`app-surface plan-glass-card relative overflow-hidden rounded-[24px] ${recommended ? "ring-1 ring-primary/30" : ""}`}>
      {recommended ? (
        <div className="absolute right-0 top-0">
          <div className="flex items-center gap-1 rounded-bl-[14px] bg-[#16181d] px-3 py-1.5 text-[13px] font-bold text-white">
            <Crown className="h-3.5 w-3.5" aria-hidden />
            추천
          </div>
        </div>
      ) : null}
      <CardHeader className={recommended ? "pt-8" : undefined}>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="font-mystic text-2xl">{name}</CardTitle>
          {current ? (
            <span className="rounded-full border border-primary/25 px-2 py-0.5 text-[11px] font-semibold text-primary">
              현재 이용 중
            </span>
          ) : null}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className={`font-mystic text-3xl font-semibold ${recommended ? "text-primary" : ""}`}>
          {price}
          {priceSuffix ? (
            <span className="text-base font-normal text-muted-foreground"> {priceSuffix}</span>
          ) : null}
        </p>
        <p className="text-[13px] text-muted-foreground">{footer}</p>
        <ul className="space-y-2 text-[15px]">
          {features.map((feature) => (
            <Bullet key={feature}>{feature}</Bullet>
          ))}
        </ul>
        {cta}
      </CardContent>
    </Card>
  );
}

function ComparisonTable() {
  return (
    <section className="mt-10 app-surface rounded-[24px] border p-5">
      <h2 className="text-xl font-semibold">무료와 멤버십 비교</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-[14px]">
          <thead className="text-muted-foreground">
            <tr className="border-b border-white/10">
              <th className="py-3 pr-4 font-semibold">기능</th>
              <th className="px-4 py-3 font-semibold">무료</th>
              <th className="px-4 py-3 font-semibold">라이트</th>
              <th className="px-4 py-3 font-semibold">프로</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map((row) => (
              <tr key={row.label} className="border-b border-white/5 last:border-0">
                <td className="py-3 pr-4 font-medium">{row.label}</td>
                <td className="px-4 py-3 text-muted-foreground">{row.free}</td>
                <td className="px-4 py-3">{row.lite}</td>
                <td className="px-4 py-3 font-medium text-primary">{row.pro}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PurchaseGuide() {
  return (
    <section
      data-hide-in-app
      aria-labelledby="purchase-guide-heading"
      className="mt-10 space-y-4 rounded-2xl border border-border/40 bg-card/40 p-5"
    >
      <h2 id="purchase-guide-heading" className="font-mystic text-xl font-semibold">
        구매·결제 안내
      </h2>
      <dl className="space-y-3 text-[15px] leading-relaxed">
        <PurchaseRow label="결제 수단" value="신용카드 / 체크카드 결제를 지원해요." />
        <PurchaseRow label="결제 방식" value="매월 같은 날짜에 자동 결제되는 정기 멤버십이에요." />
        <PurchaseRow label="구매 절차" value="상품 선택 → 결제하기 버튼 클릭 → 결제창에서 정보 입력 → 결제 완료 즉시 멤버십 활성화." />
        <PurchaseRow
          label="결제 금액"
          value={`라이트 ${formatKRW(SUBSCRIPTION.lite.monthlyPriceKRW)} / 프로 ${formatKRW(SUBSCRIPTION.pro.monthlyPriceKRW)}가 매월 청구돼요.`}
        />
        <PurchaseRow label="해지 방법" value="설정 → 멤버십에서 언제든 해지할 수 있어요. 해지해도 이미 결제된 기간까지는 이용할 수 있어요." />
        <PurchaseRow label="환불 안내" value="디지털 콘텐츠가 제공된 뒤에는 사용량에 따라 환불이 제한될 수 있어요. 자세한 내용은 환불 정책을 확인해 주세요." />
        <PurchaseRow label="고객 문의" value={`결제·환불 문의는 ${BUSINESS_INFO.email} 으로 보내주세요.`} />
      </dl>
      <Link
        href="/refund"
        className="inline-flex items-center gap-2 text-[14px] font-semibold text-primary"
      >
        환불 정책 보기
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </section>
  );
}

function ExternalPaymentGuide() {
  return (
    <div data-hide-in-app className="mt-8">
      <div className="app-surface rounded-2xl p-4 text-[15px]">
        <div className="flex items-start gap-2.5">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <div className="space-y-1 leading-relaxed text-muted-foreground">
            <p className="font-medium text-foreground">결제 시스템 안내</p>
            <p>
              웹 결제는 Google Play 결제가 아닌 외부 결제 시스템을 통해 진행돼요.
              Android 앱에서는 Google Play 결제가 우선 표시됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentSetupNotice() {
  return (
    <div className="app-surface rounded-2xl p-5 ring-1 ring-accent/20" role="status">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15">
          <Sparkles className="h-5 w-5 text-accent" aria-hidden />
        </div>
        <div className="space-y-1.5">
          <p className="font-mystic text-lg font-semibold text-foreground">
            웹 결제 설정을 확인 중이에요
          </p>
          <p className="text-[15px] leading-relaxed text-foreground/80">
            Android 앱에서는 Google Play 결제가 표시되고, 웹 결제는 설정 확인 후 다시 이용할 수 있어요.
          </p>
        </div>
      </div>
    </div>
  );
}

function Benefit({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-[16px] border border-black/10 bg-white/60 px-3 py-3">
      <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden />
      <span className="text-[14px] font-medium">{children}</span>
    </div>
  );
}

function Bullet({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
      <span>{children}</span>
    </li>
  );
}

function PurchaseRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-[8rem,1fr] sm:gap-3">
      <dt className="font-medium text-muted-foreground">{label}</dt>
      <dd className="break-keep text-foreground/90">{value}</dd>
    </div>
  );
}

function getPricingContext(from?: string): PricingContext {
  if (from === "yearly") {
    return {
      backHref: ROUTES.yearly,
      pricingHref: `${ROUTES.pricing}?from=yearly`,
      returnTo: `${ROUTES.yearly}?subscribed=1`,
      afterSubscribeLabel: "신년운세",
      title: "2026 심층 신년 리포트를 열어보세요",
      description:
        "올해의 관계, 돈, 일, 습관 전환점을 더 구체적으로 보고 싶다면 멤버십에서 심층 리포트를 열 수 있어요.",
      recommendation: "신년운세는 프로에서 가장 깊게 열립니다",
      recommendedPlan: "pro",
      liteFit: "월간 심층과 3장 타로처럼 자주 보는 확장 기능이 필요하다면 라이트로 충분해요.",
      proFit: "신년 심층, 사주 심층, 궁합 심층까지 한 번에 깊게 보고 싶다면 프로가 맞아요.",
      unlocks: [
        "2026 연애·관계 전환점",
        "돈이 모이는 달과 조심할 소비 구간",
        "일·공부에서 역할이 커지는 시기",
        "연말까지 가져갈 습관과 내려놓을 패턴",
      ],
    };
  }

  if (from === "monthly") {
    return {
      backHref: ROUTES.monthly,
      pricingHref: `${ROUTES.pricing}?from=monthly`,
      returnTo: `${ROUTES.monthly}?subscribed=1`,
      afterSubscribeLabel: "월간운세",
      title: "월간 심층 리포트를 열어보세요",
      description:
        "이번 달 관계, 돈, 일, 컨디션 흐름을 더 구체적으로 보고 싶다면 멤버십에서 심층 리포트를 열 수 있어요.",
      recommendation: "월간운세는 라이트부터 심층 리포트가 열립니다",
      recommendedPlan: "lite",
      liteFit: "이번 달 관계, 돈, 일, 컨디션 흐름만 깊게 보고 싶다면 라이트가 가장 알맞아요.",
      proFit: "월간뿐 아니라 사주·궁합·신년 심층까지 같이 열고 싶다면 프로가 좋아요.",
      unlocks: [
        "이번 달 관계에서 먼저 풀어야 할 감정",
        "돈이 새는 지점과 지켜야 할 소비 기준",
        "일·공부에서 성과가 나는 우선순위",
        "나에게 맞는 회복 루틴과 조심할 컨디션",
      ],
    };
  }

  if (from === "tarot") {
    return {
      backHref: ROUTES.tarot,
      pricingHref: `${ROUTES.pricing}?from=tarot`,
      returnTo: `${ROUTES.tarot}?subscribed=1`,
      afterSubscribeLabel: "타로",
      title: "3장 타로 흐름까지 열어보세요",
      description:
        "1장 타로로 지금의 감각을 봤다면, 라이트에서는 과거·현재·다음 선택을 3장 흐름으로 이어서 볼 수 있어요.",
      recommendation: "타로 확장은 라이트가 가장 알맞아요",
      recommendedPlan: "lite",
      liteFit: "3장 타로, 별자리·띠별 운세, 월간 심층까지 가볍게 자주 보고 싶을 때 좋아요.",
      proFit: "타로뿐 아니라 사주 심층, 궁합 심층, 신년 심층까지 전부 열고 싶다면 프로가 맞아요.",
      unlocks: [
        "3장 타로 스프레드",
        "과거·현재·다음 선택 흐름 해석",
        "월간 흐름과 리포트 보관 확장",
        "결제 후 타로 화면으로 바로 복귀",
      ],
    };
  }

  if (from === "saju") {
    return {
      backHref: ROUTES.saju,
      pricingHref: `${ROUTES.pricing}?from=saju`,
      returnTo: `${ROUTES.saju}?subscribed=1`,
      afterSubscribeLabel: "사주",
      title: "사주 심층 풀이를 열어보세요",
      description:
        "기본 사주에서 더 들어가 성향, 관계, 일·돈, 건강, 인생 흐름을 한 번에 정리해요.",
      recommendation: "사주 심층은 프로에서 가장 깊게 열립니다",
      recommendedPlan: "pro",
      liteFit: "3장 타로와 월간 심층처럼 가볍게 자주 보는 기능이 중심이라면 라이트가 좋아요.",
      proFit: "사주 심층, 궁합 심층, 신년 심층처럼 긴 리포트를 제대로 보고 싶다면 프로가 맞아요.",
      unlocks: [
        "성향과 반복되는 선택 패턴",
        "관계에서 마음이 열리는 방식",
        "일·돈에서 잘 맞는 역할과 흐름",
        "건강·생활 리듬과 인생 흐름 정리",
      ],
    };
  }

  return {
    backHref: ROUTES.appHome,
    pricingHref: ROUTES.pricing,
    returnTo: "/today?subscribed=1",
    afterSubscribeLabel: "오늘운세",
    title: "더 깊은 운세를 멤버십으로 열어보세요",
    description:
      "오늘운세는 가볍게, 사주·타로·월간·신년운세는 더 깊게. 필요한 만큼 자주 보고 저장할 수 있는 멤버십이에요.",
    recommendation: "처음은 라이트, 심층 풀이까지 원하면 프로를 추천해요",
    recommendedPlan: "lite",
    liteFit: "오늘운세, 3장 타로, 월간 심층, 멤버 대화를 자주 쓰고 싶다면 라이트부터 충분해요.",
    proFit: "사주·궁합·신년 심층처럼 긴 리포트까지 모두 열고 싶다면 프로가 좋아요.",
    unlocks: [
      "오늘운세 이후 더 깊은 해석",
      "타로 3장 스프레드와 심층 풀이",
      "사주·궁합·월간·신년 심층 리포트",
      "멤버 대화와 보관함 이용 확장",
    ],
  };
}
