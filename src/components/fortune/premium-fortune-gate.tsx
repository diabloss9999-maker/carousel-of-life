import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";
import type { FortuneCategoryId } from "@/lib/constants";

interface PremiumFortuneGateProps {
  category: FortuneCategoryId;
}

export async function PremiumFortuneGate({ category }: PremiumFortuneGateProps) {
  const t = await getTranslations("premiumGate");
  const copy =
    category === "zodiac"
      ? { title: t("zodiacTitle"), description: t("zodiacBody") }
      : category === "chinese_zodiac"
        ? { title: t("chineseTitle"), description: t("chineseBody") }
        : { title: t("fallbackTitle"), description: t("fallbackBody") };

  return (
    <Card className="app-surface">
      <CardHeader className="space-y-3 pb-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-amber-400/40 bg-amber-400/10">
          <Lock className="h-6 w-6 text-amber-400" aria-hidden />
        </div>
        <CardTitle className="font-mystic text-center text-xl">
          {copy.title}
        </CardTitle>
        <CardDescription className="text-center text-[15px] leading-relaxed">
          {copy.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        <Button asChild size="lg" className="w-full max-w-xs">
          <Link href={ROUTES.pricing}>
            <Sparkles className="h-4 w-4" aria-hidden />
            {t("subscribeCta")}
          </Link>
        </Button>
        <p className="text-[15px] text-muted-foreground">
          {t("footer")}
        </p>
      </CardContent>
    </Card>
  );
}
