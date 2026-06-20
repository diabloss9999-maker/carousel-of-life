"use client";

/**
 * 연속 출석 스트릭 배지.
 * 마일스톤 달성 시 축하 메시지를 보여준다.
 */
import { useEffect, useRef } from "react";
import { Flame, Gift, Star } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import type { CheckInResult } from "@/lib/streak/service";

interface StreakBadgeProps {
  checkIn: CheckInResult;
}

export function StreakBadge({ checkIn }: StreakBadgeProps) {
  const { currentStreak, milestoneBonus, bonusGachaCredits, wasReset, starPiecesAwarded } = checkIn;
  const notified = useRef(false);
  const t = useTranslations("streak");

  useEffect(() => {
    if (notified.current) return;
    notified.current = true;

    if (starPiecesAwarded > 0) {
      setTimeout(
        () =>
          toast.success(`오늘 출석 보상 ✦ 별조각 ${starPiecesAwarded}개!`, {
            description:
              currentStreak % 7 === 0
                ? `${currentStreak}일 연속 보너스 포함이에요. 멤버에게 선물해보세요 🎁`
                : "7일 연속이면 +50개 보너스가 있어요.",
            duration: 5000,
          }),
        700,
      );
    }

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
  }, [currentStreak, milestoneBonus, wasReset, starPiecesAwarded, t]);

  const isHot = currentStreak >= 7;

  return (
    <div className="flex items-center gap-3">
      {/* 연속 출석 — 클릭 시 운명 로그로 이동 */}
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[15px] font-semibold",
          isHot
            ? "bg-orange-500/15 text-orange-500 dark:text-orange-400"
            : "bg-muted/50 text-muted-foreground",
        )}
      >
        {isHot ? (
          <Flame className="h-4 w-4 animate-pulse" aria-hidden />
        ) : (
          <Star className="h-4 w-4 opacity-70" aria-hidden />
        )}
        <span>{t("badgeLabel", { n: currentStreak })}</span>
      </div>

      {/* 보너스 가챠 크레딧 */}
      {bonusGachaCredits > 0 && (
        <div className="flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1.5 text-[15px] font-semibold text-primary">
          <Gift className="h-4 w-4" aria-hidden />
          <span>{t("bonus", { n: bonusGachaCredits })}</span>
        </div>
      )}
    </div>
  );
}
