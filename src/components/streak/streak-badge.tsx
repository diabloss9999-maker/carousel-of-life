"use client";

/**
 * 연속 출석 스트릭 배지.
 * 마일스톤 달성 시 축하 메시지를 보여준다.
 */
import { useEffect, useRef } from "react";
import Link from "next/link";
import { Flame, Gift } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import type { CheckInResult } from "@/lib/streak/service";

interface StreakBadgeProps {
  checkIn: CheckInResult;
}

export function StreakBadge({ checkIn }: StreakBadgeProps) {
  const { currentStreak, milestoneBonus, bonusGachaCredits, wasReset } = checkIn;
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

  const isHot = currentStreak >= 7;

  return (
    <div className="flex items-center gap-3">
      {/* 연속 출석 — 클릭 시 운명 로그로 이동 */}
      <Link
        href="/history"
        className={cn(
          "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-opacity hover:opacity-80",
          isHot
            ? "bg-orange-500/15 text-orange-500 dark:text-orange-400"
            : "bg-muted/50 text-muted-foreground",
        )}
      >
        {isHot ? (
          <Flame className="h-4 w-4 animate-pulse" aria-hidden />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/icons/fracture-mark.svg" alt="" aria-hidden className="h-4 w-4 opacity-60" />
        )}
        <span>{t("badgeLabel", { n: currentStreak })}</span>
      </Link>

      {/* 보너스 가챠 크레딧 */}
      {bonusGachaCredits > 0 && (
        <div className="flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1.5 text-sm font-semibold text-primary">
          <Gift className="h-4 w-4" aria-hidden />
          <span>{t("bonus", { n: bonusGachaCredits })}</span>
        </div>
      )}
    </div>
  );
}
