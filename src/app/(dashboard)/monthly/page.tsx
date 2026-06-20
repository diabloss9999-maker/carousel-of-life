import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import {
  ArrowRight,
  CalendarRange,
  CheckCircle2,
  Compass,
  Heart,
  Landmark,
  LockKeyhole,
  Moon,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { requireProfile } from "@/lib/auth/get-user";
import { ROUTES } from "@/lib/constants";
import { hasActiveSubscription } from "@/lib/payment/subscription-state";

type MonthlyPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type MonthlyPremiumInsight = {
  action: string;
  detail: string;
  label: string;
  preview: string;
  title: string;
};

export const metadata: Metadata = {
  title: "월간운세",
  description:
    "이번 달의 흐름, 주차별 방향, 연애와 금전, 일의 운세를 한눈에 정리해요.",
};

const MONTH_THEMES = [
  "속도를 낮추고 기준을 세우는 달",
  "새로운 시도를 작게 시작하는 달",
  "관계의 균형을 다시 맞추는 달",
  "돈과 시간을 정리해야 하는 달",
  "기회가 보이지만 선별이 필요한 달",
  "몸과 마음의 리듬을 회복하는 달",
  "일의 우선순위가 선명해지는 달",
  "감정 표현의 흐름을 바꾸는 달",
] as const;

const WEEK_GUIDES = [
  {
    label: "1주차",
    title: "정리",
    body: "이번 달의 리듬을 잡는 구간이에요. 할 일과 관계를 한 번 정리하면 전체 흐름이 안정돼요.",
  },
  {
    label: "2주차",
    title: "시도",
    body: "작게 움직이면 반응이 오는 시기예요. 큰 결정 전에 테스트하듯 가볍게 시작하는 게 좋아요.",
  },
  {
    label: "3주차",
    title: "조율",
    body: "사람 사이의 기대치가 드러날 수 있어요. 맞춰주기보다 내 기준을 차분히 말해 주세요.",
  },
  {
    label: "4주차",
    title: "마무리",
    body: "이번 달의 결과를 확인하고 다음 달로 넘길 것을 고르는 때예요. 정답보다 정리가 더 중요해요.",
  },
] as const;

const AREA_GUIDES = [
  {
    title: "연애와 관계",
    icon: Heart,
    body: "가까운 사람일수록 당연하게 넘기지 않는 태도가 좋아요. 짧은 확인과 작은 약속이 관계운을 살려요.",
  },
  {
    title: "금전과 소비",
    icon: Landmark,
    body: "이번 달은 새로 벌기보다 새는 돈을 막는 쪽이 더 강해요. 반복 지출과 충동구매부터 점검해 보세요.",
  },
  {
    title: "일과 공부",
    icon: TrendingUp,
    body: "해야 할 일이 많아 보여도 핵심은 하나예요. 우선순위를 줄일수록 결과가 선명해져요.",
  },
] as const;

export default async function MonthlyPage({ searchParams }: MonthlyPageProps) {
  const { profile } = await requireProfile();
  const subscribed = await hasActiveSubscription(profile.userId).catch(() => false);
  const params = (await searchParams) ?? {};
  const justSubscribed =
    params.subscribed === "1" ||
    (Array.isArray(params.subscribed) && params.subscribed.includes("1"));
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }),
  );
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const seed = buildSeed(
    `${profile.userId}:${profile.birthDate ?? ""}:${profile.mbti ?? ""}:${year}-${month}`,
  );
  const theme = MONTH_THEMES[seed % MONTH_THEMES.length];
  const strongWeek = (seed % 4) + 1;
  const cautionWeek = ((seed >>> 4) % 4) + 1;
  const focusScore = 61 + (seed % 30);
  const relationScore = 57 + ((seed >>> 5) % 32);
  const moneyScore = 55 + ((seed >>> 9) % 34);
  const premiumInsights = getMonthlyPremiumInsights(seed, month);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-7">
      <header className="app-surface rounded-3xl border px-5 py-6 sm:px-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-primary/70">
              Monthly Fortune
            </p>
            <h1 className="font-mystic text-4xl font-semibold tracking-tight sm:text-5xl">
              {year}년 {month}월 운세
            </h1>
            <p className="max-w-2xl text-[15px] leading-7 text-muted-foreground">
              이번 달의 큰 흐름, 강한 주간, 조심할 주간, 분야별 방향을
              한 번에 정리해요.
            </p>
          </div>
          <Link
            href={ROUTES.weekly as Route}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/25 px-4 py-2.5 text-[14px] font-semibold text-primary transition hover:bg-primary/10"
          >
            주간 리포트 보기
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </header>

      {subscribed ? <UnlockedNotice justSubscribed={justSubscribed} /> : null}

      <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <div className="app-surface rounded-3xl border p-5 sm:p-6">
          <div className="flex items-center gap-2 text-primary">
            <Moon className="h-5 w-5" aria-hidden />
            <p className="text-[13px] font-semibold">이번 달 테마</p>
          </div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">{theme}</h2>
          <p className="mt-4 text-[15px] leading-7 text-muted-foreground">
            이번 달은 매일의 작은 선택이 누적되는 흐름이에요. 크게
            바꾸기보다 반복되는 습관 하나를 고치면 체감 운이 훨씬
            좋아질 수 있어요.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <ScoreCard label="추진운" value={focusScore} />
          <ScoreCard label="관계운" value={relationScore} />
          <ScoreCard label="금전운" value={moneyScore} />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <HighlightCard
          icon={Sparkles}
          title="힘이 붙는 주"
          value={`${strongWeek}주차`}
          body="새로운 시도, 연락, 계획 수정이 비교적 수월하게 열리는 구간이에요."
        />
        <HighlightCard
          icon={Compass}
          title="천천히 볼 주"
          value={`${cautionWeek}주차`}
          body="급하게 결론 내리기보다 확인과 조율을 먼저 하는 쪽이 좋아요."
        />
      </section>

      <section className="app-surface rounded-3xl border p-5">
        <div className="flex items-center gap-2">
          <CalendarRange className="h-5 w-5 text-primary" aria-hidden />
          <h2 className="text-xl font-semibold">주차별 흐름</h2>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {WEEK_GUIDES.map((week, index) => (
            <div
              key={week.label}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">{week.label}</p>
                {index + 1 === strongWeek ? (
                  <span className="rounded-full border border-primary/25 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    상승
                  </span>
                ) : index + 1 === cautionWeek ? (
                  <span className="rounded-full border border-white/15 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                    점검
                  </span>
                ) : null}
              </div>
              <h3 className="mt-3 text-lg font-semibold">{week.title}</h3>
              <p className="mt-2 text-[14px] leading-6 text-muted-foreground">
                {week.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {AREA_GUIDES.map((area) => (
          <AreaCard
            key={area.title}
            title={area.title}
            body={area.body}
            icon={area.icon}
          />
        ))}
      </section>

      <PremiumDepthSection insights={premiumInsights} subscribed={subscribed} />

      <NextActions
        primaryHref={ROUTES.today as Route}
        primaryLabel="오늘 운세로 이어보기"
        secondary={[
          { href: ROUTES.saju as Route, label: "사주 심층 보기" },
          { href: ROUTES.yearly as Route, label: "연간운세 보기" },
        ]}
        title="이번 달 실천 체크"
      />
    </div>
  );
}

function PremiumDepthSection({
  insights,
  subscribed,
}: {
  insights: MonthlyPremiumInsight[];
  subscribed: boolean;
}) {
  return (
    <section
      id="monthly-premium-report"
      className="app-surface rounded-3xl border border-primary/20 p-4 sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-primary/70">
            Premium Monthly
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            월간 심층 리포트
          </h2>
          <p className="mt-2 max-w-2xl text-[14px] leading-6 text-muted-foreground">
            무료 리포트가 이번 달의 방향을 보여준다면, 심층 리포트는
            관계, 소비, 일과 컨디션까지 실제로 어떻게 움직이면 좋을지
            구체적으로 안내해요.
          </p>
        </div>
        {!subscribed ? (
          <Link
            href={`${ROUTES.pricing}?from=monthly` as Route}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[14px] font-semibold text-primary-foreground"
          >
            심층 열기
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        ) : (
          <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[12px] font-semibold text-primary">
            잠금 해제됨
          </span>
        )}
      </div>

      {subscribed ? (
        <div className="mt-4 grid gap-2 rounded-2xl border border-primary/20 bg-primary/[0.07] p-3 sm:grid-cols-3 sm:p-4">
          <PremiumMetric label="분석 범위" value="4개 영역" />
          <PremiumMetric label="이번 달 기준" value="행동 중심" />
          <PremiumMetric label="읽는 순서" value="관계 - 금전 - 일 - 컨디션" />
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-[14px] leading-6 text-muted-foreground">
          멤버십을 열면 관계, 금전, 일과 공부, 컨디션별 상세 해석과
          이번 달 행동 기준까지 확인할 수 있어요.
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {insights.map((item, index) => (
          <article
            key={item.title}
            className={`relative overflow-hidden rounded-2xl border px-4 py-4 ${
              subscribed
                ? "border-primary/15 bg-primary/[0.045]"
                : "border-white/10 bg-white/[0.04]"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[12px] font-semibold text-primary">
                  {String(index + 1).padStart(2, "0")} · {item.label}
                </p>
                <h3 className="mt-1 text-[16px] font-semibold">{item.title}</h3>
              </div>
              {!subscribed ? (
                <LockKeyhole
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
              ) : null}
            </div>
            {subscribed ? (
              <div className="mt-3 space-y-3 text-[14px] leading-7 text-muted-foreground">
                <p>{item.detail}</p>
                <div className="rounded-2xl border border-primary/20 bg-background/55 px-3 py-3">
                  <div className="flex items-center gap-2 text-primary">
                    <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
                    <p className="text-[12px] font-semibold">이번 달 행동 기준</p>
                  </div>
                  <p className="mt-2 text-foreground">{item.action}</p>
                </div>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                <p className="text-[14px] leading-6 text-muted-foreground">
                  {item.preview}
                </p>
                <p className="text-[13px] font-medium text-primary">
                  멤버십에서 자세히 열림
                </p>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function UnlockedNotice({ justSubscribed }: { justSubscribed: boolean }) {
  return (
    <section
      className={`rounded-3xl border p-4 ${
        justSubscribed
          ? "border-primary/35 bg-primary/15 ring-1 ring-primary/20"
          : "border-primary/20 bg-primary/10"
      }`}
    >
      <div className="flex items-start gap-3">
        <CheckCircle2
          className="mt-0.5 h-5 w-5 shrink-0 text-primary"
          aria-hidden
        />
        <div>
          <p className="font-semibold text-primary">
            {justSubscribed
              ? "멤버십 결제가 완료됐어요"
              : "멤버십으로 월간 심층 리포트가 열려 있어요"}
          </p>
          <p className="mt-1 text-[14px] leading-6 text-muted-foreground">
            {justSubscribed
              ? "이제 아래 월간 심층 리포트까지 바로 확인할 수 있어요."
              : "관계, 소비, 일과 컨디션까지 이번 달에 실제로 움직일 기준을 확인할 수 있어요."}
          </p>
        </div>
      </div>
    </section>
  );
}

function PremiumMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-background/45 px-3 py-2.5">
      <p className="text-[11px] font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 text-[13px] font-semibold">{value}</p>
    </div>
  );
}

function NextActions({
  primaryHref,
  primaryLabel,
  secondary,
  title,
}: {
  primaryHref: Route;
  primaryLabel: string;
  secondary: Array<{ href: Route; label: string }>;
  title: string;
}) {
  return (
    <section className="app-surface rounded-3xl border p-5">
      <div className="flex items-center gap-2">
        <Target className="h-5 w-5 text-primary" aria-hidden />
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
        <CheckItem text="미뤄둔 정리 하나 끝내기" />
        <CheckItem text="반복 지출 두 가지 점검하기" />
        <CheckItem text="중요한 사람에게 먼저 안부 묻기" />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={primaryHref}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[14px] font-semibold text-primary-foreground"
        >
          {primaryLabel}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
        {secondary.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="inline-flex items-center justify-center rounded-full border border-white/15 px-4 py-2.5 text-[14px] font-semibold transition hover:bg-white/10"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="app-surface rounded-2xl border px-4 py-4">
      <p className="text-[13px] font-semibold text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-end gap-2">
        <p className="text-3xl font-semibold">{value}</p>
        <p className="pb-1 text-[13px] text-muted-foreground">점</p>
      </div>
      <div className="mt-3 h-2 rounded-full bg-white/10">
        <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function HighlightCard({
  body,
  icon: Icon,
  title,
  value,
}: {
  body: string;
  icon: LucideIcon;
  title: string;
  value: string;
}) {
  return (
    <div className="app-surface rounded-2xl border px-4 py-4">
      <div className="flex items-center gap-2 text-[13px] font-semibold text-muted-foreground">
        <Icon className="h-4 w-4" aria-hidden />
        {title}
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="mt-2 text-[14px] leading-6 text-muted-foreground">{body}</p>
    </div>
  );
}

function AreaCard({
  body,
  icon: Icon,
  title,
}: {
  body: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="app-surface rounded-2xl border px-4 py-4">
      <Icon className="h-5 w-5 text-primary" aria-hidden />
      <p className="mt-3 font-semibold">{title}</p>
      <p className="mt-2 text-[14px] leading-6 text-muted-foreground">{body}</p>
    </div>
  );
}

function CheckItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3">
      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden />
      <span className="text-[14px] font-medium">{text}</span>
    </div>
  );
}

function getMonthlyPremiumInsights(
  seed: number,
  month: number,
): MonthlyPremiumInsight[] {
  const relationTone = seed % 2 === 0 ? "표현이 필요한 쪽" : "기대가 앞서는 쪽";
  const moneyTone = seed % 3 === 0 ? "작은 고정비" : "시간적인 만족 소비";
  const workTone =
    seed % 4 === 0 ? "새로운 일을 벌이는 것" : "기존 일을 끝까지 닫는 것";
  const recoveryTone = seed % 5 === 0 ? "수면 리듬" : "혼자 있는 시간";

  return [
    {
      label: "관계 심층",
      title: "먼저 다뤄야 할 감정",
      preview: "가까운 사람과의 온도 차이를 어떻게 다루면 좋을지 보여줘요.",
      detail: `${month}월 관계운은 ${relationTone}에서 꼬일 수 있어요. 상대가 알아주길 기다리기보다 원하는 것을 짧고 분명하게 말하면 오해가 줄어듭니다. 다만 감정을 따라 길게 설명하기보다는 대화를 미루지 않는 편이 좋아요.`,
      action: "중요한 대화는 밤보다 낮에, 한 번에 길게 말하기보다 두 가지 주제로만 나눠 보세요.",
    },
    {
      label: "금전 심층",
      title: "돈이 새는 지점",
      preview: "이번 달 지갑을 가볍게 만드는 패턴을 짚어줘요.",
      detail: `이번 달은 ${moneyTone}가 금전 흐름을 흔들 수 있어요. 큰돈보다 작은 결제가 누적되기 쉬우니, 필요한 소비와 기분 때문에 하는 소비를 나눠 보는 게 좋아요.`,
      action: "결제 전 10분만 미루고, 월말까지 남길 금액을 먼저 따로 빼두세요.",
    },
    {
      label: "일과 공부 심층",
      title: "성과가 나는 우선순위",
      preview: "어디에 힘을 줘야 결과가 보이는지 정리해요.",
      detail: `이번 달 성과는 ${workTone}에 달려 있어요. 일을 늘릴수록 피로가 먼저 오기 때문에, 완성도 높은 하나가 여러 개의 시작보다 더 나은 신호를 만듭니다.`,
      action: "이번 달 대표 과제 하나를 정하고 매주 같은 요일에 진행 상황을 확인하세요.",
    },
    {
      label: "컨디션 심층",
      title: "회복 리듬과 조심할 신호",
      preview: "힘이 떨어져 보일 때 실제로 먼저 챙겨야 할 부분을 알려줘요.",
      detail: `컨디션은 ${recoveryTone}을 회복할 때 같이 올라옵니다. 마음이 급해질수록 몸의 신호를 놓치기 쉬우니, 무리해서 버티는 날을 줄이는 게 이번 달 운을 지키는 방법이에요.`,
      action: "일정이 많은 날에는 다음 계획을 넣지 말고, 이미 정한 일 중 가장 작은 것만 끝내세요.",
    },
  ];
}

function buildSeed(raw: string): number {
  let hash = 0;
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash * 31 + raw.charCodeAt(i)) >>> 0;
  }
  return hash;
}
