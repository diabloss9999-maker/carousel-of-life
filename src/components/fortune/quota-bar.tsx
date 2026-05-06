import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ROUTES, FREE_DAILY_LIMITS } from "@/lib/constants";

interface QuotaBarProps {
  fortuneCount: number;
  tarotCount: number;
  chatCount: number;
}

export function QuotaBar({
  fortuneCount,
  tarotCount,
  chatCount,
}: QuotaBarProps) {
  return (
    <div className="rounded-lg border border-border/40 bg-card/40 p-4 backdrop-blur">
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
          className={
            exhausted
              ? "h-full rounded-full bg-destructive transition-all"
              : "h-full rounded-full bg-primary transition-all"
          }
          style={{ width: `${Math.min(100, (used / max) * 100)}%` }}
        />
      </div>
    </div>
  );
}
