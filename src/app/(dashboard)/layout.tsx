import Link from "next/link";
import { LogOut } from "lucide-react";

import { TimeAwareHeader } from "@/components/layout/time-aware-header";
import { DesktopNav } from "@/components/layout/desktop-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { PromoBanner } from "@/components/layout/promo-banner";
import { MusicToggle } from "@/components/effects/music-toggle";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { getTranslations } from "next-intl/server";
import { RitualBody } from "@/components/crack/ritual-body";
import { FractureWhisper } from "@/components/fracture/fracture-whisper";
import { DailyWhisper } from "@/components/world/daily-whisper";
import { ContinuityNote } from "@/components/world/continuity-note";
import { SessionFade } from "@/components/world/session-fade";
import { LongAbsenceGreeting } from "@/components/world/long-absence-greeting";
import { EntityConversation } from "@/components/world/entity-conversation";
import { HiddenPresence } from "@/components/world/hidden-presence";
import { MemoryEcho } from "@/components/world/memory-echo";
import { ObservationFailureNote } from "@/components/world/observation-failure-note";
import { EntityInterference } from "@/components/world/entity-interference";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { siteConfig } from "@/config/site";
import { signOutAction } from "@/lib/auth/actions";
import { requireUser } from "@/lib/auth/get-user";
import { getCrackScore } from "@/lib/crack/service";
import { getStreak } from "@/lib/streak/service";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const tCommon = await getTranslations("common");
  const [crackData, streakRow] = await Promise.all([
    getCrackScore(user.id).catch(() => ({ level: 0 as const })),
    getStreak(user.id).catch(() => null),
  ]);
  const streakDays = streakRow?.currentStreak ?? 0;

  return (
    <div className="flex min-h-dvh flex-col">
      <RitualBody crackLevel={crackData.level} />

      <TimeAwareHeader
        className="sticky top-0 z-40 pt-safe mobile-app-header"
        style={{
          background: `var(--header-bg)`,
          boxShadow: "var(--header-shadow)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: "1px solid var(--header-border)",
        } as React.CSSProperties}
      >
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-2 px-safe-4 sm:h-16 sm:px-safe-6">
          <Link
            href={ROUTES.today}
            className="font-mystic max-w-[52vw] truncate whitespace-nowrap text-base font-semibold tracking-tight transition-opacity hover:opacity-75 sm:max-w-none sm:text-lg"
            style={{ color: "var(--ritual-text)", letterSpacing: "0.04em" }}
          >
            {siteConfig.name}
          </Link>

          <DesktopNav />

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <LanguageToggle />
            <MusicToggle />
            <form action={signOutAction}>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="rounded-full px-3"
                style={{
                  border: "1px solid var(--ritual-line)",
                  color: "var(--ritual-muted)",
                  background: "rgba(255,255,255,0.12)",
                }}
              >
                <LogOut className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">{tCommon("logout")}</span>
              </Button>
            </form>
          </div>
        </div>
      </TimeAwareHeader>

      <PromoBanner />

      <main id="main-content" className="flex-1">
        <div className="mobile-app-content mx-auto w-full max-w-6xl px-safe-4 py-5 sm:px-safe-6 sm:py-7 md:py-10">
          {children}
        </div>
      </main>

      <MobileNav />
      <FractureWhisper />
      <DailyWhisper />
      <ContinuityNote streakDays={streakDays} />
      <LongAbsenceGreeting />
      <EntityConversation />
      <HiddenPresence />
      <MemoryEcho />
      <ObservationFailureNote />
      <EntityInterference />
      <SessionFade />
    </div>
  );
}
