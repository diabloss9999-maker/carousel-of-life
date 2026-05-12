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
      <RitualBody crackLevel={crackData.level} />

      {/* 헤더 — ritual-chat-menu 다크 글래스 */}
      <TimeAwareHeader
        className="sticky top-0 z-40 pt-safe ritual-chat-menu"
        style={{
          background: `var(--header-bg)`,
          boxShadow: "var(--header-shadow)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: "1px solid var(--header-border)",
        } as React.CSSProperties}
      >
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link
            href={ROUTES.today}
            className="font-mystic whitespace-nowrap text-lg font-semibold tracking-tight transition-opacity hover:opacity-75"
            style={{ color: "var(--ritual-text)", letterSpacing: "0.04em" }}
          >
            {siteConfig.name}
          </Link>

          <DesktopNav />

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
