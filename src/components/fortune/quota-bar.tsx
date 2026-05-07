import Link from "next/link";
import { Crown, Infinity as InfinityIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ROUTES, FREE_DAILY_LIMITS } from "@/lib/constants";

interface QuotaBarProps {
  fortuneCount: number;
  tarotCount: number;
  chatCount: number;
  /** 활성 구독자 여부. true 면 무제한 UI 로 변경. */
  subscribed?: boolean;
}

export function QuotaBar({
  fortuneCount,
  tarotCount,
  chatCount,
  subscribed = false,
}: QuotaBarProps) {
  if (subscribed) {
    return (
      <div className="rounded-2xl border border-accent/30 bg-card/50 p-4 backdrop-blur ring-1 ring-accent/20">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Crown className="h-5 w-5 text-accent" aria-hidden />
            <div className="space-y-0.5">
              <p className="font-mystic text-sm font-medium">
                프리미엄 사용 중
              </p>
              <p className="text-xs text-muted-foreground">
                운세·타로·문답 모두 무제한이야.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:gap-5 text-xs">
            <UnlimitedItem label="운세" used={fortuneCount} />
            <UnlimitedItem label="타로" used={tarotCount} />
            <UnlimitedItem label="문답" used={chatCount} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/40 bg-card/40 p-4 backdrop-blur">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="grid grid-cols-3 gap-4 sm:gap-6 text-sm flex-1 min-w-0">
          <Item
            label="운세"
            used={fortuneCount}
            max={FREE_DAILY_LIMITS.fortune}
          />
          <Item label="타로" used={tarotCount} max={FREE_DAILY_LIMITS.tarot} />
          <Item label="문답" used={chatCount} max={FREE_DAILY_LIMITS.chat} />
        </div>
        <Button asChild size="sm" variant="ghost">
          <Link href={ROUTES.pricing}>프리미엄으로</Link>
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
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className={exhausted ? "text-destructive font-medium" : ""}>
          {used}/{max}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            exhausted ? "bg-destructive" : "bg-primary",
          )}
          style={{ width: `${Math.min(100, (used / max) * 100)}%` }}
        />
      </div>
    </div>
  );
}

function UnlimitedItem({ label, used }: { label: string; used: number }) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium flex items-center gap-1 mt-0.5">
        <span className="tabular-nums">{used}</span>
        <span className="text-muted-foreground">/</span>
        <InfinityIcon className="h-3.5 w-3.5 text-accent" aria-hidden />
      </span>
    </div>
  );
}
