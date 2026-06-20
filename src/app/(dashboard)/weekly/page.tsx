import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Heart,
  Library,
  MessageCircle,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { and, desc, eq, gte } from "drizzle-orm";

import { db } from "@/db";
import {
  dailyFortunes,
  usageQuotas,
  type DailyFortune,
} from "@/db/schema";
import { requireProfile } from "@/lib/auth/get-user";
import { safeShortText } from "@/lib/content/safety";
import { ROUTES, type FortuneCategoryId } from "@/lib/constants";
import { getHistory, type HistoryItem } from "@/lib/history/service";
import { getStreak } from "@/lib/streak/service";

export const metadata: Metadata = {
  title: "주간 리포트",
  description: "이번 주 운세, 타로, 궁합 기록을 한눈에 정리해요.",
};

const CATEGORY_LABELS: Record<FortuneCategoryId, string> = {
  general: "종합운",
  love: "연애운",
  money: "금전운",
  career: "커리어운",
  health: "건강운",
  study: "공부운",
  zodiac: "별자리운",
  chinese_zodiac: "띠운세",
};

const CATEGORY_GUIDES: Record<FortuneCategoryId, string> = {
  general: "전체 흐름을 자주 확인하고 있어요. 이번 주는 하루의 우선순위를 작게 잡는 쪽이 좋아요.",
  love: "관계 흐름에 마음이 많이 가 있어요. 빠른 결론보다 부드러운 확인이 더 잘 맞아요.",
  money: "금전 흐름을 신경 쓰는 주간이에요. 지출보다 정산과 계획을 먼저 보면 안정감이 올라가요.",
  career: "일과 방향에 시선이 모여 있어요. 할 일을 줄이고 핵심 하나를 끝내는 쪽이 좋아요.",
  health: "컨디션 관리가 중요한 주간이에요. 무리한 변화보다 루틴을 일정하게 지키는 게 좋아요.",
  study: "배움과 집중에 관심이 모였어요. 긴 시간보다 짧은 반복이 더 효과적이에요.",
  zodiac: "분위기 전환이 필요한 주간이에요. 작은 장소 변화나 산책이 흐름을 바꿔줄 수 있어요.",
  chinese_zodiac: "습관과 타이밍을 보는 주간이에요. 익숙한 순서를 지키면 흔들림이 줄어들어요.",
};

const CATEGORY_ORDER: FortuneCategoryId[] = [
  "general",
  "love",
  "money",
  "career",
  "health",
  "study",
  "zodiac",
  "chinese_zodiac",
];

