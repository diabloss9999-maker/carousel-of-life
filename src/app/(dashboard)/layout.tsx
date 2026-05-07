import Link from "next/link";

import { Button } from "@/components/ui/button";
import { mainNav } from "@/config/navigation";
import { ROUTES } from "@/lib/constants";
import { siteConfig } from "@/config/site";
import { signOutAction } from "@/lib/auth/actions";
import { requireUser } from "@/lib/auth/get-user";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();

  return (
    <div className="flex min-h-screen flex-col">
      <header
        className="sticky top-0 z-40 border-b border-[oklch(0.76_0.14_80)]/30 shadow-md"
        style={{
          backgroundImage: "url(/header-bg.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="relative mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-2 pl-20 pr-2 sm:h-20 sm:pl-28 sm:pr-28 md:pl-32 md:pr-32">
          {/* 로고 — 골드 */}
          <Link
            href={ROUTES.today}
            className="font-mystic text-base font-semibold tracking-tight whitespace-nowrap sm:text-lg md:text-xl transition-opacity hover:opacity-80"
            style={{ color: "oklch(0.88 0.14 82)" }}
          >
            {siteConfig.name}
          </Link>

          {/* 데스크톱 네비 */}
          <nav className="hidden items-center gap-1 md:flex">
            {mainNav
              .filter((item) => item.href !== ROUTES.settings)
              .map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all
                      text-[oklch(0.93_0.018_85)] hover:text-[oklch(0.88_0.14_82)] hover:bg-[oklch(0.76_0.14_80/0.15)]"
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    {item.label}
                  </Link>
                );
              })}
          </nav>

          {/* 로그아웃 */}
          <form action={signOutAction}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="rounded-full border backdrop-blur-sm shadow-sm text-sm font-medium transition-all"
              style={{
                color: "oklch(0.88 0.14 82)",
                borderColor: "oklch(0.76 0.14 80 / 0.5)",
                background: "oklch(0.76 0.14 80 / 0.12)",
              }}
            >
              로그아웃
            </Button>
          </form>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto w-full max-w-5xl px-6 py-8 md:py-12">
          {children}
        </div>
      </main>

      {/* 모바일 하단 네비 */}
      <nav
        className="sticky bottom-0 z-30 border-t backdrop-blur-md md:hidden"
        style={{
          background: "oklch(0.12 0.03 55 / 0.93)",
          borderColor: "oklch(0.76 0.14 80 / 0.30)",
        }}
      >
        <div className="mx-auto flex max-w-5xl items-stretch justify-around">
          {mainNav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-1 flex-col items-center gap-0.5 px-2 py-2 text-xs transition-colors"
                style={{ color: "oklch(0.82 0.10 82)" }}
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
