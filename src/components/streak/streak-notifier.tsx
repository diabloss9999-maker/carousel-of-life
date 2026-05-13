"use client";

/**
 * 스트릭 마일스톤 토스트 알림만 담당하는 무 UI 컴포넌트.
 * 시각적 표시는 today/page 의 카드가 담당한다.
 */
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import type { CheckInResult } from "@/lib/streak/service";

interface StreakNotifierProps {
  checkIn: CheckInResult;
}

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

export function StreakNotifier({ checkIn }: StreakNotifierProps) {
  const { currentStreak, milestoneBonus, wasReset } = checkIn;
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

  return null;
}
