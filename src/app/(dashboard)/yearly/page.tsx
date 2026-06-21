import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Compass,
  Heart,
  Landmark,
  LockKeyhole,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { requireProfile } from "@/lib/auth/get-user";
import { ROUTES } from "@/lib/constants";
import { hasActiveSubscription } from "@/lib/payment/subscription-state";

type YearlyPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type YearlyPremiumInsight = {
  detail: string;
  label: string;
  preview: string;
  strategy: string;
  title: string;
};

export const metadata: Metadata = {
  title: "2026 연간운세",
  description:
    "2026년의 큰 흐름, 분기별 운세, 연애와 금전, 일의 심층 방향을 정리해요.",
};

const YEAR = 2026;

const YEAR_KEYWORDS = [
  "정리와 재출발",
  "관계의 재배치",
  "현실적인 성장",
  "기준 세우기",
  "기회 선별",
  "몸과 마음의 회복",
  "새로운 역할",
  "방향 전환",
] as const;

const QUARTERS = [
  {
    label: "1분기",
    months: "1월 - 3월",
    title: "기초를 다시 잡는 시기",
    body: "올해 초반은 속도보다 정리가 중요해요. 생활 리듬, 돈의 흐름, 관계의 거리를 차분히 다시 맞추면 이후 선택이 쉬워져요.",
  },
  {
    label: "2분기",
    months: "4월 - 6월",
    title: "움직임이 커지는 시기",
    body: "미뤄둔 시도와 제안이 들어오는 흐름이에요. 다만 한 번에 크게 바꾸기보다 작은 실험을 여러 번 해보는 쪽이 안정적이에요.",
  },
  {
    label: "3분기",
    months: "7월 - 9월",
    title: "관계와 감정의 균형",
    body: "사람 사이의 기대치가 선명해지는 구간이에요. 맞춰주기보다 내가 원하는 기준을 솔직하게 드러내야 흔들림이 줄어요.",
  },
  {
    label: "4분기",
    months: "10월 - 12월",
    title: "결과를 정리하고 다음 해를 준비",
    body: "올해 얻은 것 중 오래 가져갈 것과 내려놓을 것이 갈려요. 성과보다 패턴을 보는 사람이 다음 흐름을 더 잘 잡아요.",
  },
] as const;

const AREA_CARDS = [
  {
    key: "love",
    title: "연애와 관계",
    icon: Heart,
    body: "가까운 관계일수록 말하지 않아도 알 거라는 기대를 줄이는 게 좋아요. 표현을 작게 자주 나누는 쪽이 관계운을 안정시켜요.",
  },
  {
    key: "money",
    title: "금전과 소비",
    icon: Landmark,
    body: "대박보다 반복되는 지출을 정리하는 해예요. 구독, 충동구매, 미뤄둔 정산을 줄이면 체감 운이 올라가요.",
  },
  {
    key: "career",
    title: "일과 공부",
    icon: TrendingUp,
    body: "역할이 넓어질 수 있어요. 다만 맞추는 사람이 되기보다 내가 책임질 범위를 선명하게 만드는 게 중요해요.",
  },
] as const;

