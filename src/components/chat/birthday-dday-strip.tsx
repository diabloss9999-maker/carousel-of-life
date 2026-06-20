/**
 * 멤버 생일 D-day 스트립.
 *
 * 멤버 목록 상단에 가장 가까운 생일 1~2명을 보여준다.
 * 생일 당일이면 축하 톤으로 강조한다.
 */
import { CHARACTERS } from "@/lib/chat/characters";
import { getUpcomingBirthdays } from "@/lib/profile/member-birthdays";
import { cn } from "@/lib/utils";

export function BirthdayDdayStrip() {
  const upcoming = getUpcomingBirthdays(2);
  if (upcoming.length === 0) return null;

  const isTodayBirthday = upcoming[0].dday === 0;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border px-4 py-2.5 text-[14px]",
        isTodayBirthday
          ? "border-rose-300/40 bg-gradient-to-r from-rose-400/15 via-amber-300/10 to-transparent"
          : "border-border/40 bg-background/30",
      )}
    >
      <span className="font-semibold text-foreground/80" aria-hidden>
        생일
      </span>
      {upcoming.map(({ characterId, month, day, dday }) => {
        const name = CHARACTERS[characterId]?.name ?? characterId;
        return (
          <span key={characterId} className="inline-flex items-baseline gap-1.5">
            <span className="font-semibold text-foreground/90">{name}</span>
            <span className="text-muted-foreground">
              {month}월 {day}일
            </span>
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[12px] font-bold leading-none",
                dday === 0
                  ? "bg-rose-400/90 text-white"
                  : dday <= 7
                    ? "bg-amber-300/80 text-black"
                    : "bg-foreground/10 text-foreground/70",
              )}
            >
              {dday === 0 ? "오늘 생일!" : `D-${dday}`}
            </span>
          </span>
        );
      })}
    </div>
  );
}
