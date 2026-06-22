import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, CalendarRange } from "lucide-react";

import { ROUTES } from "@/lib/constants";
import {
  getWeeklyTiming,
  type TimingDay,
  type TimingTone,
} from "@/lib/timing/weekly-timing";
import type { Profile } from "@/db/schema";
import { cn } from "@/lib/utils";

const TONE_STYLE: Record<
  TimingTone,
  {
    accent: string;
    bg: string;
    glow: string;
    label: string;
    rail: string;
  }
> = {
  good: {
    accent: "#17b987",
    bg: "rgba(23,185,135,0.12)",
    glow: "rgba(23,185,135,0.22)",
    label: "좋음",
    rail: "bg-emerald-400",
  },
  caution: {
    accent: "#d69b00",
    bg: "rgba(214,155,0,0.12)",
    glow: "rgba(214,155,0,0.22)",
    label: "조율",
    rail: "bg-amber-400",
  },
  calm: {
    accent: "#737373",
    bg: "rgba(0,0,0,0.035)",
    glow: "rgba(0,0,0,0.07)",
    label: "보통",
    rail: "bg-zinc-300",
  },
};

export function WeeklyTimingStrip({ profile }: { profile: Profile }) {
  const timing = getWeeklyTiming(profile);
  const bestDay = timing.days.find((day) => day.tone === "good") ?? timing.days[0];

  return (
    <section className="app-surface overflow-hidden rounded-[28px] border border-black/10 bg-white/78 p-4 shadow-[0_16px_44px_rgba(35,39,48,0.06)] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-[16px] bg-[#fbf7ed] ring-1 ring-[#eadfc9]">
            <CalendarRange className="h-5 w-5 text-[#8b6a32]" aria-hidden />
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white" />
          </span>
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-primary/70">
              Timing Map
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">
              이번 주 흐름
            </h2>
          </div>
        </div>
        <span className="w-fit rounded-full border border-black/10 bg-white/72 px-3 py-1 text-[12px] font-semibold text-muted-foreground">
          추천일 {bestDay.weekdayLabel} {bestDay.dayOfMonth}
        </span>
      </div>

      <div className="relative mt-5">
        <div className="absolute left-5 right-5 top-[34px] h-px bg-gradient-to-r from-transparent via-black/10 to-transparent" />
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {timing.days.map((day) => (
            <TimingPill key={day.date} day={day} />
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-[20px] border border-black/10 bg-white/62 px-4 py-3">
        <p className="text-[14px] font-medium leading-6 text-foreground/86">
          {timing.summary}
        </p>
      </div>

      {!timing.personalized ? (
        <Link
          href={ROUTES.saju as Route}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-white/70 px-3 py-1.5 text-[13px] font-semibold text-primary transition hover:bg-primary/10"
        >
          사주 입력하고 이번 주 보기
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
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
        "group relative z-10 flex min-h-[84px] flex-col items-center justify-between rounded-[18px] border px-1.5 py-2.5 text-center transition",
        day.isToday
          ? "border-primary/30 bg-white ring-1 ring-primary/25"
          : "border-transparent bg-white/42 hover:border-black/10 hover:bg-white/72",
      )}
      style={day.isToday ? { boxShadow: `0 12px 30px ${style.glow}` } : undefined}
      title={day.headline}
    >
      <span
        className={cn(
          "text-[11px] font-semibold",
          day.isToday ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {day.weekdayLabel}
      </span>
      <span
        className="grid h-9 w-9 place-items-center rounded-full text-[16px] font-semibold leading-none"
        style={{
          background: style.bg,
          color: day.tone === "calm" ? "#1f1f1f" : style.accent,
        }}
      >
        {day.dayOfMonth}
      </span>
      <span
        className={cn("h-1.5 w-7 rounded-full", style.rail)}
        aria-label={style.label}
      />
    </div>
  );
}
