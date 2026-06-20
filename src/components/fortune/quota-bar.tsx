import Link from "next/link";
import { Crown, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

export type QuotaTier = "free" | "lite" | "pro";

interface QuotaBarProps {
  tier?: QuotaTier;
}

export async function QuotaBar({ tier = "free" }: QuotaBarProps) {
  if (tier === "pro") {
    return (
      <div className="quota-glass-bar">
        <div className="flex items-center justify-between gap-3">
          <span className="flex shrink-0 items-center gap-1.5">
            <Crown className="h-4 w-4 text-accent" aria-hidden />
            <span className="font-mystic text-[14px] font-semibold">
              프로 사용 중
            </span>
          </span>
          <span className="hidden text-[13px] text-muted-foreground sm:inline">
            깊은 리포트와 추가 기능이 열려 있어요.
          </span>
        </div>
      </div>
    );
  }

  const isLite = tier === "lite";

  return (
    <div className="quota-glass-bar">
      <div className="flex items-center justify-between gap-3">
        <span className="flex shrink-0 items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden />
          <span className="font-mystic text-[14px] font-semibold">
            {isLite ? "라이트 사용 중" : "무료 플랜"}
          </span>
        </span>
        <Button
          asChild
          size="sm"
          variant="ghost"
          className="quota-upgrade-button ml-auto h-8 px-3.5 text-[13px]"
        >
          <Link href={ROUTES.pricing}>
            {isLite ? "프로 보기" : "플랜 보기"}
          </Link>
        </Button>
      </div>
    </div>
  );
}
