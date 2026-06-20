/**
 * 이번 주 타이밍 — The Pattern 식 "좋은 날 / 조심할 날".
 *
 * 사주 일진 엔진(getDailyManse)을 오늘부터 7일치 돌려서
 * 그 주의 흐름이 좋은 날·조심할 날을 짚어준다. 결정론적 = AI 비용 0.
 */
import "server-only";

import type { Profile } from "@/db/schema";
import { getDailyManse } from "@/lib/saju/daily-manse";

export type TimingTone = "good" | "caution" | "calm";

export interface TimingDay {
  /** YYYY-MM-DD (KST). */
  date: string;
  /** 요일 한 글자(일·월·화…). */
  weekdayLabel: string;
  dayOfMonth: number;
  delta: number;
  tone: TimingTone;
  headline: string;
  isToday: boolean;
}

export interface WeeklyTiming {
  days: TimingDay[];
  /** 흐름이 가장 좋은 날(없으면 null). */
  bestDay: TimingDay | null;
  /** 가장 조심할 날(없으면 null). */
  cautionDay: TimingDay | null;
  summary: string;
  /** 사주가 계산돼 개인화된 결과인지. */
  personalized: boolean;
}

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;

/** KST 기준 오늘 날짜(YYYY-MM-DD). */
function todayKstDate(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

/** YYYY-MM-DD 문자열에 일수를 더한다(KST 정오 기준으로 안전). */
function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00+09:00`);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

/**
 * 오늘부터 7일간의 타이밍을 계산한다.
 */
export function getWeeklyTiming(
  profile: Profile,
  from: string = todayKstDate(),
): WeeklyTiming {
  const today = todayKstDate();
  const days: TimingDay[] = [];

  for (let i = 0; i < 7; i += 1) {
    const date = addDays(from, i);
    const manse = getDailyManse(profile, date);
    const parsed = new Date(`${date}T12:00:00+09:00`);
    days.push({
      date,
      weekdayLabel: WEEKDAY_LABELS[parsed.getDay()],
      dayOfMonth: parsed.getDate(),
      delta: manse?.delta ?? 0,
      tone: manse?.tone ?? "calm",
      headline:
        manse?.headline ?? "큰 변동 없이 잔잔하게 흐르는 하루예요.",
      isToday: date === today,
    });
  }

  const personalized = profile.sajuPillars != null;

  let bestDay: TimingDay | null = null;
  let cautionDay: TimingDay | null = null;
  if (personalized) {
    for (const d of days) {
      if (d.delta > 0 && (!bestDay || d.delta > bestDay.delta)) bestDay = d;
      if (d.delta < 0 && (!cautionDay || d.delta < cautionDay.delta)) {
        cautionDay = d;
      }
    }
  }

  let summary: string;
  if (!personalized) {
    summary = "사주를 입력하면 이번 주 좋은 날·조심할 날을 짚어드려요.";
  } else if (bestDay && cautionDay) {
    summary = `이번 주는 ${bestDay.weekdayLabel}요일 흐름이 가장 좋아요. ${cautionDay.weekdayLabel}요일은 한 박자 쉬어가요.`;
  } else if (bestDay) {
    summary = `이번 주는 ${bestDay.weekdayLabel}요일에 흐름이 살아나요. 그날 한 걸음 내디뎌봐요.`;
  } else if (cautionDay) {
    summary = `이번 주는 ${cautionDay.weekdayLabel}요일에 변동이 있을 수 있어요. 무리한 결정은 피해요.`;
  } else {
    summary = "이번 주는 큰 기복 없이 잔잔하게 흐르는 한 주예요.";
  }

  return { days, bestDay, cautionDay, summary, personalized };
}
