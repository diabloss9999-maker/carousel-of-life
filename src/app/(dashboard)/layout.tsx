import Link from "next/link";
import { LogOut } from "lucide-react";

import { TimeAwareHeader } from "@/components/layout/time-aware-header";
import { DesktopNav } from "@/components/layout/desktop-nav";
import { MobileNav } from "@/components/layout/mobile-nav";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { siteConfig } from "@/config/site";
import { signOutAction } from "@/lib/auth/actions";
import { requireUser } from "@/lib/auth/get-user";

/**
 * 대시보드 공용 레이아웃.
 *
 * 모바일 대응:
 * - 헤더에 `pt-safe` 적용 (iPhone Dynamic Island / Galaxy 펀치홀 영역 침범 방지)
 * - 본문에 `px-safe-*` 적용 (landscape 노치 영역 가독성 확보)
 * - 하단 모바일 nav는 `MobileNav` 컴포넌트가 `pb-safe` 처리
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();

  return (
    <div className="flex min-h-screen flex-col">
      <TimeAwareHeader
        className="sticky top-0 z-40 pt-safe"
        style={{
          background: `url("/nav/desktop_nav_bg.svg") center / 100% 64px no-repeat,
                       linear-gradient(to bottom, rgba(251,247,239,.9), rgba(251,247,239,.82))`,
          boxShadow: "0 10px 28px rgba(43,33,56,.08)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
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
