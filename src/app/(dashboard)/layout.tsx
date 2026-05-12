import Link from "next/link";
import { LogOut } from "lucide-react";

import { TimeAwareHeader } from "@/components/layout/time-aware-header";
import { DesktopNav } from "@/components/layout/desktop-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { RitualBody } from "@/components/crack/ritual-body";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { siteConfig } from "@/config/site";
import { signOutAction } from "@/lib/auth/actions";
import { requireUser } from "@/lib/auth/get-user";
import { getCrackScore } from "@/lib/crack/service";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const crackData = await getCrackScore(user.id).catch(() => ({ level: 0 as const }));

  return (
    <div className="flex min-h-screen flex-col">
      {/* 낮/밤 배경 + 균열 클래스 자동 적용 */}
      <RitualBody crackLevel={crackData.level} />

      <TimeAwareHeader
        className="sticky top-0 z-40 pt-safe"
        style={{
          background: `url("/nav/desktop_nav_bg.svg") center / 100% 64px no-repeat,
                       linear-gradient(to bottom, rgba(255,252,247,.92), rgba(255,252,247,.84))`,
          boxShadow: "0 8px 22px rgba(36,29,47,.07)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        } as React.CSSProperties}
      >
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link
            href={ROUTES.today}
            className="font-mystic whitespace-nowrap text-lg font-semibold tracking-tight text-foreground transition-opacity hover:opacity-75"
          >
            {siteConfig.name}
          </Link>

          <DesktopNav />

          <form action={signOutAction}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="rounded-full border border-border/55 bg-card/45 px-3 text-muted-foreground shadow-sm backdrop-blur hover:bg-card/70 hover:text-foreground"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">로그아웃</span>
            </Button>
          </form>
        </div>
      </TimeAwareHeader>

      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-safe-4 py-7 sm:px-safe-6 md:py-10">
          {children}
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
