import Link from "next/link";
import type { Route } from "next";
import { CalendarRange } from "lucide-react";

import { ROUTES } from "@/lib/constants";
import {
  getWeeklyTiming,
  type TimingDay,
  type TimingTone,
} from "@/lib/timing/weekly-timing";
import type { Profile } from "@/db/schema";
import { cn } from "@/lib/utils";

/** 톤별 스타일 — 좋은 흐름/조심/잔잔. */
const TONE_STYLE: Record<
  TimingTone,
  { dot: string; chip: string; mark: string }
> = {
  good: {
    dot: "bg-emerald-400",
    chip: "border-emerald-400/30 bg-emerald-400/10",
    mark: "✨",
  },
  caution: {
    dot: "bg-amber-400",
    chip: "border-amber-400/30 bg-amber-400/10",
    mark: "·",
  },
  calm: {
    dot: "bg-white/30",
    chip: "border-white/10 bg-white/[0.04]",
    mark: "·",
  },
};

/**
 * 이번 주 타이밍 스트립 — 오늘부터 7일의 흐름을 한눈에.
 * 좋은 날(✨)·조심할 날을 톤 색으로 구분해 보여준다.
 */
export function WeeklyTimingStrip({ profile }: { profile: Profile }) {
  const timing = getWeeklyTiming(profile);

  return (
    <section className="app-surface rounded-3xl border border-white/10 p-4 sm:p-5">
      <div className="flex items-center gap-2 text-primary">
        <CalendarRange className="h-4 w-4" aria-hidden />
        <h2 className="text-[13px] font-semibold">이번 주 흐름</h2>
        <span className="text-[11px] font-medium text-muted-foreground">
          타이밍
        </span>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1.5">
        {timing.days.map((day) => (
          <TimingPill key={day.date} day={day} />
        ))}
      </div>

      <p className="mt-3 text-[13px] leading-5 text-muted-foreground">
        {timing.summary}
      </p>

      {!timing.personalized ? (
        <Link
          href={ROUTES.saju as Route}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-primary/25 px-3 py-1.5 text-[13px] font-semibold text-primary transition hover:bg-primary/10"
        >
          사주 입력하고 이번 주 보기
        </Link>
      ) : null}
    </section>
  );
}

function TimingPill({ day }: { day: TimingDay }) {
  const style = TONE_STYLE[day.tone];

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 rounded-2xl border px-1 py-2 text-center transition",
        style.chip,
        day.isToday && "ring-2 ring-primary/60",
      )}
      title={day.headline}
    >
      <span
        className={cn(
          "text-[11px] font-medium",
          day.isToday ? "text-primary" : "text-muted-foreground",
        )}
      >
        {day.weekdayLabel}
      </span>
      <span className="text-[15px] font-semibold leading-none">
        {day.dayOfMonth}
      </span>
      <span
        className={cn("h-1.5 w-1.5 rounded-full", style.dot)}
        aria-hidden
      />
    </div>
  );
}
