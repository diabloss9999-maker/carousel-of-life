"use client";

/**
 * 스트릭 마일스톤 토스트 알림만 담당하는 무 UI 컴포넌트.
 * 시각적 표시는 today/page 의 카드가 담당한다.
 */
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import type { CheckInResult } from "@/lib/streak/service";

interface StreakNotifierProps {
  checkIn: CheckInResult;
}

export function StreakNotifier({ checkIn }: StreakNotifierProps) {
  const { currentStreak, milestoneBonus, wasReset } = checkIn;
  const notified = useRef(false);
  const t = useTranslations("streak");

  useEffect(() => {
    if (notified.current) return;
    notified.current = true;

    if (milestoneBonus > 0) {
      const key =
        currentStreak === 3 ? "milestone3"
        : currentStreak === 7 ? "milestone7"
        : currentStreak === 30 ? "milestone30"
        : currentStreak === 100 ? "milestone100"
        : null;
      const msg = key
        ? t(key as "milestone3" | "milestone7" | "milestone30" | "milestone100")
        : t("milestoneGeneric", { n: currentStreak });
      setTimeout(() => toast.success(msg, { duration: 5000 }), 500);
    } else if (wasReset && currentStreak === 1) {
      setTimeout(
        () => toast(t("reset"), { duration: 3000 }),
        300,
      );
    }
  }, [currentStreak, milestoneBonus, wasReset, t]);

  return null;
}
