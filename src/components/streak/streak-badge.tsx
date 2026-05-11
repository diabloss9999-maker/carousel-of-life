"use client";

/**
 * 연속 출석 스트릭 배지.
 * 마일스톤 달성 시 축하 메시지를 보여준다.
 */
import { useEffect, useRef } from "react";
import { Flame, Gift } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import type { CheckInResult } from "@/lib/streak/service";

interface StreakBadgeProps {
  checkIn: CheckInResult;
}

/** 마일스톤 메시지 */
const MILESTONE_MESSAGES: Record<number, string> = {
  3:  "3일 연속 출석 달성! 보너스 가챠 1회 지급됐어.",
  7:  "7일 연속 달성! 보너스 가챠 2회 지급됐어.",
  14: "14일 연속 달성! 보너스 가챠 2회 지급됐어.",
  30: "30일 연속 달성! 보너스 가챠 3회 지급됐어.",
};

function getMilestoneMessage(streak: number, bonus: number): string | null {
  if (bonus <= 0) return null;
  return MILESTONE_MESSAGES[streak] ?? `${streak}일 연속 달성! 보너스 가챠 ${bonus}회 지급됐어.`;
}

export function StreakBadge({ checkIn }: StreakBadgeProps) {
  const { currentStreak, milestoneBonus, bonusGachaCredits, wasReset } = checkIn;
  const notified = useRef(false);

  useEffect(() => {
    if (notified.current) return;
    notified.current = true;

    if (milestoneBonus > 0) {
      const msg = getMilestoneMessage(currentStreak, milestoneBonus);
      if (msg) {
        setTimeout(() => toast.success(msg, { duration: 5000 }), 500);
      }
    } else if (wasReset && currentStreak === 1) {
      setTimeout(
        () => toast("스트릭이 초기화됐어. 오늘부터 다시 시작!", { duration: 3000 }),
        300,
      );
    }
  }, [currentStreak, milestoneBonus, wasReset]);

  const isHot = currentStreak >= 7;

  return (
    <div className="flex items-center gap-3">
      {/* 연속 출석 */}
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold",
          isHot
            ? "bg-orange-500/15 text-orange-500 dark:text-orange-400"
            : "bg-muted/50 text-muted-foreground",
        )}
      >
        <Flame
          className={cn(
            "h-4 w-4",
            isHot && "animate-pulse",
          )}
          aria-hidden
        />
        <span>{currentStreak}일 연속</span>
      </div>

      {/* 보너스 가챠 크레딧 */}
      {bonusGachaCredits > 0 && (
        <div className="flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1.5 text-sm font-semibold text-primary">
          <Gift className="h-4 w-4" aria-hidden />
          <span>보너스 +{bonusGachaCredits}</span>
        </div>
      )}
    </div>
  );
}
