import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  LockKeyhole,
  MessageCircle,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { FeatureGrid } from "@/components/home/feature-grid";
import { BiasGreetingCard } from "@/components/chat/bias-greeting-card";
import { requireProfile } from "@/lib/auth/get-user";
import { getBiasGreeting } from "@/lib/chat/bias-greeting";
import { ROUTES } from "@/lib/constants";
import { hasActiveSubscription } from "@/lib/payment/subscription-state";

export const metadata: Metadata = {
  title: "운세 대시보드",
  description: "오늘의 운세, 타로, 사주, 궁합, 주간 리포트를 한곳에서 시작해요.",
};

export default async function HomeDashboardPage() {
  const { profile } = await requireProfile();
  const [subscribed, biasGreeting] = await Promise.all([
    hasActiveSubscription(profile.userId).catch(() => false),
    getBiasGreeting({
      userId: profile.userId,
      biasCharacter: profile.biasCharacter,
    }),
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <header
        className="app-surface overflow-hidden rounded-[24px] border px-4 py-5 sm:px-7 sm:py-6"
        style={{
          background: "var(--app-surface-strong)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
        }}
      >
        <div className="space-y-2">
          <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-primary/70">
            Fortune Dashboard
          </p>
          <h1 className="font-mystic text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
            오늘의 흐름을 먼저 확인해요
          </h1>
          <p className="max-w-2xl text-[14px] leading-6 text-muted-foreground sm:text-base sm:leading-7">
            매일 운세로 하루를 가볍게 시작하고, 타로·사주·궁합·리포트로 더 깊게 이어가요.
          </p>
        </div>

        <div className="mt-4 flex flex-col gap-2.5 sm:mt-5 sm:flex-row sm:flex-wrap">
          <HomeCta href={`${ROUTES.today}?category=general` as Route} primary>
            오늘 운세 보기
          </HomeCta>
          <HomeCta href={ROUTES.weekly as Route} icon={TrendingUp}>
            주간 리포트
          </HomeCta>
          <HomeCta href={ROUTES.chat as Route} icon={MessageCircle}>
            멤버와 대화
          </HomeCta>
        </div>

        <div className="mt-5 hidden gap-2 sm:grid sm:grid-cols-3">
          <SummaryPill label="매일" value="오늘 운세와 타로" />
          <SummaryPill label="기록" value="아카이브와 주간 리포트" />
          <SummaryPill
            label={subscribed ? "현재 플랜" : "업그레이드"}
            value={subscribed ? "프리미엄 사용 중" : "월간·연간 리포트 열기"}
          />
        </div>
      </header>

      <BiasGreetingCard greeting={biasGreeting} />

      <DailyRoutinePanel subscribed={subscribed} />

      <WeeklyReportBanner />

      {subscribed ? <SubscriberHub /> : <FreeUpgradePath />}

      <FeatureGrid />
    </div>
  );
}

function HomeCta({
  children,
  href,
  icon: Icon = ArrowRight,
  primary = false,
}: {
  children: string;
  href: Route;
  icon?: typeof ArrowRight;
  primary?: boolean;
}) {
  return (
    <Link
      data-keep-color={primary ? true : undefined}
      href={href}
      className={
        primary
          ? "inline-flex items-center justify-center gap-2 rounded-full bg-[#16181d] px-4 py-2.5 text-[14px] font-semibold text-white shadow-[0_10px_22px_rgba(18,20,24,0.16)] transition hover:bg-[#22252b]"
          : "inline-flex items-center justify-center gap-2 rounded-full border border-black/10 bg-white/80 px-4 py-2.5 text-[14px] font-semibold text-[#1d2026] shadow-[0_4px_12px_rgba(35,39,48,0.05)] transition hover:bg-white"
      }
    >
      {children}
      <Icon className="h-4 w-4" aria-hidden />
    </Link>
  );
}

function DailyRoutinePanel({ subscribed }: { subscribed: boolean }) {
  const items = [
    {
      title: "오늘 운세 확인",
      body: "전체 흐름과 주의할 점을 먼저 봐요.",
      href: `${ROUTES.today}?category=general` as Route,
    },
    {
      title: "타로 한 장",
      body: "지금 마음에 걸리는 질문을 가볍게 확인해요.",
      href: "/tarot#tarot" as Route,
    },
    {
      title: subscribed ? "리포트 이어보기" : "주간 흐름 미리보기",
      body: subscribed
        ? "주간·월간·연간 흐름을 이어서 봐요."
        : "기록이 쌓일수록 리포트가 더 선명해져요.",
      href: subscribed ? (ROUTES.weekly as Route) : (ROUTES.pricing as Route),
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-3">
      {items.map((item, index) => (
        <Link
          key={item.title}
          href={item.href}
          className="group app-surface rounded-[20px] border px-4 py-3.5 transition hover:-translate-y-0.5 hover:border-primary/25 hover:bg-white/85"
        >
          <span className="flex items-center gap-2 text-primary">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/[0.09] text-[13px] font-bold">
              {index + 1}
            </span>
            <span className="text-[12px] font-semibold uppercase tracking-[0.16em]">
              Daily Routine
            </span>
          </span>
          <span className="mt-3 block text-[16px] font-semibold">
            {item.title}
          </span>
          <span className="mt-1 block text-[13px] leading-5 text-muted-foreground">
            {item.body}
          </span>
          <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-primary">
            시작하기
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      ))}
    </section>
  );
}

function WeeklyReportBanner() {
  return (
    <section className="app-surface rounded-[24px] border border-primary/15 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-primary/[0.09] text-primary ring-1 ring-primary/10">
            <TrendingUp className="h-5 w-5" aria-hidden />
          </span>
          <div className="space-y-1">
            <p className="text-[13px] font-semibold text-primary">
              Weekly Report
            </p>
            <h2 className="text-2xl font-semibold tracking-tight">
              이번 주 흐름을 한 번에 정리해요
            </h2>
            <p className="max-w-2xl text-[14px] leading-6 text-muted-foreground">
              운세, 타로, 궁합 기록을 모아 이번 주의 관심사와 반복되는 신호를 보여줘요.
            </p>
          </div>
        </div>
        <Link
          href={ROUTES.weekly as Route}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[14px] font-semibold text-primary-foreground transition hover:opacity-90"
        >
          주간 리포트 보기
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}

function SubscriberHub() {
  return (
    <section className="app-surface rounded-[24px] border border-primary/15 p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <CheckCircle2 className="h-5 w-5" aria-hidden />
            <p className="text-[13px] font-semibold">
              프리미엄 기능을 바로 사용할 수 있어요
            </p>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">
            깊은 리포트와 대화를 이어가요
          </h2>
          <p className="max-w-2xl text-[14px] leading-6 text-muted-foreground">
            월간·연간 리포트, 사주 분석, 멤버와의 대화를 한곳에서 이어갈 수 있어요.
          </p>
        </div>
        <Link
          href={ROUTES.settings as Route}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-primary/25 px-4 py-2.5 text-[14px] font-semibold text-primary transition hover:bg-primary/10"
        >
          내 플랜 확인
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <UnlockedLink href={ROUTES.weekly as Route} icon={TrendingUp} title="주간 리포트" body="이번 주 기록과 흐름 요약" />
        <UnlockedLink href={ROUTES.monthly as Route} icon={CalendarDays} title="월간 리포트" body="이번 달의 강한 주간과 조율 포인트" />
        <UnlockedLink href={ROUTES.yearly as Route} icon={Sparkles} title="연간 리포트" body="올해의 큰 전환점과 방향" />
        <UnlockedLink href={ROUTES.chat as Route} icon={MessageCircle} title="멤버 대화" body="기록을 이어서 이야기하기" />
      </div>
    </section>
  );
}

function FreeUpgradePath() {
  return (
    <section className="app-surface rounded-[24px] border border-primary/15 p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" aria-hidden />
            <p className="text-[13px] font-semibold">
              더 깊게 보고 싶다면
            </p>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">
            리포트가 쌓일수록 나만의 흐름이 선명해져요
          </h2>
          <p className="max-w-2xl text-[14px] leading-6 text-muted-foreground">
            무료로 매일 운세와 타로를 시작하고, 필요할 때 월간·연간 리포트와 추가 분석을 열어보세요.
          </p>
        </div>
        <Link
          href={ROUTES.pricing as Route}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[14px] font-semibold text-primary-foreground"
        >
          플랜 보기
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <LockedReportLink href={ROUTES.monthly as Route} icon={CalendarDays} title="월간 리포트" body="강한 주간, 조율할 주간, 분야별 흐름을 미리 확인해요." />
        <LockedReportLink href={ROUTES.yearly as Route} icon={Sparkles} title="연간 리포트" body="한 해의 전환점과 분기별 흐름을 큰 그림으로 정리해요." />
      </div>
    </section>
  );
}

function UnlockedLink({
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
      className="group flex min-h-[108px] flex-col justify-between rounded-[20px] border border-primary/15 bg-primary/[0.055] px-4 py-4 transition hover:border-primary/25 hover:bg-primary/[0.08]"
    >
      <span className="block">
        <span className="flex items-center gap-2 text-primary">
          <Icon className="h-4 w-4" aria-hidden />
          <span className="text-[15px] font-semibold text-foreground">
            {title}
          </span>
        </span>
        <span className="mt-2 block text-[13px] leading-5 text-muted-foreground">
          {body}
        </span>
      </span>
      <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-primary">
        열기
        <ArrowRight
          className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </span>
    </Link>
  );
}

function LockedReportLink({
  body,
  href,
  icon: Icon,
  title,
}: {
  body: string;
  href: Route;
  icon: typeof CalendarDays;
  title: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-3 rounded-[20px] border border-black/10 bg-white/55 px-4 py-3.5 transition hover:border-primary/20 hover:bg-white/80"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] bg-primary/[0.09] text-primary ring-1 ring-primary/10">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span className="font-semibold">{title}</span>
            <LockKeyhole className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          </span>
          <span className="mt-1 block text-[13px] leading-5 text-muted-foreground">
            {body}
          </span>
        </span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 opacity-50 transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-black/10 bg-white/55 px-4 py-3">
      <p className="text-[12px] font-semibold text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-[15px] font-semibold">{value}</p>
    </div>
  );
}
