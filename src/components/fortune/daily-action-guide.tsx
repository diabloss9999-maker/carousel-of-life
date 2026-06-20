import { AlertTriangle, Clock3, Sparkles, Target } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { DailyFortune } from "@/db/schema";
import { getDailyActionGuide } from "@/lib/fortune/daily-action-guide";

interface DailyActionGuideProps {
  fortune: DailyFortune;
}

export function DailyActionGuide({ fortune }: DailyActionGuideProps) {
  const guide = getDailyActionGuide(fortune);

  return (
    <Card className="border-white/15 bg-white/[0.06] shadow-none">
      <CardContent className="grid gap-2 p-3 sm:grid-cols-2 sm:p-4">
        <GuideItem icon={Clock3} label="좋은 시간" value={guide.luckyTime} />
        <GuideItem icon={Sparkles} label="오늘의 기회" value={guide.opportunity} />
        <GuideItem icon={AlertTriangle} label="주의할 점" value={guide.caution} />
        <GuideItem icon={Target} label="실천 기준" value={guide.action} />
      </CardContent>
    </Card>
  );
}

function GuideItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3">
      <div className="flex items-center gap-2 text-[12px] font-semibold text-muted-foreground">
        <Icon className="h-4 w-4" aria-hidden />
        {label}
      </div>
      <p className="mt-1.5 text-[15px] font-medium leading-6 text-foreground/90">
        {value}
      </p>
    </div>
  );
}
