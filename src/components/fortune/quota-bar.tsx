import Link from "next/link";
import { Crown, Infinity as InfinityIcon, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ROUTES, FREE_DAILY_LIMITS, LITE_DAILY_LIMITS } from "@/lib/constants";

export type QuotaTier = "free" | "lite" | "pro";

interface QuotaBarProps {
  fortuneCount: number;
  tarotCount: number;
  chatCount: number;
  /** 사용자의 구독 티어. 기본은 "free". */
  tier?: QuotaTier;
}

export async function QuotaBar({
  fortuneCount,
  tarotCount,
  chatCount,
  tier = "free",
}: QuotaBarProps) {
  const t = await getTranslations("quotaBar");

  if (tier === "pro") {
    return (
      <div className="liquid-glass-panel liquid-quota-shell p-4 ring-1 ring-accent/15">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Crown className="h-5 w-5 text-accent" aria-hidden />
            <div className="space-y-0.5">
              <p className="font-mystic text-[15px] font-medium">{t("proActive")}</p>
              <p className="text-[15px] text-muted-foreground">
                {t("proSub")}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:gap-5 text-[15px]">
            <UnlimitedItem label={t("fortune")} used={fortuneCount} />
            <UnlimitedItem label={t("tarot")} used={tarotCount} />
            <UnlimitedItem label={t("chat")} used={chatCount} />
          </div>
        </div>
      </div>
    );
  }

  if (tier === "lite") {
    return (
      <div className="liquid-glass-panel liquid-quota-shell p-4 ring-1 ring-primary/15">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden />
            <p className="font-mystic text-[15px] font-medium">{t("lightPlan")}</p>
          </div>
          <Button asChild size="sm" variant="ghost" className="liquid-soft-button">
            <Link href={ROUTES.pricing}>{t("upgradePro")}</Link>
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-4 sm:gap-6 text-[15px]">
          <Item
            label={t("fortune")}
            used={fortuneCount}
            max={LITE_DAILY_LIMITS.fortune}
          />
          <Item
            label={t("tarot")}
            used={tarotCount}
            max={LITE_DAILY_LIMITS.tarot}
          />
          <Item
            label={t("chat")}
            used={chatCount}
            max={LITE_DAILY_LIMITS.chat}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="liquid-glass-panel liquid-quota-shell p-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="grid grid-cols-3 gap-4 sm:gap-6 text-[15px] flex-1 min-w-0">
          <Item
            label={t("fortune")}
            used={fortuneCount}
            max={FREE_DAILY_LIMITS.fortune}
          />
          <Item label={t("tarot")} used={tarotCount} max={FREE_DAILY_LIMITS.tarot} />
          <Item label={t("chat")} used={chatCount} max={FREE_DAILY_LIMITS.chat} />
        </div>
        <Button asChild size="sm" variant="ghost" className="liquid-soft-button">
          <Link href={ROUTES.pricing}>{t("upgrade")}</Link>
        </Button>
      </div>
    </div>
  );
}

function Item({
  label,
  used,
  max,
}: {
  label: string;
  used: number;
  max: number;
}) {
  const exhausted = used >= max;
  return (
    <div className="liquid-quota-metric space-y-2 rounded-2xl px-3 py-2">
      <div className="flex items-center justify-between text-[15px] text-muted-foreground">
        <span>{label}</span>
        <span className={exhausted ? "text-destructive font-medium" : ""}>
          {used}/{max}
        </span>
      </div>
      <div className="liquid-meter-track">
        <div
          className={cn(
            "liquid-meter-fill",
            exhausted && "is-exhausted",
          )}
          style={{ width: `${Math.min(100, (used / max) * 100)}%` }}
        />
      </div>
    </div>
  );
}

function UnlimitedItem({ label, used }: { label: string; used: number }) {
  return (
    <div className="liquid-quota-metric flex flex-col items-center rounded-2xl px-3 py-2 text-center">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium flex items-center gap-1 mt-0.5">
        <span className="tabular-nums">{used}</span>
        <span className="text-muted-foreground">/</span>
        <InfinityIcon className="h-3.5 w-3.5 text-accent" aria-hidden />
      </span>
    </div>
  );
}