function kstDateBefore(days: number): string {
  const date = new Date(Date.now() - days * 86_400_000);
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

function shortDate(date: string): string {
  const [, month, day] = date.split("-");
  return `${Number(month)}/${Number(day)}`;
}

function isInWeek(item: HistoryItem, weekStartDate: Date): boolean {
  return item.date.getTime() >= weekStartDate.getTime();
}

export default async function WeeklyPage() {
  const { profile } = await requireProfile();
  const weekStart = kstDateBefore(6);
  const today = kstDateBefore(0);
  const weekStartDate = new Date(`${weekStart}T00:00:00+09:00`);
  const rangeLabel = `${weekStart.replace(/-/g, ".")} ~ ${today.replace(/-/g, ".")}`;

  const [fortunes, quotaRows, streak, history] = await Promise.all([
    db
      .select()
      .from(dailyFortunes)
      .where(
        and(
          eq(dailyFortunes.userId, profile.userId),
          gte(dailyFortunes.fortuneDate, weekStart),
        ),
      )
      .orderBy(desc(dailyFortunes.fortuneDate), desc(dailyFortunes.createdAt))
      .catch(() => []),
    db
      .select()
      .from(usageQuotas)
      .where(
        and(
          eq(usageQuotas.userId, profile.userId),
          gte(usageQuotas.usageDate, weekStart),
        ),
      )
      .catch(() => []),
    getStreak(profile.userId).catch(() => null),
    getHistory(profile.userId, 30).catch(() => []),
  ]);

  const weeklyHistory = history.filter((item) => isInWeek(item, weekStartDate));
  const fortuneRecords = weeklyHistory.filter((item) => item.kind === "fortune");
  const tarotRecords = weeklyHistory.filter((item) => item.kind === "tarot");
  const compatibilityRecords = weeklyHistory.filter(
    (item) => item.kind === "compatibility",
  );
  const chatCount = quotaRows.reduce((sum, row) => sum + row.chatCount, 0);
  const activeDays = new Set([
    ...fortunes.map((fortune) => fortune.fortuneDate),
    ...quotaRows.map((row) => row.usageDate),
  ]).size;
  const averageScore =
    fortunes.length > 0
      ? Math.round(
          fortunes.reduce((sum, fortune) => sum + fortune.score, 0) /
            fortunes.length,
        )
      : null;
  const categoryStats = buildCategoryStats(fortunes);
  const topCategory = categoryStats[0]?.category ?? null;
  const trendPoints = buildTrendPoints(fortunes, weekStart);
  const recentRecords = weeklyHistory.slice(0, 4);
  const weeklyTone = buildWeeklyTone(averageScore, weeklyHistory.length);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-7">
      <header className="app-surface rounded-3xl border px-5 py-6 sm:px-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-primary/70">
              Weekly Report
            </p>
            <h1 className="font-mystic text-4xl font-semibold tracking-tight sm:text-5xl">
              이번 주 흐름 리포트
            </h1>
            <p className="text-[15px] text-muted-foreground">{rangeLabel}</p>
          </div>
          <Link
            href={ROUTES.today as Route}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/25 px-4 py-2.5 text-[14px] font-semibold text-primary transition hover:bg-primary/10"
          >
            오늘 운세 보기
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <p className="mt-5 max-w-2xl text-[15px] leading-7 text-muted-foreground">
          최근 7일 동안 본 운세, 타로, 궁합 기록을 모아 이번 주의 관심사와
          흐름을 정리했어요.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={BarChart3}
          label="평균 운세"
          value={averageScore === null ? "-" : `${averageScore}점`}
        />
        <StatCard
          icon={CalendarDays}
          label="방문한 날"
          value={`${activeDays}일`}
          sub={streak ? `연속 ${streak.currentStreak}일` : undefined}
        />
        <StatCard
          icon={Library}
          label="이번 주 기록"
          value={`${weeklyHistory.length}개`}
        />
        <StatCard
          icon={MessageCircle}
          label="멤버와 대화"
          value={`${chatCount}개`}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="app-surface rounded-3xl border p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">7일 운세 점수 흐름</h2>
              <p className="mt-1 text-[14px] text-muted-foreground">
                운세를 본 날의 평균 점수를 기준으로 보여줘요.
              </p>
            </div>
            <TrendingUp className="h-5 w-5 text-primary" aria-hidden />
          </div>
          <WeeklyBars points={trendPoints} />
        </div>

        <div className="app-surface rounded-3xl border p-5">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" aria-hidden />
            <h2 className="text-xl font-semibold">이번 주 한 줄 요약</h2>
          </div>
          <p className="mt-4 text-2xl font-semibold leading-snug">
            {weeklyTone}
          </p>
          <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
            {topCategory ? (
              <>
                가장 많이 확인한 분야는{" "}
                <span className="font-semibold text-foreground">
                  {CATEGORY_LABELS[topCategory]}
                </span>
                이에요. {CATEGORY_GUIDES[topCategory]}
              </>
            ) : (
              "이번 주 기록이 아직 적어요. 오늘 운세나 타로를 한 번 보면 다음 리포트가 더 선명해져요."
            )}
          </p>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          icon={Sun}
          label="운세"
          value={`${fortuneRecords.length}개`}
          body="오늘의 흐름을 확인한 기록이에요."
        />
        <SummaryCard
          icon={Sparkles}
          label="타로"
          value={`${tarotRecords.length}개`}
          body="마음에 걸린 질문과 선택의 기록이에요."
        />
        <SummaryCard
          icon={Heart}
          label="궁합"
          value={`${compatibilityRecords.length}개`}
          body="관계와 거리감을 살핀 기록이에요."
        />
      </section>

      <section className="app-surface rounded-3xl border p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">분야별 관심도</h2>
            <p className="mt-1 text-[14px] text-muted-foreground">
              이번 주 어떤 운세를 가장 많이 봤는지 정리했어요.
            </p>
          </div>
        </div>

        {categoryStats.length > 0 ? (
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {categoryStats.map((item) => (
              <CategoryCard key={item.category} item={item} />
            ))}
          </div>
        ) : (
          <EmptyWeeklyState />
        )}
      </section>

      <section className="app-surface rounded-3xl border p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">최근 기록</h2>
            <p className="mt-1 text-[14px] text-muted-foreground">
              이번 주 기록을 다시 열어볼 수 있어요.
            </p>
          </div>
          <Link
            href={ROUTES.archive as Route}
            className="text-[13px] font-semibold text-primary"
          >
            전체 보기
          </Link>
        </div>

        {recentRecords.length > 0 ? (
          <div className="mt-4 space-y-2">
            {recentRecords.map((item) => (
              <RecordLink key={`${item.kind}-${item.data.id}`} item={item} />
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-2xl border border-dashed border-white/15 px-5 py-6 text-center text-[14px] text-muted-foreground">
            이번 주 기록이 아직 없어요. 오늘 운세나 타로를 보면 여기에 쌓여요.
          </p>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <NextAction
          title="이번 주 마무리"
          body="가장 많이 본 분야 하나만 다시 확인하고, 오늘 할 수 있는 작은 행동으로 정리해요."
        />
        <NextAction
          title="다음 주 준비"
          body="점수가 낮았던 날보다 관심이 반복된 주제를 먼저 보면 다음 선택이 쉬워져요."
        />
        <NextAction
          title="재방문 포인트"
          body="하루에 한 번 기록을 남기면 주간 흐름이 더 선명하게 쌓여요."
        />
      </section>
    </div>
  );
}

function buildWeeklyTone(score: number | null, count: number): string {
  if (count === 0) return "이번 주는 아직 흐름을 모으는 중이에요.";
  if (score === null) return "이번 주는 기록의 종류가 넓어지고 있어요.";
  if (score >= 75) return "이번 주는 흐름이 안정적으로 올라온 편이에요.";
  if (score >= 55) return "이번 주는 무리하지 않으면 균형을 잡기 좋은 흐름이에요.";
  return "이번 주는 속도를 낮추고 정리하는 쪽이 더 잘 맞아요.";
}

function buildCategoryStats(fortunes: DailyFortune[]) {
  return CATEGORY_ORDER.map((category) => {
    const rows = fortunes.filter((fortune) => fortune.category === category);
    if (rows.length === 0) return null;
    return {
      category,
      count: rows.length,
      avg: Math.round(
        rows.reduce((sum, row) => sum + row.score, 0) / rows.length,
      ),
    };
  })
    .filter(
      (
        item,
      ): item is { category: FortuneCategoryId; count: number; avg: number } =>
        !!item,
    )
    .sort((a, b) => b.count - a.count || b.avg - a.avg);
}

function buildTrendPoints(fortunes: DailyFortune[], weekStart: string) {
  const start = new Date(`${weekStart}T00:00:00+09:00`);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const dateStr = date.toLocaleDateString("en-CA", {
      timeZone: "Asia/Seoul",
    });
    const rows = fortunes.filter((fortune) => fortune.fortuneDate === dateStr);
    const score = rows.length
      ? Math.round(rows.reduce((sum, row) => sum + row.score, 0) / rows.length)
      : null;
    return { date: dateStr, score };
  });
}

function WeeklyBars({
  points,
}: {
  points: Array<{ date: string; score: number | null }>;
}) {
  return (
    <div className="mt-5 grid h-48 grid-cols-7 items-end gap-2">
      {points.map((point) => {
        const height = point.score === null ? 8 : Math.max(18, point.score);
        return (
          <div
            key={point.date}
            className="flex h-full flex-col items-center justify-end gap-2"
          >
            <div className="flex h-full w-full items-end justify-center rounded-2xl bg-white/[0.04] px-1.5 py-2">
              <div
                className="w-full rounded-xl bg-primary/75"
                style={{
                  height: `${height}%`,
                  opacity: point.score === null ? 0.25 : 1,
                }}
                aria-hidden
              />
            </div>
            <div className="text-center">
              <p className="text-[12px] font-semibold tabular-nums">
                {point.score ?? "-"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {shortDate(point.date)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  sub,
  value,
}: {
  icon: LucideIcon;
  label: string;
  sub?: string;
  value: string;
}) {
  return (
    <div className="app-surface rounded-2xl border px-4 py-4">
      <div className="flex items-center gap-2 text-[13px] font-semibold text-muted-foreground">
        <Icon className="h-4 w-4" aria-hidden />
        {label}
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {sub ? <p className="mt-1 text-[12px] text-primary">{sub}</p> : null}
    </div>
  );
}

function SummaryCard({
  body,
  icon: Icon,
  label,
  value,
}: {
  body: string;
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="app-surface rounded-2xl border px-4 py-4">
      <div className="flex items-center gap-2 text-primary">
        <Icon className="h-4 w-4" aria-hidden />
        <p className="text-[15px] font-semibold text-foreground">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      <p className="mt-2 text-[13px] leading-5 text-muted-foreground">{body}</p>
    </div>
  );
}

function CategoryCard({
  item,
}: {
  item: { category: FortuneCategoryId; count: number; avg: number };
}) {
  return (
    <Link
      href={`${ROUTES.today}?category=${item.category}` as Route}
      className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition hover:border-primary/30 hover:bg-primary/5"
    >
      <p className="text-[15px] font-semibold">
        {CATEGORY_LABELS[item.category]}
      </p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-[12px] text-muted-foreground">확인</p>
          <p className="text-lg font-semibold">{item.count}회</p>
        </div>
        <div className="text-right">
          <p className="text-[12px] text-muted-foreground">평균</p>
          <p className="text-lg font-semibold text-primary">{item.avg}점</p>
        </div>
      </div>
    </Link>
  );
}

function RecordLink({ item }: { item: HistoryItem }) {
  const href = `/archive/${item.kind}/${item.data.id}` as Route;
  const label =
    item.kind === "fortune"
      ? "운세"
      : item.kind === "tarot"
        ? "타로"
        : "궁합";
  const title =
    item.kind === "fortune"
      ? CATEGORY_LABELS[item.data.category as FortuneCategoryId]
      : item.kind === "tarot"
        ? safeShortText(item.data.question, "질문 없이 뽑은 카드")
        : `${safeShortText(item.data.partnerName, "상대")}와의 궁합`;

  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition hover:border-primary/30"
    >
      <span className="min-w-0">
        <span className="text-[12px] font-semibold text-primary">{label}</span>
        <span className="mt-1 block truncate text-[15px] font-semibold">
          {title}
        </span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

function NextAction({ body, title }: { body: string; title: string }) {
  return (
    <div className="app-surface rounded-2xl border px-4 py-4">
      <p className="font-semibold">{title}</p>
      <p className="mt-2 text-[14px] leading-6 text-muted-foreground">{body}</p>
    </div>
  );
}

function EmptyWeeklyState() {
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-white/15 px-5 py-8 text-center">
      <p className="font-semibold">아직 이번 주 운세 기록이 없어요</p>
      <p className="mt-2 text-[14px] text-muted-foreground">
        오늘 운세를 한 번 보면 주간 리포트가 자동으로 쌓여요.
      </p>
      <Link
        href={ROUTES.today as Route}
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[14px] font-semibold text-primary-foreground"
      >
        오늘 운세 시작하기
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}