export default async function YearlyPage({ searchParams }: YearlyPageProps) {
  const { profile } = await requireProfile();
  const subscribed = await hasActiveSubscription(profile.userId).catch(() => false);
  const params = (await searchParams) ?? {};
  const justSubscribed =
    params.subscribed === "1" ||
    (Array.isArray(params.subscribed) && params.subscribed.includes("1"));
  const seed = buildSeed(
    `${profile.userId}:${profile.birthDate ?? ""}:${profile.mbti ?? ""}:${YEAR}`,
  );
  const keyword = YEAR_KEYWORDS[seed % YEAR_KEYWORDS.length];
  const strengthMonth = (seed % 12) + 1;
  const cautionMonth = ((seed >>> 3) % 12) + 1;
  const focusScore = 62 + (seed % 29);
  const relationScore = 58 + ((seed >>> 4) % 31);
  const moneyScore = 55 + ((seed >>> 8) % 34);
  const premiumInsights = getYearlyPremiumInsights(seed);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-7">
      <header className="app-surface rounded-3xl border px-5 py-6 sm:px-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-primary/70">
              New Year Fortune
            </p>
            <h1 className="font-mystic text-4xl font-semibold tracking-tight sm:text-5xl">
              {YEAR} 연간운세
            </h1>
            <p className="max-w-2xl text-[15px] leading-7 text-muted-foreground">
              올해의 큰 흐름을 먼저 보고, 분기별로 어디에 힘을 줄지
              정리해요.
            </p>
          </div>
          <Link
            href={ROUTES.saju as Route}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/25 px-4 py-2.5 text-[14px] font-semibold text-primary transition hover:bg-primary/10"
          >
            내 사주 보기
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </header>

      {subscribed ? <UnlockedYearlyNotice justSubscribed={justSubscribed} /> : null}

      <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <div className="app-surface rounded-3xl border p-5 sm:p-6">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" aria-hidden />
            <p className="text-[13px] font-semibold">올해의 키워드</p>
          </div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">{keyword}</h2>
          <p className="mt-4 text-[15px] leading-7 text-muted-foreground">
            {YEAR}년은 무조건 확장하기보다 나에게 맞는 방향을 선별하는
            힘이 중요해요. 이미 가진 습관과 관계를 정리하면 새 기회가
            더 선명하게 보일 수 있어요.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <ScoreCard label="성장운" value={focusScore} />
          <ScoreCard label="관계운" value={relationScore} />
          <ScoreCard label="금전운" value={moneyScore} />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <HighlightCard
          icon={CalendarDays}
          title="힘이 붙는 달"
          value={`${strengthMonth}월`}
          body="새로운 제안, 계획 수정, 관계 회복을 시도하기 좋은 달이에요."
        />
        <HighlightCard
          icon={Compass}
          title="천천히 가야 할 달"
          value={`${cautionMonth}월`}
          body="결정은 늦춰도 괜찮아요. 자료를 모으고 상황을 확인하는 쪽이 좋아요."
        />
      </section>

      <section className="app-surface rounded-3xl border p-5">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" aria-hidden />
          <h2 className="text-xl font-semibold">분기별 흐름</h2>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {QUARTERS.map((quarter) => (
            <div
              key={quarter.label}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">{quarter.label}</p>
                <p className="text-[12px] text-muted-foreground">
                  {quarter.months}
                </p>
              </div>
              <h3 className="mt-3 text-lg font-semibold">{quarter.title}</h3>
              <p className="mt-2 text-[14px] leading-6 text-muted-foreground">
                {quarter.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {AREA_CARDS.map((area) => (
          <AreaCard
            key={area.key}
            title={area.title}
            body={area.body}
            icon={area.icon}
          />
        ))}
      </section>

      <PremiumYearlySection insights={premiumInsights} subscribed={subscribed} />

      <section className="app-surface rounded-3xl border p-5">
        <h2 className="text-xl font-semibold">올해 붙잡을 세 가지</h2>
        <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
          올해는 많이 하기보다 나에게 맞게 하는 것이 중요해요. 계획을
          크게 세우기보다 테마를 하나로 정리하고, 그 정리가 방향이 되는
          방식으로 가면 좋아요.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={ROUTES.monthly as Route}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[14px] font-semibold text-primary-foreground"
          >
            월간운세 보기
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href={ROUTES.saju as Route}
            className="inline-flex items-center justify-center rounded-full border border-white/15 px-4 py-2.5 text-[14px] font-semibold transition hover:bg-white/10"
          >
            사주 심층 보기
          </Link>
          <Link
            href={ROUTES.settings as Route}
            className="inline-flex items-center justify-center rounded-full border border-white/15 px-4 py-2.5 text-[14px] font-semibold transition hover:bg-white/10"
          >
            구독 확인
          </Link>
        </div>
      </section>
    </div>
  );
}

function PremiumYearlySection({
  insights,
  subscribed,
}: {
  insights: YearlyPremiumInsight[];
  subscribed: boolean;
}) {
  return (
    <section
      id="yearly-premium-report"
      className="app-surface rounded-3xl border border-primary/20 p-4 sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-primary/70">
            Premium Yearly
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            2026 심층 연간 리포트
          </h2>
          <p className="mt-2 max-w-2xl text-[14px] leading-6 text-muted-foreground">
            연간운세의 큰 방향에서 한 걸음 더 들어가, 관계와 돈, 일,
            습관의 전환점을 연간 전략처럼 읽을 수 있게 정리해요.
          </p>
        </div>
        {!subscribed ? (
          <Link
            href={`${ROUTES.pricing}?from=yearly` as Route}
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
          <PremiumMetric label="분석 범위" value="4개 전환점" />
          <PremiumMetric label="올해 기준" value="전략 중심" />
          <PremiumMetric label="읽는 순서" value="관계 - 금전 - 일 - 습관" />
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-[14px] leading-6 text-muted-foreground">
          구독하면 2026년 관계 전환점, 돈이 모이는 시기, 일과
          공부에서 역할이 바뀌는 지점, 연말까지 가져갈 습관을 자세히
          볼 수 있어요.
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
                    <p className="text-[12px] font-semibold">올해의 기준</p>
                  </div>
                  <p className="mt-2 text-foreground">{item.strategy}</p>
                </div>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                <p className="text-[14px] leading-6 text-muted-foreground">
                  {item.preview}
                </p>
                <p className="text-[13px] font-medium text-primary">
                  구독하면 자세히 열림
                </p>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function UnlockedYearlyNotice({ justSubscribed }: { justSubscribed: boolean }) {
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
              ? "구독 결제가 완료됐어요"
              : "구독으로 연간 심층 리포트가 열려 있어요"}
          </p>
          <p className="mt-1 text-[14px] leading-6 text-muted-foreground">
            {justSubscribed
              ? "이제 아래 연간 심층 리포트까지 바로 확인할 수 있어요."
              : "관계, 돈, 일과 습관의 전환점을 연간 전략처럼 이어서 확인할 수 있어요."}
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

function getYearlyPremiumInsights(seed: number): YearlyPremiumInsight[] {
  const relationTurn =
    seed % 2 === 0
      ? "상반기에는 거리 조절, 하반기에는 표현"
      : "상반기에는 표현, 하반기에는 약속의 정리";
  const moneyTurn = seed % 3 === 0 ? "2분기와 4분기" : "1분기와 3분기";
  const workTurn =
    seed % 4 === 0
      ? "새 역할을 맡는 흐름"
      : "기존 역할에 판단권이 생기는 흐름";
  const habitTurn =
    seed % 5 === 0 ? "수면과 소비" : "시간 관리와 관계 거리";

  return [
    {
      label: "관계 전환점",
      title: "올해 관계가 바뀌는 방식",
      preview: "연애와 인간관계에서 어떤 태도가 길을 열어주는지 보여줘요.",
      detail: `2026년 관계운은 ${relationTurn}이 핵심이에요. 무작정 가까워지기보다 서로의 속도를 인정할 때 오래 가는 관계가 남습니다. 새로운 관계는 말보다 반복되는 행동으로 판단하는 편이 좋아요.`,
      strategy: "관계에서 참는 역할만 맡지 말고, 원하는 것과 어려운 것을 같은 비중으로 말해 보세요.",
    },
    {
      label: "금전 구간",
      title: "돈이 모이는 때와 조심할 소비",
      preview: "올해 돈을 지키기 좋은 구간과 새는 구간을 구분해요.",
      detail: `금전운은 ${moneyTurn}에 특히 신경 써야 해요. 들어오는 돈보다 남기는 돈이 중요해지는 해라서, 수입이 늘어도 생활 기준이 같이 올라가면 체감 성과가 줄 수 있어요.`,
      strategy: "큰 목표보다 자동 저축, 고정비 정리, 충동 결제 대기 시간을 먼저 시스템으로 만드세요.",
    },
    {
      label: "일과 공부 전환점",
      title: "역할이 커지는 시기",
      preview: "성과를 내기 위해 넓혀야 할 것과 줄여야 할 것을 나눠요.",
      detail: `일과 공부에서는 ${workTurn}이 보여요. 인정받고 싶은 마음이 커질 수 있지만 모든 요청을 받아내는 방식은 오래가지 않아요. 올해는 내가 책임질 범위를 선명하게 말하는 사람이 유리합니다.`,
      strategy: "새 일을 시작할 때는 마감, 책임 범위, 지원받을 사람을 먼저 정하고 움직이세요.",
    },
    {
      label: "습관 정리",
      title: "연말까지 가장 크게 남을 것",
      preview: "올해 나를 오래 단단하게 해주는 생활 기준을 정리해요.",
      detail: `올해는 ${habitTurn}을 정리할 때 전체 운이 같이 올라와요. 몸과 시간이 흔들리면 기회를 붙잡기 어렵기 때문에 반복 가능한 생활 기준이 가장 큰 보호막이 됩니다.`,
      strategy: "큰 결심을 세우기보다 매주 같은 시간에 돌아보는 루틴 하나를 끝까지 유지하세요.",
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
