import { getTranslations } from "next-intl/server";

import {
  formatTimeAgo,
  getTodayEventLog,
  type WorldEvent,
} from "@/lib/world/event-log";

interface EventLogFeedProps {
  /** 사용자의 현재 크랙 레벨 (0~4). 톤 가중치 결정에 사용. */
  crackLevel: number;
}

const TONE_COLOR: Record<WorldEvent["tone"], string> = {
  normal: "text-muted-foreground border-white/15",
  warning: "text-amber-400/85 border-amber-400/25",
  critical: "text-red-400/85 border-red-400/30",
};

/**
 * 오늘의 관측 로그 피드.
 *
 * - daily seed 기반 결정론적 이벤트 4~5건을 시간 역순으로 표시한다.
 * - 게임화 금지 원칙에 따라 점수/카운트는 노출하지 않는다(총 건수만 표시).
 */
export async function EventLogFeed({ crackLevel }: EventLogFeedProps) {
  const events = getTodayEventLog(crackLevel);
  const t = await getTranslations("worldAtmosphere");

  return (
    <div className="app-surface rounded-2xl p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {t("obsLog")}
        </p>
        <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
          {t("logCount", { n: events.length })}
        </span>
      </div>

      <ul className="space-y-2">
        {events.map((event, i) => (
          <li
            key={`${event.minutesAgo}-${i}`}
            className={`flex items-start gap-2 border-l pl-3 py-0.5 ${TONE_COLOR[event.tone]}`}
          >
            <span className="text-[10px] font-mono tabular-nums shrink-0 mt-0.5 text-muted-foreground">
              {formatTimeAgo(event.minutesAgo)}
            </span>
            <span className="text-xs leading-relaxed font-mystic">
              {event.text}
            </span>
          </li>
        ))}
      </ul>

      <p className="text-[10px] text-muted-foreground/60 leading-relaxed font-mono">
        {t("logCorrupted")}
      </p>
    </div>
  );
}
