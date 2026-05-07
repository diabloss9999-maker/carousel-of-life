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
        className="sticky top-0 z-40 border-b border-primary/20 shadow-sm"
        style={{
          backgroundImage: "url(/header-bg.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="relative mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-2 pl-20 pr-2 sm:h-20 sm:pl-28 sm:pr-28 md:pl-32 md:pr-32">
          <Link
            href={ROUTES.today}
            className="font-mystic text-base font-semibold tracking-tight text-[#3a2554] hover:text-[#5b2db8] transition-colors drop-shadow-sm whitespace-nowrap sm:text-lg md:text-xl"
          >
            {siteConfig.name}
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {mainNav
              .filter((item) => item.href !== ROUTES.settings)
              .map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-[#5b3a8a] hover:bg-white/50 hover:text-[#3a2554] transition-colors"
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    {item.label}
                  </Link>
                );
              })}
          </nav>

          <form action={signOutAction}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="rounded-full bg-white/60 text-[#5b3a8a] hover:bg-white/80 hover:text-[#3a2554] backdrop-blur-sm shadow-sm"
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

      <nav
        className="sticky bottom-0 z-30 border-t border-primary/20 backdrop-blur md:hidden"
        style={{
          background: "oklch(0.82 0.08 295 / 0.92)",
        }}
      >
        <div className="mx-auto flex max-w-5xl items-stretch justify-around">
          {mainNav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-1 flex-col items-center gap-0.5 px-2 py-2 text-xs text-[#5b3a8a] hover:text-[#3a2554] transition-colors"
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
